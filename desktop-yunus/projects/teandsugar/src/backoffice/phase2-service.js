const { toNumber } = require('./service');

const SETTLED_TRANSACTION_STATUSES = ['approved', 'completed'];
const SETTLED_STATUS_SQL = "('approved', 'completed')";

const PAYMENT_METHOD_DEFAULTS = [
    { method_key: 'papara', label: 'Papara', transaction_type: 'deposit', min_amount: 100, max_amount: 75000, sort_order: 10 },
    { method_key: 'papara', label: 'Papara', transaction_type: 'withdraw', min_amount: 200, max_amount: 50000, sort_order: 11 },
    { method_key: 'havale', label: 'Havale / EFT', transaction_type: 'deposit', min_amount: 250, max_amount: 150000, sort_order: 20 },
    { method_key: 'havale', label: 'Havale / EFT', transaction_type: 'withdraw', min_amount: 300, max_amount: 100000, sort_order: 21 },
    { method_key: 'bitcoin', label: 'Bitcoin', transaction_type: 'deposit', min_amount: 500, max_amount: 500000, sort_order: 30 },
    { method_key: 'ethereum', label: 'Ethereum', transaction_type: 'deposit', min_amount: 500, max_amount: 500000, sort_order: 31 }
];

const normalizeKey = (value = '') => String(value || '').trim().toLowerCase();
const normalizeUpper = (value = '') => String(value || '').trim().toUpperCase();
const stringifyJson = (value) => JSON.stringify(value ?? {});

const parseMaybeJson = (value, fallback = {}) => {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return fallback;
    }
};

const ensurePhase2Defaults = async (query) => {
    for (const config of PAYMENT_METHOD_DEFAULTS) {
        await query(`
            INSERT INTO payment_method_limits (
                method_key,
                label,
                transaction_type,
                min_amount,
                max_amount,
                currency,
                is_active,
                sort_order
            )
            VALUES (?, ?, ?, ?, ?, 'TRY', TRUE, ?)
            ON CONFLICT (method_key, transaction_type)
            DO NOTHING
        `, [
            config.method_key,
            config.label,
            config.transaction_type,
            config.min_amount,
            config.max_amount,
            config.sort_order
        ]);
    }

    const defaultSettings = {
        btc_confirmations_required: '3',
        eth_confirmations_required: '12',
        fast_track_withdraw_limit: '10000',
        rtp_kill_switch_threshold: '150',
        payment_provider_name: 'Mock Fast-Track Provider',
        payment_provider_api_url: '',
        payment_provider_api_key: '',
        crypto_webhook_secret: '',
        telegram_bot_token: '',
        telegram_chat_id: ''
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
        await query(`
            INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON CONFLICT (setting_key)
            DO NOTHING
        `, [key, value]);
    }
};

const getSettingsMap = async (query, keys = []) => {
    let rows = [];
    if (Array.isArray(keys) && keys.length > 0) {
        rows = await query(`
            SELECT setting_key, setting_value
            FROM settings
            WHERE setting_key = ANY(?::text[])
        `, [keys]);
    } else {
        rows = await query(`
            SELECT setting_key, setting_value
            FROM settings
        `);
    }

    return rows.reduce((acc, row) => {
        acc[row.setting_key] = row.setting_value;
        return acc;
    }, {});
};

const listPaymentMethods = async (query) => query(`
    SELECT
        id,
        method_key,
        label,
        transaction_type,
        min_amount,
        max_amount,
        currency,
        is_active,
        sort_order,
        updated_at
    FROM payment_method_limits
    ORDER BY sort_order ASC, label ASC, transaction_type ASC
`);

