const path = require('path');
const {
    ROLE_KEYS,
    ROLE_LABELS,
    PERMISSIONS,
    hasPermission,
    normalizePermissions
} = require('./permissions');
const {
    syncUserFinancialProfile,
    buildDashboardCards,
    toNumber
} = require('./service');

const BACKOFFICE_TOKEN_KIND = 'backoffice';

const getTokenFromRequest = (req) => {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    return req.headers['x-backoffice-token'] || null;
};

const loadAdminWithPermissionsByField = async (query, field, value) => {
    const adminRows = await query(`
        SELECT
            a.id,
            a.role_id,
            a.username,
            a.full_name,
            a.email,
            a.password_hash,
            a.status,
            a.last_login_at,
            ar.role_key,
            ar.label AS role_label
        FROM admins a
        JOIN admin_roles ar ON ar.id = a.role_id
        WHERE ${field} = ?
        LIMIT 1
    `, [value]);

    if (!adminRows.length) {
        return null;
    }

    const admin = adminRows[0];
    const permissionRows = await query(`
        SELECT permission_key
        FROM admin_role_permissions
        WHERE role_id = ?
        ORDER BY permission_key ASC
    `, [admin.role_id]);

    admin.permissions = permissionRows.map((row) => row.permission_key);
    return admin;
};

const serializeAdmin = (adminRow) => ({
    id: adminRow.id,
    username: adminRow.username,
    fullName: adminRow.full_name,
    email: adminRow.email,
    roleKey: adminRow.role_key,
    roleLabel: adminRow.role_label || ROLE_LABELS[adminRow.role_key] || adminRow.role_key,
    permissions: normalizePermissions(adminRow.permissions),
    lastLoginAt: adminRow.last_login_at
});

const signBackofficeToken = (jwt, admin) => jwt.sign(
    {
        kind: BACKOFFICE_TOKEN_KIND,
        adminId: admin.id,
        roleKey: admin.roleKey,
        permissions: admin.permissions
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '12h' }
);

