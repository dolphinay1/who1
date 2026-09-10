const { ROLE_KEYS } = require('./permissions');

const LOYALTY_LEVELS = [
    { threshold: 250000, level: 'BALINA' },
    { threshold: 50000, level: 'VIP' },
    { threshold: 15000, level: 'PLATINUM' },
    { threshold: 5000, level: 'GOLD' },
    { threshold: 1000, level: 'SILVER' },
    { threshold: 0, level: 'BRONZE' }
];

const resolveLoyaltyLevel = (totalDeposit = 0) => {
    const normalizedDeposit = Number(totalDeposit) || 0;
    return LOYALTY_LEVELS.find((item) => normalizedDeposit >= item.threshold)?.level || 'BRONZE';
};

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    return Number(value) || 0;
};

const computeRiskScore = ({ withdrawToDepositRatio, relatedAccountsCount }) => {
    let riskScore = 0;

    if (withdrawToDepositRatio > 500) {
        riskScore = Math.max(riskScore, 82);
    }

    if (withdrawToDepositRatio > 800) {
        riskScore = Math.max(riskScore, 90);
    }

    if (relatedAccountsCount > 0) {
        riskScore = Math.max(riskScore, 95);
    }

    return Math.min(100, riskScore);
};

const upsertUserIpLog = async (query, userId, ipAddress, userAgent = '', source = 'web') => {
    if (!userId || !ipAddress) return null;

    const sql = `
        INSERT INTO user_ip_logs (user_id, ip_address, user_agent, source, first_seen_at, last_seen_at, login_count)
        VALUES (?, ?::inet, ?, ?, NOW(), NOW(), 1)
        ON CONFLICT (user_id, ip_address)
        DO UPDATE SET
            user_agent = EXCLUDED.user_agent,
            source = EXCLUDED.source,
            last_seen_at = NOW(),
            login_count = user_ip_logs.login_count + 1
        RETURNING *
    `;

    const result = await query(sql, [userId, ipAddress, userAgent || '', source]);
    return result?.rows?.[0] || result?.[0] || null;
};

const syncUserFinancialProfile = async (query, userId) => {
    const financialRows = await query(`
        SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' AND status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) AS total_deposit,
            COALESCE(SUM(CASE WHEN type = 'withdraw' AND status IN ('approved', 'completed') THEN amount ELSE 0 END), 0) AS total_withdraw,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_transactions
        FROM transactions
        WHERE user_id = ?
    `, [userId]);

    const financial = financialRows[0] || {};
    const totalDeposit = toNumber(financial.total_deposit);
    const totalWithdraw = toNumber(financial.total_withdraw);
    const ggr = totalDeposit - totalWithdraw;
    const withdrawToDepositRatio = totalDeposit > 0 ? (totalWithdraw / totalDeposit) * 100 : 0;

    const relatedAccounts = await query(`
        SELECT DISTINCT
            u.id,
            u.username,
            logs.ip_address::text AS ip_address
        FROM user_ip_logs logs
        JOIN users u ON u.id = logs.user_id
        WHERE logs.ip_address IN (
            SELECT ip_address
            FROM user_ip_logs
            WHERE user_id = ?
        )
        AND logs.user_id <> ?
        ORDER BY u.username ASC
        LIMIT 10
    `, [userId, userId]);

    const riskScore = computeRiskScore({
        withdrawToDepositRatio,
        relatedAccountsCount: relatedAccounts.length
    });

    const loyaltyLevel = resolveLoyaltyLevel(totalDeposit);

    const updatedRows = await query(`
        UPDATE users
        SET
            total_deposit = ?,
            total_withdraw = ?,
            ggr = ?,
            loyalty_level = ?,
            risk_score = ?,
            last_risk_review_at = NOW()
        WHERE id = ?
        RETURNING id, total_deposit, total_withdraw, ggr, loyalty_level, risk_score, bonus_balance, balance
    `, [totalDeposit, totalWithdraw, ggr, loyaltyLevel, riskScore, userId]);

    return {
        metrics: updatedRows.rows?.[0] || updatedRows[0] || null,
        withdrawToDepositRatio,
        relatedAccounts
    };
};

const buildDashboardCards = (roleKey, stats) => {
    const activePlayers = toNumber(stats.active_players);
    const pendingTransactions = toNumber(stats.pending_transactions);
    const todayIncoming = toNumber(stats.today_incoming);
    const todayOutgoing = toNumber(stats.today_outgoing);
    const openTickets = toNumber(stats.open_tickets);
    const highRiskPlayers = toNumber(stats.high_risk_players);
    const notesToday = toNumber(stats.notes_today);

    if (roleKey === ROLE_KEYS.SUPPORT) {
        return [
            { id: 'activePlayers', label: 'Aktif Oyuncu', value: activePlayers, tone: 'info', icon: 'users' },
            { id: 'openTickets', label: 'Açık Ticket', value: openTickets, tone: 'warning', icon: 'headset' },
            { id: 'highRiskPlayers', label: 'Risk Alarmı', value: highRiskPlayers, tone: 'danger', icon: 'shield-exclamation' },
            { id: 'notesToday', label: 'Bugün Not', value: notesToday, tone: 'success', icon: 'note-sticky' }
        ];
    }

    return [
        { id: 'todayIncoming', label: 'Bugün Giren', value: todayIncoming, tone: 'success', icon: 'arrow-down' },
        { id: 'todayOutgoing', label: 'Bugün Çıkan', value: todayOutgoing, tone: 'danger', icon: 'arrow-up' },
        { id: 'activePlayers', label: 'Aktif Oyuncu', value: activePlayers, tone: 'info', icon: 'users' },
        { id: 'pendingTransactions', label: 'Bekleyen İşlem', value: pendingTransactions, tone: 'warning', icon: 'clock' }
    ];
};

module.exports = {
    resolveLoyaltyLevel,
    computeRiskScore,
    upsertUserIpLog,
    syncUserFinancialProfile,
    buildDashboardCards,
    toNumber
};