const upsertPaymentMethod = async (query, payload, adminId = null) => {
    const methodKey = normalizeKey(payload.methodKey);
    const transactionType = normalizeKey(payload.transactionType);
    const label = String(payload.label || '').trim() || methodKey.toUpperCase();
    const minAmount = Number(payload.minAmount);
    const maxAmount = Number(payload.maxAmount);
    const currency = String(payload.currency || 'TRY').trim().toUpperCase();
    const isActive = payload.isActive !== false;
    const sortOrder = Number(payload.sortOrder || 0);

    if (!methodKey || !transactionType) {
        throw new Error('Yöntem anahtarı ve işlem tipi zorunludur.');
    }
    if (!['deposit', 'withdraw'].includes(transactionType)) {
        throw new Error('İşlem tipi deposit veya withdraw olmalıdır.');
    }
    if (!Number.isFinite(minAmount) || !Number.isFinite(maxAmount) || minAmount < 0 || maxAmount <= 0 || minAmount > maxAmount) {
        throw new Error('Alt ve üst limitler geçersiz.');
    }

    const result = await query(`
        INSERT INTO payment_method_limits (
            method_key,
            label,
            transaction_type,
            min_amount,
            max_amount,
            currency,
            is_active,
            sort_order,
            updated_by_admin_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (method_key, transaction_type)
        DO UPDATE SET
            label = EXCLUDED.label,
            min_amount = EXCLUDED.min_amount,
            max_amount = EXCLUDED.max_amount,
            currency = EXCLUDED.currency,
            is_active = EXCLUDED.is_active,
            sort_order = EXCLUDED.sort_order,
            updated_by_admin_id = EXCLUDED.updated_by_admin_id,
            updated_at = NOW()
        RETURNING *
    `, [methodKey, label, transactionType, minAmount, maxAmount, currency, isActive, sortOrder, adminId]);

    return result.rows?.[0] || result?.[0] || null;
};

const deletePaymentMethod = async (query, methodId) => {
    const result = await query(`
        DELETE FROM payment_method_limits
        WHERE id = ?
        RETURNING id
    `, [methodId]);

    return Boolean(result.rows?.[0] || result?.[0]);
};

const getPaymentMethodConfig = async (query, methodKey, transactionType) => {
    const rows = await query(`
        SELECT *
        FROM payment_method_limits
        WHERE method_key = ?
          AND transaction_type = ?
        LIMIT 1
    `, [normalizeKey(methodKey), normalizeKey(transactionType)]);

    return rows[0] || null;
};

const validateTransactionRequest = ({
    amount,
    type,
    methodConfig,
    fallbackMinDeposit = 50,
    fallbackMinWithdraw = 100
}) => {
    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return { ok: false, message: 'Geçersiz tutar.' };
    }

    const minAmount = methodConfig?.min_amount != null
        ? Number(methodConfig.min_amount)
        : (type === 'deposit' ? fallbackMinDeposit : fallbackMinWithdraw);
    const maxAmount = methodConfig?.max_amount != null
        ? Number(methodConfig.max_amount)
        : Number.MAX_SAFE_INTEGER;

    if (methodConfig && methodConfig.is_active === false) {
        return { ok: false, message: 'Bu ödeme yöntemi şu anda pasif.' };
    }
    if (normalizedAmount < minAmount) {
        return { ok: false, message: `Minimum ${type === 'deposit' ? 'yatırım' : 'çekim'} tutarı ${minAmount} TL!` };
    }
    if (normalizedAmount > maxAmount) {
        return { ok: false, message: `Maksimum ${type === 'deposit' ? 'yatırım' : 'çekim'} tutarı ${maxAmount} TL!` };
    }

    return {
        ok: true,
        amount: normalizedAmount,
        minAmount,
        maxAmount
    };
};

const shouldFastTrackWithdrawal = ({ user, amount, settingsMap }) => {
    const loyaltyLevel = normalizeUpper(user?.loyalty_level);
    const riskScore = Number(user?.risk_score || 0);
    const limit = Number(settingsMap.fast_track_withdraw_limit || 10000);

    if (!['VIP', 'BALINA'].includes(loyaltyLevel)) return false;
    if (!Number.isFinite(limit) || Number(amount) >= limit) return false;
    if (riskScore >= 70) return false;

    return true;
};

const sendFastTrackPayout = async ({ fetchFn, settingsMap, transaction, user }) => {
    const providerName = settingsMap.payment_provider_name || 'Mock Fast-Track Provider';
    const endpoint = String(settingsMap.payment_provider_api_url || '').trim();
    const apiKey = String(settingsMap.payment_provider_api_key || '').trim();

    const payload = {
        transactionId: transaction.id,
        userId: user.id,
        username: user.username,
        amount: Number(transaction.amount),
        method: transaction.method,
        loyaltyLevel: user.loyalty_level || 'BRONZE'
    };

    if (!endpoint) {
        return {
            ok: true,
            simulated: true,
            providerName,
            providerReference: `MOCK-${Date.now()}`,
            response: { accepted: true, simulated: true }
        };
    }

    const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify(payload)
    });

    const bodyText = await response.text();
    const parsedBody = parseMaybeJson(bodyText, { raw: bodyText });
    if (!response.ok) {
        return {
            ok: false,
            providerName,
            message: parsedBody?.message || 'Ödeme sağlayıcısı hatası.',
            response: parsedBody
        };
    }

    return {
        ok: true,
        providerName,
        providerReference: parsedBody.reference || parsedBody.providerReference || `PAY-${Date.now()}`,
        response: parsedBody
    };
};