const createBackofficeAuth = ({ query, jwt }) => {
    const authenticateBackoffice = async (req, res, next) => {
        try {
            const token = getTokenFromRequest(req);
            if (!token) {
                return res.status(401).json({ success: false, message: 'Backoffice token bulunamadı.' });
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            if (payload.kind !== BACKOFFICE_TOKEN_KIND) {
                return res.status(403).json({ success: false, message: 'Geçersiz backoffice token.' });
            }

            const adminRow = await loadAdminWithPermissionsByField(query, 'a.id', payload.adminId);
            if (!adminRow || adminRow.status !== 'ACTIVE') {
                return res.status(403).json({ success: false, message: 'Backoffice hesabı pasif.' });
            }

            req.backoffice = serializeAdmin(adminRow);
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Oturum doğrulanamadı.' });
        }
    };

    const authorizeBackoffice = (permissionKey) => (req, res, next) => {
        if (!hasPermission(req.backoffice, permissionKey)) {
            return res.status(403).json({ success: false, message: 'Bu alan için yetkiniz yok.' });
        }
        next();
    };

    return {
        authenticateBackoffice,
        authorizeBackoffice
    };
};

const registerBackofficeRoutes = ({ app, query, bcrypt, jwt, rootDir }) => {
    const { authenticateBackoffice, authorizeBackoffice } = createBackofficeAuth({ query, jwt });

    app.get('/admin/backoffice/login', (req, res) => res.redirect('/admin/login'));
    app.get('/admin/backoffice', (req, res) => res.redirect('/admin/dashboard'));

    app.get('/backoffice/login', (req, res) => res.redirect('/admin/login'));
    app.get('/backoffice', (req, res) => res.redirect('/admin/dashboard'));

    app.post('/api/backoffice/auth/login', async (req, res) => {
        try {
            const username = (req.body.username || req.body.user || '').trim();
            const password = (req.body.password || req.body.pass || '').trim();

            if (!username || !password) {
                return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre zorunlu.' });
            }

            const adminRow = await loadAdminWithPermissionsByField(query, 'a.username', username);
            if (!adminRow || adminRow.status !== 'ACTIVE') {
                return res.status(401).json({ success: false, message: 'Backoffice hesabı bulunamadı.' });
            }

            const passwordMatch = await bcrypt.compare(password, adminRow.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ success: false, message: 'Şifre hatalı.' });
            }

            await query('UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?', [adminRow.id]);

            const admin = serializeAdmin(adminRow);
            const token = signBackofficeToken(jwt, admin);

            return res.json({ success: true, token, admin });
        } catch (error) {
            console.error('Backoffice login error:', error);
            return res.status(500).json({ success: false, message: 'Backoffice login sırasında hata oluştu.' });
        }
    });

    app.get('/api/backoffice/auth/me', authenticateBackoffice, (req, res) => {
        res.json({ success: true, admin: req.backoffice });
    });

    app.get('/api/backoffice/dashboard', authenticateBackoffice, authorizeBackoffice(PERMISSIONS.DASHBOARD_VIEW), async (req, res) => {
        try {
            const summaryRows = await query(`
                SELECT
                    COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'approved' AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_incoming,
                    COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'approved' AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_outgoing,
                    COUNT(*) FILTER (WHERE status = 'pending') AS pending_transactions
                FROM transactions
            `);

            const activePlayersRows = await query(`
                SELECT COUNT(*) AS active_players
                FROM users
                WHERE role = 'user'
                  AND status = 'active'
                  AND last_login >= NOW() - INTERVAL '24 hours'
            `);

            const openTicketsRows = await query(`
                SELECT COUNT(*) AS open_tickets
                FROM tickets
                WHERE status IN ('OPEN', 'PENDING')
            `);

            const highRiskRows = await query(`
                SELECT COUNT(*) AS high_risk_players
                FROM users
                WHERE role = 'user'
                  AND risk_score >= 80
            `);

            const notesTodayRows = await query(`
                SELECT COUNT(*) AS notes_today
                FROM notes
                WHERE created_at::date = CURRENT_DATE
            `);

            const stats = {
                ...(summaryRows[0] || {}),
                active_players: activePlayersRows[0]?.active_players || 0,
                open_tickets: openTicketsRows[0]?.open_tickets || 0,
                high_risk_players: highRiskRows[0]?.high_risk_players || 0,
                notes_today: notesTodayRows[0]?.notes_today || 0
            };

            const highRiskPlayers = await query(`
                SELECT id, username, loyalty_level, risk_score, balance
                FROM users
                WHERE role = 'user'
                  AND risk_score >= 70
                ORDER BY risk_score DESC, total_deposit DESC
                LIMIT 6
            `);

            const openTickets = await query(`
                SELECT
                    t.id,
                    t.subject,
                    t.status,
                    t.priority,
                    t.updated_at,
                    u.id AS user_id,
                    u.username
                FROM tickets t
                LEFT JOIN users u ON u.id = t.user_id
                WHERE t.status IN ('OPEN', 'PENDING')
                ORDER BY t.updated_at DESC
                LIMIT 6
            `);

            let pendingTransactions = [];
            if (hasPermission(req.backoffice, PERMISSIONS.DASHBOARD_FINANCIAL)) {
                pendingTransactions = await query(`
                    SELECT
                        t.id,
                        t.amount,
                        t.type,
                        t.status,
                        t.created_at,
                        u.id AS user_id,
                        u.username
                    FROM transactions t
                    JOIN users u ON u.id = t.user_id
                    WHERE t.status = 'pending'
                    ORDER BY t.created_at DESC
                    LIMIT 6
                `);
            }

            return res.json({
                success: true,
                actor: req.backoffice,
                cards: buildDashboardCards(req.backoffice.roleKey, stats),
                queues: {
                    highRiskPlayers,
                    openTickets,
                    pendingTransactions
                }
            });
        } catch (error) {
            console.error('Backoffice dashboard error:', error);
            return res.status(500).json({ success: false, message: 'Dashboard yüklenemedi.' });
        }
    });

    app.get('/api/backoffice/search', authenticateBackoffice, authorizeBackoffice(PERMISSIONS.SEARCH_GLOBAL), async (req, res) => {
        try {
            const rawQuery = String(req.query.q || '').trim();
            if (rawQuery.length < 3) {
                return res.json({ success: true, query: rawQuery, groups: { users: [], transactions: [], tickets: [] } });
            }

            const likeQuery = `%${rawQuery}%`;

            const users = await query(`
                SELECT
                    id,
                    username,
                    email,
                    loyalty_level,
                    risk_score,
                    balance
                FROM users
                WHERE role = 'user'
                  AND (
                    username ILIKE ?
                    OR email ILIKE ?
                    OR CAST(id AS TEXT) ILIKE ?
                  )
                ORDER BY risk_score DESC, last_login DESC NULLS LAST
                LIMIT 6
            `, [likeQuery, likeQuery, likeQuery]);

            let transactions = [];
            if (hasPermission(req.backoffice, PERMISSIONS.TRANSACTIONS_READ)) {
                transactions = await query(`
                    SELECT
                        t.id,
                        t.user_id,
                        t.amount,
                        t.type,
                        t.status,
                        t.created_at,
                        u.username
                    FROM transactions t
                    JOIN users u ON u.id = t.user_id
                    WHERE
                        u.username ILIKE ?
                        OR t.method ILIKE ?
                        OR CAST(t.amount AS TEXT) ILIKE ?
                        OR CAST(t.id AS TEXT) ILIKE ?
                    ORDER BY t.created_at DESC
                    LIMIT 6
                `, [likeQuery, likeQuery, likeQuery, likeQuery]);
            }

            let tickets = [];
            if (hasPermission(req.backoffice, PERMISSIONS.TICKETS_READ)) {
                tickets = await query(`
                    SELECT
                        t.id,
                        t.user_id,
                        t.subject,
                        t.status,
                        t.priority,
                        t.updated_at,
                        u.username
                    FROM tickets t
                    LEFT JOIN users u ON u.id = t.user_id
                    WHERE
                        t.subject ILIKE ?
                        OR COALESCE(t.last_message, '') ILIKE ?
                        OR COALESCE(u.username, '') ILIKE ?
                        OR CAST(t.id AS TEXT) ILIKE ?
                    ORDER BY t.updated_at DESC
                    LIMIT 6
                `, [likeQuery, likeQuery, likeQuery, likeQuery]);
            }

            return res.json({
                success: true,
                query: rawQuery,
                groups: {
                    users,
                    transactions,
                    tickets
                }
            });
        } catch (error) {
            console.error('Backoffice search error:', error);
            return res.status(500).json({ success: false, message: 'Global arama başarısız oldu.' });
        }
    });

    app.get('/api/backoffice/players/:id', authenticateBackoffice, authorizeBackoffice(PERMISSIONS.CRM_READ), async (req, res) => {
        try {
            const userId = Number(req.params.id);
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Geçersiz oyuncu ID.' });
            }

            const userRows = await query(`
                SELECT
                    id,
                    username,
                    email,
                    phone,
                    status,
                    verification_status,
                    balance,
                    bonus_balance,
                    total_deposit,
                    total_withdraw,
                    ggr,
                    loyalty_level,
                    risk_score,
                    created_at,
                    last_login
                FROM users
                WHERE id = ?
                  AND role = 'user'
                LIMIT 1
            `, [userId]);

            if (!userRows.length) {
                return res.status(404).json({ success: false, message: 'Oyuncu bulunamadı.' });
            }

            const player = userRows[0];
            const financialSync = await syncUserFinancialProfile(query, userId);

            const notes = await query(`
                SELECT
                    n.id,
                    n.note_type,
                    n.note_text,
                    n.visibility,
                    n.created_at,
                    a.full_name AS admin_name,
                    a.username AS admin_username
                FROM notes n
                LEFT JOIN admins a ON a.id = n.admin_id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT 20
            `, [userId]);

            const transactions = await query(`
                SELECT
                    id,
                    amount,
                    type,
                    status,
                    method,
                    created_at,
                    processed_at,
                    admin_note
                FROM transactions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 12
            `, [userId]);

            const tickets = await query(`
                SELECT
                    id,
                    subject,
                    status,
                    priority,
                    channel,
                    updated_at
                FROM tickets
                WHERE user_id = ?
                ORDER BY updated_at DESC
                LIMIT 8
            `, [userId]);

            const sharedIps = await query(`
                SELECT
                    ip_address::text AS ip_address,
                    COUNT(DISTINCT user_id) AS account_count,
                    MAX(last_seen_at) AS last_seen_at
                FROM user_ip_logs
                WHERE ip_address IN (
                    SELECT ip_address
                    FROM user_ip_logs
                    WHERE user_id = ?
                )
                GROUP BY ip_address
                HAVING COUNT(DISTINCT user_id) > 1
                ORDER BY account_count DESC, last_seen_at DESC
            `, [userId]);

            const updatedMetrics = financialSync.metrics || player;
            const withdrawRatio = financialSync.withdrawToDepositRatio || 0;

            return res.json({
                success: true,
                player: {
                    ...player,
                    balance: toNumber(updatedMetrics.balance || player.balance),
                    bonus_balance: toNumber(updatedMetrics.bonus_balance || player.bonus_balance),
                    total_deposit: toNumber(updatedMetrics.total_deposit || player.total_deposit),
                    total_withdraw: toNumber(updatedMetrics.total_withdraw || player.total_withdraw),
                    ggr: toNumber(updatedMetrics.ggr || player.ggr),
                    loyalty_level: updatedMetrics.loyalty_level || player.loyalty_level,
                    risk_score: toNumber(updatedMetrics.risk_score || player.risk_score)
                },
                widgets: [
                    { id: 'main_balance', label: 'Ana Kasa', value: toNumber(updatedMetrics.balance || player.balance), prefix: '₺' },
                    { id: 'bonus_balance', label: 'Bonus Kasası', value: toNumber(updatedMetrics.bonus_balance || player.bonus_balance), prefix: '₺' },
                    { id: 'total_deposit', label: 'Toplam Yatırım', value: toNumber(updatedMetrics.total_deposit || player.total_deposit), prefix: '₺' },
                    { id: 'total_withdraw', label: 'Toplam Çekim', value: toNumber(updatedMetrics.total_withdraw || player.total_withdraw), prefix: '₺' },
                    { id: 'ggr', label: 'GGR', value: toNumber(updatedMetrics.ggr || player.ggr), prefix: '₺' }
                ],
                fraud: {
                    hasMultiAccounting: financialSync.relatedAccounts.length > 0,
                    withdrawToDepositRatio: Number(withdrawRatio.toFixed(2)),
                    riskScore: toNumber(updatedMetrics.risk_score || player.risk_score),
                    relatedAccounts: financialSync.relatedAccounts,
                    sharedIps
                },
                notes,
                transactions,
                tickets
            });
        } catch (error) {
            console.error('Backoffice player dashboard error:', error);
            return res.status(500).json({ success: false, message: 'Oyuncu paneli yüklenemedi.' });
        }
    });

    app.post('/api/backoffice/players/:id/notes', authenticateBackoffice, authorizeBackoffice(PERMISSIONS.NOTES_WRITE), async (req, res) => {
        try {
            const userId = Number(req.params.id);
            const noteText = String(req.body.noteText || '').trim();
            const noteType = String(req.body.noteType || 'GENERAL').trim().toUpperCase();
            const visibility = String(req.body.visibility || 'INTERNAL').trim().toUpperCase();

            if (!userId || noteText.length < 3) {
                return res.status(400).json({ success: false, message: 'Not metni çok kısa.' });
            }

            const playerRows = await query('SELECT id FROM users WHERE id = ? AND role = ?', [userId, 'user']);
            if (!playerRows.length) {
                return res.status(404).json({ success: false, message: 'Oyuncu bulunamadı.' });
            }

            const inserted = await query(`
                INSERT INTO notes (user_id, admin_id, note_type, note_text, visibility, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
                RETURNING id, user_id, admin_id, note_type, note_text, visibility, created_at
            `, [userId, req.backoffice.id, noteType, noteText, visibility]);

            const createdNote = inserted.rows?.[0] || inserted[0];

            return res.json({
                success: true,
                note: {
                    ...createdNote,
                    admin_name: req.backoffice.fullName,
                    admin_username: req.backoffice.username
                }
            });
        } catch (error) {
            console.error('Backoffice note create error:', error);
            return res.status(500).json({ success: false, message: 'Not kaydedilemedi.' });
        }
    });
};

module.exports = {
    BACKOFFICE_TOKEN_KIND,
    getTokenFromRequest,
    loadAdminWithPermissionsByField,
    serializeAdmin,
    signBackofficeToken,
    registerBackofficeRoutes
};