const getFinanceQueue = async (query) => {
    const queue = await query(`
        SELECT
            t.id,
            t.user_id,
            t.amount,
            t.type,
            t.method,
            t.status,
            t.asset_symbol,
            t.network,
            t.tx_hash,
            t.confirmations,
            t.required_confirmations,
            t.auto_processed,
            t.processed_via,
            t.review_reason,
            t.provider_reference,
            t.admin_note,
            t.created_at,
            u.username,
            u.balance,
            u.risk_score,
            u.loyalty_level
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        WHERE t.status = 'pending'
        ORDER BY
            CASE WHEN u.loyalty_level IN ('BALINA', 'VIP') THEN 0 ELSE 1 END,
            t.created_at ASC
    `);

    const summaryRows = await query(`
        SELECT
            COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'pending' THEN amount ELSE 0 END), 0) AS pending_deposit_total,
            COUNT(*) FILTER (WHERE type = 'deposit' AND status = 'pending') AS pending_deposit_count,
            COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'pending' THEN amount ELSE 0 END), 0) AS pending_withdraw_total,
            COUNT(*) FILTER (WHERE type = 'withdraw' AND status = 'pending') AS pending_withdraw_count,
            COALESCE(SUM(CASE WHEN status IN ${SETTLED_STATUS_SQL} AND processed_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_approved_total,
            COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today_total_count
        FROM transactions
    `);

    return {
        summary: summaryRows[0] || {},
        items: queue.map((item) => ({
            ...item,
            amount: toNumber(item.amount),
            balance: toNumber(item.balance),
            risk_score: toNumber(item.risk_score),
            confirmations: Number(item.confirmations || 0),
            required_confirmations: Number(item.required_confirmations || 0),
            fastTrackEligible: item.type === 'withdraw' && ['VIP', 'BALINA'].includes(normalizeUpper(item.loyalty_level)) && Number(item.amount || 0) < 10000
        }))
    };
};

const getRequiredConfirmations = (assetSymbol, settingsMap) => {
    const asset = normalizeUpper(assetSymbol);
    if (asset === 'ETH' || asset === 'ETHEREUM') return Number(settingsMap.eth_confirmations_required || 12);
    if (asset === 'BTC' || asset === 'BITCOIN') return Number(settingsMap.btc_confirmations_required || 3);
    return 1;
};

const resolveCryptoMethodLabel = (assetSymbol) => {
    const asset = normalizeUpper(assetSymbol);
    if (asset === 'ETH' || asset === 'ETHEREUM') return 'Ethereum';
    if (asset === 'BTC' || asset === 'BITCOIN') return 'Bitcoin';
    return asset || 'Crypto';
};

const processCryptoWebhook = async ({
    query,
    payload,
    settingsMap,
    ip,
    saveLog
}) => {
    const assetSymbol = normalizeUpper(payload.assetSymbol || payload.asset || payload.currency);
    const txHash = String(payload.txHash || payload.hash || '').trim();
    const walletAddress = String(payload.walletAddress || payload.address || '').trim();
    const username = String(payload.username || '').trim();
    const userId = Number(payload.userId || 0);
    const network = String(payload.network || assetSymbol).trim();
    const providerName = String(payload.providerName || 'crypto-listener').trim();
    const amount = Number(payload.amount || payload.fiatAmount || 0);
    const rawConfirmations = Number(payload.confirmations || 0);

    if (!txHash || !assetSymbol || !Number.isFinite(amount) || amount <= 0) {
        throw new Error('Webhook verisi eksik veya geçersiz.');
    }

    let targetUser = null;
    if (userId) {
        const rows = await query(`SELECT id, username, balance FROM users WHERE id = ? LIMIT 1`, [userId]);
        targetUser = rows[0] || null;
    } else if (username) {
        const rows = await query(`SELECT id, username, balance FROM users WHERE username = ? LIMIT 1`, [username]);
        targetUser = rows[0] || null;
    }

    if (!targetUser) {
        throw new Error('Webhook için kullanıcı eşleşmesi bulunamadı.');
    }

    const requiredConfirmations = getRequiredConfirmations(assetSymbol, settingsMap);
    const isConfirmed = rawConfirmations >= requiredConfirmations;

    const eventResult = await query(`
        INSERT INTO crypto_webhook_events (
            provider_name,
            asset_symbol,
            network,
            tx_hash,
            wallet_address,
            user_id,
            amount,
            fiat_amount,
            confirmations,
            required_confirmations,
            status,
            payload,
            received_ip
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?)
        ON CONFLICT (tx_hash)
        DO UPDATE SET
            confirmations = EXCLUDED.confirmations,
            required_confirmations = EXCLUDED.required_confirmations,
            fiat_amount = EXCLUDED.fiat_amount,
            status = EXCLUDED.status,
            payload = EXCLUDED.payload,
            received_ip = EXCLUDED.received_ip,
            updated_at = NOW()
        RETURNING *
    `, [
        providerName,
        assetSymbol,
        network,
        txHash,
        walletAddress || null,
        targetUser.id,
        amount,
        amount,
        rawConfirmations,
        requiredConfirmations,
        isConfirmed ? 'CONFIRMED' : 'PENDING',
        stringifyJson(payload),
        ip || null
    ]);

    let transaction = null;
    let wasSettledBefore = false;
    const transactionRows = await query(`
        SELECT *
        FROM transactions
        WHERE tx_hash = ?
           OR provider_reference = ?
        ORDER BY id DESC
        LIMIT 1
    `, [txHash, txHash]);
    transaction = transactionRows[0] || null;
    wasSettledBefore = Boolean(transaction && SETTLED_TRANSACTION_STATUSES.includes(normalizeKey(transaction.status)));

    if (!transaction) {
        const insertResult = await query(`
            INSERT INTO transactions (
                user_id,
                amount,
                type,
                method,
                status,
                asset_symbol,
                network,
                tx_hash,
                provider_reference,
                confirmations,
                required_confirmations,
                processed_via,
                auto_processed,
                review_reason,
                provider_payload
            )
            VALUES (?, ?, 'deposit', ?, ?, ?, ?, ?, ?, ?, ?, 'crypto_webhook', TRUE, ?, ?::jsonb)
            RETURNING *
        `, [
            targetUser.id,
                amount,
                resolveCryptoMethodLabel(assetSymbol),
                'pending',
                assetSymbol,
                network,
                txHash,
            txHash,
            rawConfirmations,
            requiredConfirmations,
            isConfirmed ? 'Blockchain confirmations reached' : 'Awaiting blockchain confirmations',
            stringifyJson(payload)
        ]);
        transaction = insertResult.rows?.[0] || insertResult?.[0] || null;
    } else {
        const updateResult = await query(`
            UPDATE transactions
            SET
                confirmations = ?,
                required_confirmations = ?,
                asset_symbol = COALESCE(asset_symbol, ?),
                network = COALESCE(network, ?),
                provider_payload = ?::jsonb,
                updated_at = NOW()
            WHERE id = ?
            RETURNING *
        `, [
            rawConfirmations,
            requiredConfirmations,
            assetSymbol,
            network,
            stringifyJson(payload),
            transaction.id
        ]);
        transaction = updateResult.rows?.[0] || updateResult?.[0] || transaction;
        wasSettledBefore = Boolean(transaction && SETTLED_TRANSACTION_STATUSES.includes(normalizeKey(transaction.status)));
    }

    if (isConfirmed && !wasSettledBefore) {
        await query(`
            UPDATE transactions
            SET
                status = 'completed',
                processed_at = NOW(),
                completed_at = NOW(),
                auto_processed = TRUE,
                processed_via = 'crypto_webhook',
                review_reason = 'Blockchain confirmations completed',
                provider_payload = ?::jsonb
            WHERE id = ?
        `, [stringifyJson(payload), transaction.id]);

        await query(`
            UPDATE users
            SET balance = balance + ?
            WHERE id = ?
        `, [amount, targetUser.id]);

        await saveLog(
            targetUser.id,
            null,
            'CRYPTO_DEPOSIT_COMPLETED',
            `${resolveCryptoMethodLabel(assetSymbol)} yatırımı otomatik tamamlandı: ${amount} TL · ${txHash}`,
            ip
        );
    }

    return {
        event: eventResult.rows?.[0] || eventResult?.[0] || null,
        transactionId: transaction?.id || null,
        confirmed: isConfirmed,
        credited: isConfirmed && !wasSettledBefore
    };
};

const evaluateProviderMetric = async ({
    query,
    payload,
    settingsMap,
    fetchFn
}) => {
    const providerKey = normalizeKey(payload.providerKey || payload.provider || 'unknown-provider');
    const providerLabel = String(payload.providerLabel || payload.provider || providerKey || 'Unknown').trim();
    const gameKey = String(payload.gameKey || payload.gameId || '').trim();
    const gameName = String(payload.gameName || gameKey || 'Bilinmeyen Oyun').trim();
    const totalBet = Number(payload.totalBet || payload.totalStake || 0);
    const totalWin = Number(payload.totalWin || payload.totalPayout || 0);
    const rounds = Number(payload.rounds || payload.totalRounds || 0);
    const rtpPercent = Number.isFinite(Number(payload.rtpPercent))
        ? Number(payload.rtpPercent)
        : (totalBet > 0 ? (totalWin / totalBet) * 100 : 0);
    const threshold = Number(settingsMap.rtp_kill_switch_threshold || 150);
    const profitLoss = Number((totalBet - totalWin).toFixed(2));

    if (!gameKey) {
        throw new Error('Oyun anahtarı zorunludur.');
    }

    const metricResult = await query(`
        INSERT INTO provider_games (
            provider_key,
            provider_label,
            game_key,
            game_name,
            is_active,
            current_rtp_percent,
            last_profit_loss,
            last_bet_volume,
            last_win_volume,
            round_count,
            payload
        )
        VALUES (?, ?, ?, ?, TRUE, ?, ?, ?, ?, ?, ?::jsonb)
        ON CONFLICT (provider_key, game_key)
        DO UPDATE SET
            provider_label = EXCLUDED.provider_label,
            game_name = EXCLUDED.game_name,
            current_rtp_percent = EXCLUDED.current_rtp_percent,
            last_profit_loss = EXCLUDED.last_profit_loss,
            last_bet_volume = EXCLUDED.last_bet_volume,
            last_win_volume = EXCLUDED.last_win_volume,
            round_count = EXCLUDED.round_count,
            payload = EXCLUDED.payload,
            last_seen_at = NOW(),
            updated_at = NOW()
        RETURNING *
    `, [
        providerKey,
        providerLabel,
        gameKey,
        gameName,
        rtpPercent,
        profitLoss,
        totalBet,
        totalWin,
        rounds,
        stringifyJson(payload)
    ]);

    const metricRow = metricResult.rows?.[0] || metricResult?.[0] || null;
    let alert = null;
    let killSwitchTriggered = false;

    if (rtpPercent > threshold) {
        killSwitchTriggered = true;

        await query(`
            UPDATE provider_games
            SET is_active = FALSE,
                last_alert_at = NOW(),
                updated_at = NOW()
            WHERE id = ?
        `, [metricRow.id]);

        const recentAlerts = await query(`
            SELECT id
            FROM provider_alerts
            WHERE provider_game_id = ?
              AND alert_type = 'RTP_ANOMALY'
              AND created_at >= NOW() - INTERVAL '15 minutes'
            LIMIT 1
        `, [metricRow.id]);

        if (!recentAlerts.length) {
            const alertResult = await query(`
                INSERT INTO provider_alerts (
                    provider_game_id,
                    provider_key,
                    provider_label,
                    game_key,
                    game_name,
                    alert_type,
                    severity,
                    message,
                    payload
                )
                VALUES (?, ?, ?, ?, ?, 'RTP_ANOMALY', 'CRITICAL', ?, ?::jsonb)
                RETURNING *
            `, [
                metricRow.id,
                providerKey,
                providerLabel,
                gameKey,
                gameName,
                `${providerLabel} / ${gameName} RTP ${rtpPercent.toFixed(2)}% ile eşiği aştı. Oyun pasife alındı.`,
                stringifyJson({
                    threshold,
                    rtpPercent,
                    totalBet,
                    totalWin,
                    rounds
                })
            ]);
            alert = alertResult.rows?.[0] || alertResult?.[0] || null;
        }

        const token = String(settingsMap.telegram_bot_token || '').trim();
        const chatId = String(settingsMap.telegram_chat_id || '').trim();
        if (token && chatId) {
            const message = [
                '🚨 CLASH BET RTP ALARMI',
                `${providerLabel} / ${gameName}`,
                `RTP: ${rtpPercent.toFixed(2)}%`,
                `Eşik: ${threshold}%`,
                `Bet: ${totalBet.toLocaleString('tr-TR')} TL`,
                `Win: ${totalWin.toLocaleString('tr-TR')} TL`,
                `Kill-switch: AKTİF`
            ].join('\n');

            try {
                await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message
                    })
                });
            } catch (error) {
                // Telegram failure should not break kill-switch flow.
            }
        }
    }

    return {
        metric: metricRow,
        alert,
        killSwitchTriggered,
        threshold,
        rtpPercent
    };
};

const getProviderOverview = async (query) => {
    const providers = await query(`
        SELECT
            provider_key,
            provider_label,
            COUNT(*) AS total_games,
            COUNT(*) FILTER (WHERE is_active = FALSE) AS disabled_games,
            COALESCE(SUM(last_profit_loss), 0) AS profit_loss,
            COALESCE(MAX(current_rtp_percent), 0) AS peak_rtp
        FROM provider_games
        GROUP BY provider_key, provider_label
        ORDER BY profit_loss DESC, provider_label ASC
    `);

    const hotGames = await query(`
        SELECT
            id,
            provider_key,
            provider_label,
            game_key,
            game_name,
            is_active,
            current_rtp_percent,
            last_profit_loss,
            last_bet_volume,
            last_win_volume,
            last_alert_at,
            updated_at
        FROM provider_games
        ORDER BY current_rtp_percent DESC NULLS LAST, updated_at DESC
        LIMIT 8
    `);

    const alerts = await query(`
        SELECT
            id,
            provider_key,
            provider_label,
            game_key,
            game_name,
            severity,
            message,
            acknowledged_at,
            created_at
        FROM provider_alerts
        ORDER BY created_at DESC
        LIMIT 8
    `);

    return {
        providers: providers.map((item) => ({
            ...item,
            total_games: Number(item.total_games || 0),
            disabled_games: Number(item.disabled_games || 0),
            profit_loss: toNumber(item.profit_loss),
            peak_rtp: toNumber(item.peak_rtp)
        })),
        hotGames: hotGames.map((item) => ({
            ...item,
            current_rtp_percent: toNumber(item.current_rtp_percent),
            last_profit_loss: toNumber(item.last_profit_loss),
            last_bet_volume: toNumber(item.last_bet_volume),
            last_win_volume: toNumber(item.last_win_volume)
        })),
        alerts
    };
};

const setProviderGameActiveState = async (query, providerGameId, isActive, adminId = null) => {
    const result = await query(`
        UPDATE provider_games
        SET
            is_active = ?,
            updated_at = NOW(),
            last_alert_at = CASE WHEN ? = FALSE THEN NOW() ELSE last_alert_at END
        WHERE id = ?
        RETURNING *
    `, [isActive, isActive, providerGameId]);

    const row = result.rows?.[0] || result?.[0] || null;
    if (row && isActive) {
        await query(`
            UPDATE provider_alerts
            SET acknowledged_at = NOW(),
                acknowledged_by_admin_id = COALESCE(acknowledged_by_admin_id, ?)
            WHERE provider_game_id = ?
              AND acknowledged_at IS NULL
        `, [adminId, providerGameId]);
    }

    return row;
};

module.exports = {
    SETTLED_TRANSACTION_STATUSES,
    SETTLED_STATUS_SQL,
    ensurePhase2Defaults,
    getSettingsMap,
    listPaymentMethods,
    upsertPaymentMethod,
    deletePaymentMethod,
    getPaymentMethodConfig,
    validateTransactionRequest,
    shouldFastTrackWithdrawal,
    sendFastTrackPayout,
    getFinanceQueue,
    getRequiredConfirmations,
    processCryptoWebhook,
    evaluateProviderMetric,
    getProviderOverview,
    setProviderGameActiveState,
    parseMaybeJson,
    normalizeKey
};
