require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const fs = require('fs');
const pg = require('pg');
const { runBackofficeMigrations } = require('./src/backoffice/migrations');
const {
    BACKOFFICE_TOKEN_KIND,
    loadAdminWithPermissionsByField,
    serializeAdmin,
    signBackofficeToken
} = require('./src/backoffice/routes');
const {
    ROLE_KEYS,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    PERMISSIONS,
    hasPermission
} = require('./src/backoffice/permissions');
const {
    syncUserFinancialProfile,
    upsertUserIpLog,
    buildDashboardCards,
    toNumber
} = require('./src/backoffice/service');
const {
    SETTLED_STATUS_SQL,
    getSettingsMap,
    listPaymentMethods,
    upsertPaymentMethod,
    deletePaymentMethod,
    getPaymentMethodConfig,
    validateTransactionRequest,
    shouldFastTrackWithdrawal,
    sendFastTrackPayout,
    getFinanceQueue,
    processCryptoWebhook,
    evaluateProviderMetric,
    getProviderOverview,
    setProviderGameActiveState,
    normalizeKey
} = require('./src/backoffice/phase2-service');

// PostgreSQL BIGINT (INT8) parser: returns integer instead of string
pg.types.setTypeParser(20, (val) => parseInt(val, 10));

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION:', err.message);
    console.error(err.stack);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION:', reason);
});

process.on('exit', (code) => {
    console.log(`⚠️ SİSTEM KAPANIYOR (Exit Code: ${code})`);
});
process.on('beforeExit', (code) => {
    console.log(`⚠️ SİSTEM KAPANMAK ÜZERE (BeforeExit Code: ${code})`);
});

const app = express();
const PORT = process.env.PORT || 3000;

// --- Multer Dosya Yükleme Ayarları ---
const uploadDir = path.join(__dirname, 'public', 'uploads', 'verifications');
const bannerUploadDir = path.join(__dirname, 'public', 'uploads', 'banners');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(bannerUploadDir)) fs.mkdirSync(bannerUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, bannerUploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });
const bannerUpload = multer({ storage: bannerStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// --- Middleware Ayarları ---
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(['/admin', '/api/admin'], (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
/*app.use((req, res, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        req.body = req.body || {};
        return next();
    }

    const contentType = String(req.headers['content-type'] || '').toLowerCase();

    if (contentType.includes('multipart/form-data')) {
        req.body = req.body || {};
        return next();
    }

    let rawBody = '';
    req.setEncoding('utf8');

    req.on('data', (chunk) => {
        rawBody += chunk;
    });

    req.on('end', () => {
        req.rawBody = rawBody;

        if (!rawBody) {
            req.body = {};
            return next();
        }

        if (contentType.includes('application/json')) {
            try {
                req.body = JSON.parse(rawBody);
                return next();
            } catch (error) {
                return res.status(400).json({ success: false, message: 'Geçersiz JSON gövdesi.' });
            }
        }

        if (contentType.includes('application/x-www-form-urlencoded')) {
            req.body = Object.fromEntries(new URLSearchParams(rawBody));
            return next();
        }

        req.body = {};
        return next();
    });

    req.on('error', (error) => {
        next(error);
    });
});*/
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- PostgreSQL Veritabanı Bağlantısı ---
const databaseUrl = process.env.DATABASE_URL || 'postgres://Ruzgar:Ruzgar.07@localhost:3003/postgres';
const isLocalDatabase =
    databaseUrl.includes('127.0.0.1') ||
    databaseUrl.includes('localhost');

const pool = new Pool({
    // Varsayılan olarak postgres:postgres veya Ruzgar:Ruzgar.07 kullanılabilir.
    connectionString: databaseUrl,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ PostgreSQL BAĞLANTI HATASI:', err.stack);
        process.exit(1);
    }
    console.log('✅ PostgreSQL Veritabanına Başarıyla Bağlandı!');
    release();

    // Create support log table if it doesn't exist
    const createSupportLogs = `CREATE TABLE IF NOT EXISTS support_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(150),
        message TEXT NOT NULL,
        ip_address VARCHAR(100),
        moderated INTEGER DEFAULT 0,
        blocked_reason VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    pool.query(createSupportLogs, (e) => { if (e) console.error('support_logs table creation error:', e.stack); });

    // Promosyonlar tablosu otomatiği
    const createPromotionsTable = `CREATE TABLE IF NOT EXISTS promotions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT,
        bonus_type VARCHAR(50),
        btn_text VARCHAR(50),
        btn_link VARCHAR(255),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    pool.query(createPromotionsTable, (e) => { if (e) console.error('promotions table creation error:', e.stack); });

    // Banners tablosu otomatiği
    const createBannersTable = `CREATE TABLE IF NOT EXISTS banners (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        image_url TEXT NOT NULL,
        link_url TEXT,
        active BOOLEAN DEFAULT TRUE,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    pool.query(createBannersTable, (e) => { if (e) console.error('banners table creation error:', e.stack); });

    runBackofficeMigrations({ pool, bcrypt, rootDir: __dirname })
        .then(() => console.log('✅ Backoffice Faz 1 şeması hazır.'))
        .catch((migrationError) => console.error('❌ Backoffice migration hatası:', migrationError));
});

// --- Promise tabanlı query fonksiyonu ---
const query = async (sql, params = []) => {
    let paramIndex = 1;
    let pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);

    // Auto-append RETURNING * for INSERT queries if not present (PostgreSQL requirement for insertId)
    if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        pgSql += ' RETURNING *';
    }

    try {
        const result = await pool.query(pgSql, params);

        if (result.command === 'INSERT') {
            return {
                insertId: result.rows.length > 0 ? (result.rows[0].id || null) : null,
                affectedRows: result.rowCount,
                rows: result.rows
            };
        } else if (result.command === 'UPDATE' || result.command === 'DELETE') {
            return {
                affectedRows: result.rowCount,
                length: result.rowCount,
                rows: result.rows
            };
        }

        return result.rows;
    } catch (err) {
        console.error('❌ PostgreSQL Query Error:', err.message);
        console.error('   SQL:', pgSql);
        console.error('   Params:', params);
        throw err;
    }
};

// --- Yardımcı Fonksiyonlar ---
const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    // Eğer format DD.MM.YYYY ise YYYY-MM-DD'ye çevir
    if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    return dateStr;
};

const createLegacyAdminActor = (payload) => ({
    id: payload.id,
    username: payload.username,
    fullName: payload.username,
    email: '',
    roleKey: ROLE_KEYS.ADMIN,
    roleLabel: ROLE_LABELS[ROLE_KEYS.ADMIN],
    permissions: ROLE_PERMISSIONS[ROLE_KEYS.ADMIN]
});

const resolveStaffActorFromPayload = async (payload) => {
    if (payload?.kind === BACKOFFICE_TOKEN_KIND) {
        const adminRow = await loadAdminWithPermissionsByField(query, 'a.id', payload.adminId);
        if (!adminRow || adminRow.status !== 'ACTIVE') {
            return null;
        }
        return serializeAdmin(adminRow);
    }

    if (payload?.role === 'admin') {
        return createLegacyAdminActor(payload);
    }

    return null;
};

const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'EriÅŸim reddedildi. Token yok.' });

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const staffActor = await resolveStaffActorFromPayload(payload);

        if (staffActor) {
            req.staff = staffActor;
            req.user = {
                id: staffActor.id,
                username: staffActor.username,
                role: staffActor.roleKey === ROLE_KEYS.ADMIN ? 'admin' : 'staff',
                roleKey: staffActor.roleKey,
                roleLabel: staffActor.roleLabel,
                permissions: staffActor.permissions,
                isStaff: true
            };
            return next();
        }

        req.user = payload;
        return next();
    } catch (error) {
        return res.status(403).json({ error: 'GeÃ§ersiz Token.' });
    }
};

const ensureStaffSession = (req, res, next) => {
    if (!req.user?.isStaff && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Bu alan sadece admin personeline aÃ§Ä±k.' });
    }
    next();
};

const ensureStaffPermission = (permissionKey) => (req, res, next) => {
    if (req.user?.isStaff && hasPermission(req.user, permissionKey)) {
        return next();
    }

    if (req.user?.role === 'admin' && !req.user?.isStaff) {
        return next();
    }

    return res.status(403).json({ error: 'Bu alan iÃ§in yetkiniz yok.' });
};

const ensurePrimaryAdmin = (req, res, next) => {
    if (req.user?.isStaff && req.user?.roleKey === ROLE_KEYS.ADMIN) {
        return next();
    }

    if (req.user?.role === 'admin' && !req.user?.isStaff) {
        return next();
    }

    return res.status(403).json({ error: 'Bu iÅŸlem iÃ§in admin yetkisi gerekli.' });
};

/* const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Erişim reddedildi. Token yok.' });

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.status(403).json({ error: 'Geçersiz Token.' });
        req.user = user;
        next();
    });
};

*/
// Simple in-memory rate limiting for support messages (per IP)
const supportRate = new Map(); // key: ip or username -> {count, firstTs}
const SUPPORT_LIMIT_WINDOW = 60 * 1000; // 1 minute
const SUPPORT_LIMIT_COUNT = 8; // max messages per window

// Simple moderation keywords (can be expanded)
const MODERATION_BLOCKED = ["hack", "illegal", "exploit", "bomb", "terror", "fraud"];

app.post('/api/support/log', async (req, res) => {
    try {
        const msg = (req.body.message || '').toString().slice(0, 2000);
        const username = req.body.username || null;
        const userId = req.body.userId || null;
        const ip = req.ip || req.connection.remoteAddress || null;

        // Rate limiting
        const key = username || ip || 'anon';
        const now = Date.now();
        const state = supportRate.get(key) || { count: 0, firstTs: now };
        if (now - state.firstTs > SUPPORT_LIMIT_WINDOW) {
            state.count = 0; state.firstTs = now;
        }
        state.count += 1;
        supportRate.set(key, state);
        if (state.count > SUPPORT_LIMIT_COUNT) {
            return res.json({ success: false, allowed: false, reason: 'rate_limited' });
        }

        // Moderation: block if contains blocked keywords
        const lowered = msg.toLowerCase();
        let blockedReason = null;
        for (const kw of MODERATION_BLOCKED) {
            if (lowered.includes(kw)) { blockedReason = `contains_${kw}`; break; }
        }

        // Persist log
        const insertSql = 'INSERT INTO support_logs (user_id, username, message, ip_address, moderated, blocked_reason) VALUES (?, ?, ?, ?, ?, ?)';
        await query(insertSql, [userId, username, msg, ip, blockedReason ? 1 : 0, blockedReason]);

        const ticketSubject = username
            ? `Canlı Destek - ${username}`
            : 'Canlı Destek - Misafir';
        const ticketPriority = blockedReason ? 'HIGH' : 'NORMAL';

        const openTicketRows = await query(`
            SELECT id
            FROM tickets
            WHERE (
                user_id = ?
                OR (user_id IS NULL AND subject = ?)
            )
              AND status IN ('OPEN', 'PENDING')
            ORDER BY updated_at DESC
            LIMIT 1
        `, [userId, ticketSubject]);

        if (openTicketRows.length > 0) {
            await query(`
                UPDATE tickets
                SET
                    priority = ?,
                    channel = 'CHAT',
                    last_message = ?,
                    updated_at = NOW()
                WHERE id = ?
            `, [ticketPriority, msg, openTicketRows[0].id]);
        } else {
            await query(`
                INSERT INTO tickets (user_id, subject, status, priority, channel, last_message, created_at, updated_at)
                VALUES (?, ?, 'OPEN', ?, 'CHAT', ?, NOW(), NOW())
            `, [userId, ticketSubject, ticketPriority, msg]);
        }

        if (blockedReason) return res.json({ success: true, allowed: false, reason: blockedReason });

        return res.json({ success: true, allowed: true });
    } catch (e) {
        console.error('Support log error:', e);
        return res.json({ success: false, allowed: false, reason: 'server_error' });
    }
});

// Admin kontrolü
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli.' });
    }
    next();
};

// Log kaydetme fonksiyonu
const saveLog = async (userId, adminId, action, details, ip) => {
    try {
        await query('INSERT INTO logs (user_id, admin_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?)',
            [userId, adminId, action, details, ip]);
    } catch (e) {
        console.error('Log kaydetme hatası:', e);
    }
};

// Doğrulama durumu metni
const getVerificationStatusText = (status) => {
    switch (status) {
        case 'verified':
            return 'Onaylı ✅';
        case 'pending':
            return 'Onay Bekliyor ⏳';
        case 'rejected':
            return 'Reddedildi ❌';
        default:
            return 'Doğrulanmamış 🔒';
    }
};

const getActiveStaffActor = (req) => req.staff || createLegacyAdminActor(req.user);
const isSettledTransactionStatus = (status) => ['approved', 'completed'].includes(String(status || '').toLowerCase());
const processFinanceDecision = async ({ transactionId, action, note, actor, ip }) => {
    const transactionRows = await query(`
        SELECT
            t.*,
            u.username,
            u.loyalty_level,
            u.risk_score,
            u.vip_fast_track_enabled
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        WHERE t.id = ?
        LIMIT 1
    `, [transactionId]);

    if (!transactionRows.length) {
        throw new Error('İşlem bulunamadı.');
    }

    const transaction = transactionRows[0];
    if (String(transaction.status || '').toLowerCase() !== 'pending') {
        throw new Error('Bu işlem zaten işlenmiş.');
    }

    const settingsMap = await getSettingsMap(query, [
        'fast_track_withdraw_limit',
        'payment_provider_name',
        'payment_provider_api_url',
        'payment_provider_api_key'
    ]);

    let finalStatus = action === 'approve' ? 'approved' : 'rejected';
    let processedVia = 'manual_review';
    let autoProcessed = false;
    let providerReference = transaction.provider_reference || null;
    let providerResponse = {};
    let reviewReason = note || null;

    if (action === 'approve' && transaction.type === 'withdraw') {
        const fastTrackEligible = transaction.vip_fast_track_enabled !== false && shouldFastTrackWithdrawal({
            user: transaction,
            amount: Number(transaction.amount || 0),
            settingsMap
        });

        if (fastTrackEligible) {
            const payoutResult = await sendFastTrackPayout({
                fetchFn: fetch,
                settingsMap,
                transaction,
                user: transaction
            });

            if (payoutResult.ok) {
                finalStatus = 'completed';
                processedVia = 'vip_fast_track_manual';
                autoProcessed = true;
                providerReference = payoutResult.providerReference || providerReference;
                providerResponse = payoutResult.response || {};
                reviewReason = note || 'VIP Fast-Track ile tamamlandı.';
            } else {
                providerResponse = payoutResult.response || {};
                reviewReason = note || payoutResult.message || 'Sağlayıcı onayı başarısız oldu.';
            }
        }
    }

    if (action === 'approve') {
        await query(`
            UPDATE transactions
            SET
                status = ?,
                admin_note = ?,
                review_reason = ?,
                processed_at = NOW(),
                completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END,
                processed_by_admin_id = ?,
                processed_via = ?,
                auto_processed = ?,
                provider_reference = ?,
                provider_response = ?::jsonb,
                updated_at = NOW()
            WHERE id = ?
        `, [
            finalStatus,
            note || null,
            reviewReason,
            finalStatus,
            actor.id,
            processedVia,
            autoProcessed,
            providerReference,
            JSON.stringify(providerResponse || {}),
            transactionId
        ]);

        if (transaction.type === 'deposit') {
            await query('UPDATE users SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.user_id]);
        }

        await syncUserFinancialProfile(query, transaction.user_id);
        await saveLog(
            transaction.user_id,
            actor.id,
            autoProcessed ? 'TRANSACTION_FAST_TRACK_APPROVE' : 'TRANSACTION_APPROVE',
            `${transaction.type === 'deposit' ? 'Yatırım' : 'Çekim'} onaylandı: ${transaction.amount} TL`,
            ip
        );

        return {
            transaction,
            finalStatus,
            autoProcessed,
            message: autoProcessed
                ? 'İşlem VIP Fast-Track ile tamamlandı.'
                : 'İşlem onaylandı.'
        };
    }

    await query(`
        UPDATE transactions
        SET
            status = 'rejected',
            admin_note = ?,
            review_reason = ?,
            processed_at = NOW(),
            processed_by_admin_id = ?,
            processed_via = 'manual_review',
            auto_processed = FALSE,
            updated_at = NOW()
        WHERE id = ?
    `, [note || 'Reddedildi', note || 'Reddedildi', actor.id, transactionId]);

    if (transaction.type === 'withdraw') {
        await query('UPDATE users SET balance = balance + ? WHERE id = ?', [transaction.amount, transaction.user_id]);
    }

    await syncUserFinancialProfile(query, transaction.user_id);
    await saveLog(
        transaction.user_id,
        actor.id,
        'TRANSACTION_REJECT',
        `${transaction.type === 'deposit' ? 'Yatırım' : 'Çekim'} reddedildi: ${transaction.amount} TL`,
        ip
    );

    return {
        transaction,
        finalStatus: 'rejected',
        autoProcessed: false,
        message: 'İşlem reddedildi.'
    };
};

app.get('/api/admin/session', authenticateToken, ensureStaffSession, async (req, res) => {
    return res.json({ success: true, actor: getActiveStaffActor(req) });
});

app.get('/api/admin/phase1/dashboard', authenticateToken, ensureStaffPermission(PERMISSIONS.DASHBOARD_VIEW), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const summaryRows = await query(`
            SELECT
                COALESCE(SUM(CASE WHEN type = 'deposit' AND status IN ('approved', 'completed') AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_incoming,
                COALESCE(SUM(CASE WHEN type = 'withdraw' AND status IN ('approved', 'completed') AND created_at::date = CURRENT_DATE THEN amount ELSE 0 END), 0) AS today_outgoing,
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
        if (hasPermission(actor, PERMISSIONS.DASHBOARD_FINANCIAL)) {
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
            actor,
            cards: buildDashboardCards(actor.roleKey, stats),
            queues: {
                highRiskPlayers,
                openTickets,
                pendingTransactions
            }
        });
    } catch (error) {
        console.error('Integrated phase1 dashboard error:', error);
        return res.status(500).json({ success: false, message: 'Dashboard verileri yüklenemedi.' });
    }
});

app.get('/api/admin/phase1/search', authenticateToken, ensureStaffPermission(PERMISSIONS.SEARCH_GLOBAL), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
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
        if (hasPermission(actor, PERMISSIONS.TRANSACTIONS_READ)) {
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
        if (hasPermission(actor, PERMISSIONS.TICKETS_READ)) {
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
        console.error('Integrated phase1 search error:', error);
        return res.status(500).json({ success: false, message: 'Global arama başarısız oldu.' });
    }
});

app.get('/api/admin/phase1/players/:id', authenticateToken, ensureStaffPermission(PERMISSIONS.CRM_READ), async (req, res) => {
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
                COALESCE(a.full_name, u.username, 'Admin') AS admin_name,
                COALESCE(a.username, u.username, 'admin') AS admin_username
            FROM notes n
            LEFT JOIN admins a ON a.id = n.admin_id
            LEFT JOIN users u ON u.id = n.admin_id
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
                { id: 'main_balance', label: 'Ana Kasa', value: toNumber(updatedMetrics.balance || player.balance), prefix: 'TRY' },
                { id: 'bonus_balance', label: 'Bonus Kasası', value: toNumber(updatedMetrics.bonus_balance || player.bonus_balance), prefix: 'TRY' },
                { id: 'total_deposit', label: 'Toplam Yatırım', value: toNumber(updatedMetrics.total_deposit || player.total_deposit), prefix: 'TRY' },
                { id: 'total_withdraw', label: 'Toplam Çekim', value: toNumber(updatedMetrics.total_withdraw || player.total_withdraw), prefix: 'TRY' },
                { id: 'ggr', label: 'GGR', value: toNumber(updatedMetrics.ggr || player.ggr), prefix: 'TRY' }
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
        console.error('Integrated phase1 player error:', error);
        return res.status(500).json({ success: false, message: 'Oyuncu paneli yüklenemedi.' });
    }
});

app.post('/api/admin/phase1/players/:id/notes', authenticateToken, ensureStaffPermission(PERMISSIONS.NOTES_WRITE), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
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
        `, [userId, actor.id, noteType, noteText, visibility]);

        const createdNote = inserted.rows?.[0] || inserted[0];

        return res.json({
            success: true,
            note: {
                ...createdNote,
                admin_name: actor.fullName,
                admin_username: actor.username
            }
        });
    } catch (error) {
        console.error('Integrated phase1 note error:', error);
        return res.status(500).json({ success: false, message: 'Not kaydedilemedi.' });
    }
});

app.get('/api/admin/finance/queue', authenticateToken, ensureStaffPermission(PERMISSIONS.TRANSACTIONS_READ), async (req, res) => {
    try {
        const payload = await getFinanceQueue(query);
        return res.json({ success: true, ...payload });
    } catch (error) {
        console.error('Finance queue error:', error);
        return res.status(500).json({ success: false, message: 'Finans kuyruğu yüklenemedi.' });
    }
});

app.post('/api/admin/finance/transactions/:id/decision', authenticateToken, ensureStaffPermission(PERMISSIONS.TRANSACTIONS_MANAGE), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const transactionId = Number(req.params.id);
        const action = String(req.body.action || '').trim().toLowerCase();
        const note = String(req.body.note || req.body.reason || '').trim();

        if (!transactionId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Geçersiz karar isteği.' });
        }

        const result = await processFinanceDecision({
            transactionId,
            action,
            note,
            actor,
            ip: req.ip
        });

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Finance decision error:', error);
        return res.status(400).json({ success: false, message: error.message || 'Karar uygulanamadı.' });
    }
});

app.get('/api/admin/payment-methods', authenticateToken, ensureStaffPermission(PERMISSIONS.DASHBOARD_FINANCIAL), async (req, res) => {
    try {
        const items = await listPaymentMethods(query);
        return res.json({ success: true, items });
    } catch (error) {
        console.error('Payment methods list error:', error);
        return res.status(500).json({ success: false, message: 'Ödeme limitleri yüklenemedi.' });
    }
});

app.post('/api/admin/payment-methods', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const item = await upsertPaymentMethod(query, req.body, actor.id);
        await saveLog(null, actor.id, 'PAYMENT_METHOD_UPSERT', `Ödeme yöntemi güncellendi: ${item?.method_key || 'unknown'}`, req.ip);
        return res.json({ success: true, item });
    } catch (error) {
        console.error('Payment methods upsert error:', error);
        return res.status(400).json({ success: false, message: error.message || 'Ödeme yöntemi kaydedilemedi.' });
    }
});

app.delete('/api/admin/payment-methods/:id', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const removed = await deletePaymentMethod(query, Number(req.params.id));
        if (!removed) {
            return res.status(404).json({ success: false, message: 'Ödeme yöntemi bulunamadı.' });
        }

        await saveLog(null, actor.id, 'PAYMENT_METHOD_DELETE', `Ödeme yöntemi silindi: ${req.params.id}`, req.ip);
        return res.json({ success: true });
    } catch (error) {
        console.error('Payment methods delete error:', error);
        return res.status(500).json({ success: false, message: 'Ödeme yöntemi silinemedi.' });
    }
});

app.post('/api/webhooks/crypto', async (req, res) => {
    try {
        const settingsMap = await getSettingsMap(query, ['crypto_webhook_secret', 'btc_confirmations_required', 'eth_confirmations_required']);
        const configuredSecret = String(settingsMap.crypto_webhook_secret || '').trim();
        const providedSecret = String(req.headers['x-crypto-webhook-secret'] || req.body.secret || '').trim();

        if (configuredSecret && configuredSecret !== providedSecret) {
            return res.status(403).json({ success: false, message: 'Webhook secret hatalı.' });
        }

        const result = await processCryptoWebhook({
            query,
            payload: req.body || {},
            settingsMap,
            ip: req.ip,
            saveLog
        });

        if (result.event?.transaction_id) {
            await query(`
                UPDATE crypto_webhook_events
                SET transaction_id = ?
                WHERE id = ?
            `, [result.transactionId, result.event.id]);
        }

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Crypto webhook error:', error);
        return res.status(400).json({ success: false, message: error.message || 'Webhook işlenemedi.' });
    }
});

app.get('/api/admin/providers/overview', authenticateToken, ensureStaffPermission(PERMISSIONS.DASHBOARD_FINANCIAL), async (req, res) => {
    try {
        const payload = await getProviderOverview(query);
        return res.json({ success: true, ...payload });
    } catch (error) {
        console.error('Provider overview error:', error);
        return res.status(500).json({ success: false, message: 'Sağlayıcı görünümü yüklenemedi.' });
    }
});

app.post('/api/admin/providers/metrics', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const result = await evaluateProviderMetric({
            query,
            payload: req.body || {},
            settingsMap: await getSettingsMap(query, ['rtp_kill_switch_threshold', 'telegram_bot_token', 'telegram_chat_id']),
            fetchFn: fetch
        });

        return res.json({ success: true, ...result });
    } catch (error) {
        console.error('Provider metric error:', error);
        return res.status(400).json({ success: false, message: error.message || 'Sağlayıcı metriği işlenemedi.' });
    }
});

app.post('/api/admin/providers/games/:id/toggle', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const game = await setProviderGameActiveState(query, Number(req.params.id), Boolean(req.body.isActive), actor.id);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Provider oyunu bulunamadı.' });
        }

        await saveLog(null, actor.id, 'PROVIDER_GAME_TOGGLE', `Provider oyunu durumu değişti: ${game.game_key} => ${game.is_active}`, req.ip);
        return res.json({ success: true, game });
    } catch (error) {
        console.error('Provider game toggle error:', error);
        return res.status(500).json({ success: false, message: 'Oyun durumu güncellenemedi.' });
    }
});

// ================== SAYFA YOLLARI ==================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin/backoffice/login', (req, res) => res.redirect('/admin/login'));
app.get('/admin/backoffice', (req, res) => res.redirect('/admin/dashboard'));
app.get('/backoffice/login', (req, res) => res.redirect('/admin/login'));
app.get('/backoffice', (req, res) => res.redirect('/admin/dashboard'));

// Admin Panel Routes - Yeni Premium Tasarım
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html')));

const adminPageMap = {
    kullanicilar: 'kullanicilar.html',
    finans: 'finans.html',
    kuponlar: 'kuponlar.html',
    loglar: 'loglar.html',
    ayarlar: 'ayarlar.html',
    dogrulama: 'dogrulama.html',
    bannerler: 'bannerler.html'
};
Object.entries(adminPageMap).forEach(([page, fileName]) => {
    app.get(`/admin/${page}`, (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', fileName)));
});

// ================== KULLANICI API'LERİ ==================

// 0. PROMOSYONLAR (PROMOTIONS)
app.get('/api/promotions', async (req, res) => {
    try {
        const promotions = await query('SELECT * FROM promotions WHERE active = true ORDER BY created_at DESC');
        res.json({ success: true, promotions });
    } catch (error) {
        console.error('❌ Promosyonlar hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

// --- Banner API ---
app.get('/api/banners', async (req, res) => {
    try {
        const banners = await query('SELECT * FROM banners WHERE active = true ORDER BY order_index ASC, created_at DESC');
        res.json({ success: true, banners });
    } catch (error) {
        console.error('❌ Banners listelenemedi:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

app.get('/api/admin/banners', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz erişim.' });
    try {
        const banners = await query('SELECT * FROM banners ORDER BY order_index ASC, created_at DESC');
        res.json(banners);
    } catch (error) {
        console.error('❌ Admin banners error:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

app.post('/api/admin/banners', authenticateToken, bannerUpload.single('banner'), async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz erişim.' });
    try {
        const { title, link_url } = req.body;
        if (!req.file) return res.status(400).json({ error: 'Lütfen bir resim seçin.' });

        const imageUrl = '/uploads/banners/' + req.file.filename;
        const result = await query(
            'INSERT INTO banners (title, image_url, link_url) VALUES (?, ?, ?)',
            [title || '', imageUrl, link_url || '']
        );

        res.json({ success: true, bannerId: result.insertId });
    } catch (error) {
        console.error('❌ Banner upload error:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

app.delete('/api/admin/banners/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz erişim.' });
    try {
        const { id } = req.params;
        const banner = await query('SELECT image_url FROM banners WHERE id = ?', [id]);
        if (banner.length === 0) return res.status(404).json({ error: 'Banner bulunamadı.' });

        // Delete file
        const filePath = path.join(__dirname, 'public', banner[0].image_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await query('DELETE FROM banners WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Banner delete error:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

// 1. KAYIT OL (REGISTER)
app.post('/api/register', async (req, res) => {
    console.log('📝 Kayıt İsteği Geldi:', req.body);

    const username = req.body.user || req.body.username;
    const password = req.body.pass || req.body.password;
    const phone = req.body.phone || '';
    const name = req.body.name || '';
    const email = req.body.email || `${username}@clashbet.com`;
    const birthdate = normalizeDate(req.body.dob || req.body.birthdate);
    const referralCode = req.body.referral || null;

    if (!username || !password) {
        return res.json({ success: false, message: 'Kullanıcı adı ve şifre zorunludur!' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Hoşgeldin bonusu al
        const bonusResult = await query("SELECT setting_value FROM settings WHERE setting_key = 'welcome_bonus'");
        const welcomeBonus = bonusResult.length > 0 ? parseFloat(bonusResult[0].setting_value) : 0;

        const sql = 'INSERT INTO users (username, name, email, password, phone, birthdate, referral_code, role, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        let result;
        try {
            result = await query(sql, [username, name, email, hashedPassword, phone, birthdate, referralCode, 'user', welcomeBonus, 'active']);
        } catch (err) {
            console.error("❌ SQL Hatası (Register):", err.message);
            if (err.code === '23505') {
                return res.json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor!' });
            }
            return res.json({ success: false, message: 'Veritabanı hatası oluştu: ' + err.message });
        }

        // Kayıtlı kullanıcıya token oluştur
        const token = jwt.sign(
            { id: result.insertId, username: username, role: 'user' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        // Yeni kullanıcı bilgilerini hazırla
        const userData = {
            id: result.insertId,
            username: username,
            user: username,
            name: name || username,
            balance: welcomeBonus,
            role: 'user',
            cards: [],
            verificationStatus: 'unverified',
            stats: {
                level: 1,
                xp: 0,
                coupons: 0,
                spins: 0,
                date: new Date().toLocaleDateString('tr-TR'),
                status: 'Doğrulanmamış'
            }
        };

        // Log kaydet
        await saveLog(result.insertId, null, 'REGISTER', `Yeni üye kaydı: ${username}`, req.ip);

        console.log(`✅ Yeni Üye Kaydedildi: ${username} (Bonus: ${welcomeBonus} TL)`);
        res.json({ success: true, user: userData, token: token, message: 'Kayıt başarılı! Giriş yapabilirsiniz.' });

    } catch (error) {
        console.error("❌ Sunucu Hatası (Register):", error);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

// 2. GİRİŞ YAP (LOGIN)
app.post('/api/admin/auth/login', async (req, res) => {
    const username = (req.body.user || req.body.username || '').trim();
    const password = (req.body.pass || req.body.password || '').trim();

    if (!username || !password) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const adminRow = await loadAdminWithPermissionsByField(query, 'a.username', username);

        if (adminRow && adminRow.status === 'ACTIVE') {
            const passwordMatch = await bcrypt.compare(password, adminRow.password_hash);

            if (!passwordMatch) {
                return res.json({ success: false, message: 'Şifre hatalı!' });
            }

            await query('UPDATE admins SET last_login_at = NOW(), updated_at = NOW() WHERE id = ?', [adminRow.id]);

            const actor = serializeAdmin(adminRow);
            const token = signBackofficeToken(jwt, actor);

            return res.json({
                success: true,
                token,
                actor,
                redirect: '/admin/dashboard'
            });
        }

        const legacyAdmins = await query(
            'SELECT id, username, password, role, status FROM users WHERE username = ? AND role = ? LIMIT 1',
            [username, 'admin']
        );

        if (!legacyAdmins.length) {
            return res.json({ success: false, message: 'Admin hesabı bulunamadı!' });
        }

        const legacyAdmin = legacyAdmins[0];
        if (legacyAdmin.status === 'banned') {
            return res.json({ success: false, message: 'Hesabınız askıya alınmış!' });
        }

        const legacyMatch = await bcrypt.compare(password, legacyAdmin.password);
        if (!legacyMatch) {
            return res.json({ success: false, message: 'Şifre hatalı!' });
        }

        const token = jwt.sign(
            { id: legacyAdmin.id, username: legacyAdmin.username, role: 'admin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        return res.json({
            success: true,
            token,
            actor: createLegacyAdminActor(legacyAdmin),
            redirect: '/admin/dashboard'
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ success: false, message: 'Admin girişi sırasında hata oluştu.' });
    }
});

app.post(['/api/login', '/api/auth/login'], async (req, res) => {
    console.log('🔑 Giriş İsteği:', req.body);

    const username = req.body.user || req.body.username;
    const password = req.body.pass || req.body.password;

    if (!username || !password) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const results = await query('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const user = results[0];

        if (user.status === 'banned') {
            return res.json({ success: false, message: 'Hesabınız askıya alınmış!' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );

            // Son giriş zamanını güncelle
            await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
            const loginIp = (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '')
                .toString()
                .split(',')[0]
                .trim();
            await upsertUserIpLog(query, user.id, loginIp || '127.0.0.1', req.headers['user-agent'] || '', 'login');
            await syncUserFinancialProfile(query, user.id);

            // Kullanıcı kartlarını çek
            const cardsResult = await query('SELECT * FROM user_cards WHERE user_id = ?', [user.id]);
            const cards = cardsResult.map(c => ({
                id: c.card_id,
                name: c.card_name,
                img: c.card_img,
                buff: c.buff,
                rarity: c.rarity,
                duration: c.duration,
                activationTime: c.activation_time
            }));

            const userData = {
                id: user.id,
                username: user.username,
                user: user.username, // Geriye uyumluluk için
                name: user.username,
                balance: parseFloat(user.balance),
                role: user.role,
                cards: cards,
                verificationStatus: user.verification_status || 'unverified',
                stats: {
                    level: user.level || 1,
                    xp: user.xp || 0,
                    coupons: 0,
                    spins: 0,
                    date: new Date(user.created_at).toLocaleDateString('tr-TR'),
                    status: getVerificationStatusText(user.verification_status)
                }
            };

            // İstatistikleri güncelle
            const betStats = await query('SELECT COUNT(*) as count FROM bets WHERE user_id = ?', [user.id]);
            userData.stats.coupons = betStats[0].count;

            // Log kaydet
            await saveLog(user.id, null, 'LOGIN', `Kullanıcı girişi: ${username}`, req.ip);

            console.log(`✅ Giriş Başarılı: ${username}`);
            res.json({ success: true, user: userData, token: token });
        } else {
            console.log(`❌ Hatalı Şifre Denemesi: ${username}`);
            res.json({ success: false, message: 'Şifre hatalı!' });
        }
    } catch (error) {
        console.error("❌ Login Hatası:", error);
        res.json({ success: false, message: 'Sunucu hatası.' });
    }
});

// 3. KULLANICI PROFİLİ
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        const users = await query('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        const cards = await query('SELECT * FROM user_cards WHERE user_id = ?', [user.id]);
        const bets = await query('SELECT COUNT(*) as count FROM bets WHERE user_id = ?', [user.id]);

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                balance: parseFloat(user.balance),
                level: user.level,
                xp: user.xp,
                status: user.status,
                created_at: user.created_at,
                total_bet: user.total_bet,
                total_win: user.total_win
            },
            cards: cards,
            stats: {
                totalBets: bets[0].count
            }
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: 'Sunucu hatası' });
    }
});

// ================== ŞİFRE DEĞİŞTİRME ==================

// 3a. ŞİFRE DEĞİŞTİR
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: 'Mevcut şifre ve yeni şifre gerekli!' });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Yeni şifre en az 6 karakter olmalı!' });
        }

        // Kullanıcıyı bul
        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const user = users[0];

        // Mevcut şifreyi kontrol et
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: 'Mevcut şifre hatalı!' });
        }

        // Yeni şifreyi hashle ve kaydet
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Log kaydet
        await saveLog(userId, null, 'PASSWORD_CHANGE', 'Kullanıcı şifresini değiştirdi', req.ip);

        console.log(`🔐 Şifre değiştirildi: ${user.username}`);
        res.json({ success: true, message: 'Şifreniz başarıyla güncellendi!' });

    } catch (error) {
        console.error('❌ Şifre değiştirme hatası:', error);
        res.json({ success: false, message: 'Sunucu hatası!' });
    }
});

// ================== HESAP DOĞRULAMA ==================

// 3b. BELGE YÜKLE (Hesap Doğrulama)
app.post('/api/upload-verification', authenticateToken, upload.single('document'), async (req, res) => {
    try {
        const userId = req.user.id;

        if (!req.file) {
            return res.json({ success: false, message: 'Lütfen bir belge yükleyin!' });
        }

        // Kullanıcının mevcut doğrulama durumunu kontrol et
        const users = await query('SELECT verification_status FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        if (users[0].verification_status === 'verified') {
            return res.json({ success: false, message: 'Hesabınız zaten doğrulanmış!' });
        }

        if (users[0].verification_status === 'pending') {
            return res.json({ success: false, message: 'Doğrulama talebiniz zaten inceleniyor!' });
        }

        // Dosya yolunu kaydet
        const documentPath = '/uploads/verifications/' + req.file.filename;

        await query(
            'UPDATE users SET verification_status = ?, verification_document = ? WHERE id = ?',
            ['pending', documentPath, userId]
        );

        // Log kaydet
        await saveLog(userId, null, 'VERIFICATION_REQUEST', 'Hesap doğrulama belgesi yüklendi', req.ip);

        console.log(`📄 Doğrulama belgesi yüklendi: User ID ${userId}`);
        res.json({ success: true, message: 'Belgeniz yüklendi! İnceleme sonucu size bildirilecek.' });

    } catch (error) {
        console.error('❌ Belge yükleme hatası:', error);
        res.json({ success: false, message: 'Dosya yüklenirken hata oluştu!' });
    }
});

// 3c. DOĞRULAMA DURUMUNU KONTROL ET
app.get('/api/verification-status', authenticateToken, async (req, res) => {
    try {
        const users = await query(
            'SELECT verification_status, verification_note, verification_date FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const user = users[0];
        res.json({
            success: true,
            status: user.verification_status || 'unverified',
            note: user.verification_note,
            date: user.verification_date
        });

    } catch (error) {
        console.error('❌ Doğrulama durumu hatası:', error);
        res.json({ success: false, message: 'Sunucu hatası!' });
    }
});

// ================== FİNANSAL İŞLEMLER ==================

// 4. PARA YATIRMA / ÇEKME
app.post('/api/transaction', async (req, res) => {
    console.log('Transaction request:', req.body);

    const { user, amount, type, method, network, txHash, walletAddress } = req.body;

    if (!user || !amount || !type) {
        return res.json({ success: false, message: 'Eksik i?lem bilgisi!' });
    }

    try {
        const settingsMap = await getSettingsMap(query, [
            'min_deposit',
            'min_withdraw',
            'fast_track_withdraw_limit',
            'payment_provider_name',
            'payment_provider_api_url',
            'payment_provider_api_key'
        ]);

        const users = await query(`
            SELECT id, username, balance, loyalty_level, risk_score, vip_fast_track_enabled
            FROM users
            WHERE username = ?
            LIMIT 1
        `, [user]);

        if (!users.length) {
            return res.json({ success: false, message: 'Kullan?c? bulunamad?!' });
        }

        const currentUser = users[0];
        const userId = currentUser.id;
        const currentBalance = Number(currentUser.balance || 0);
        const methodKey = normalizeKey(method || (type === 'deposit' ? 'havale' : 'papara'));
        const methodConfig = await getPaymentMethodConfig(query, methodKey, type);
        const validation = validateTransactionRequest({
            amount,
            type,
            methodConfig,
            fallbackMinDeposit: Number(settingsMap.min_deposit || 50),
            fallbackMinWithdraw: Number(settingsMap.min_withdraw || 100)
        });

        if (!validation.ok) {
            return res.json({ success: false, message: validation.message });
        }

        const normalizedAmount = validation.amount;
        if (type === 'withdraw' && currentBalance < normalizedAmount) {
            return res.json({ success: false, message: 'Yetersiz bakiye!' });
        }

        const assetSymbol = methodKey === 'bitcoin' ? 'BTC' : methodKey === 'ethereum' ? 'ETH' : null;
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
                processed_via,
                auto_processed,
                provider_payload
            )
            VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, 'manual', FALSE, ?::jsonb)
            RETURNING *
        `, [
            userId,
            normalizedAmount,
            type,
            method || methodConfig?.label || 'Havale',
            assetSymbol,
            network || assetSymbol || null,
            txHash || null,
            txHash || null,
            JSON.stringify({
                source: 'user_request',
                methodKey,
                walletAddress: walletAddress || null
            })
        ]);
        const createdTransaction = insertResult.rows?.[0] || insertResult?.[0];

        if (type === 'withdraw') {
            await query('UPDATE users SET balance = balance - ? WHERE id = ?', [normalizedAmount, userId]);

            const fastTrackEligible = currentUser.vip_fast_track_enabled !== false && shouldFastTrackWithdrawal({
                user: currentUser,
                amount: normalizedAmount,
                settingsMap
            });

            if (fastTrackEligible) {
                const payoutResult = await sendFastTrackPayout({
                    fetchFn: fetch,
                    settingsMap,
                    transaction: createdTransaction,
                    user: currentUser
                });

                if (payoutResult.ok) {
                    await query(`
                        UPDATE transactions
                        SET
                            status = 'completed',
                            processed_at = NOW(),
                            completed_at = NOW(),
                            auto_processed = TRUE,
                            processed_via = 'vip_fast_track',
                            provider_reference = ?,
                            provider_response = ?::jsonb,
                            review_reason = 'VIP Fast-Track otomatik onay',
                            updated_at = NOW()
                        WHERE id = ?
                    `, [
                        payoutResult.providerReference || null,
                        JSON.stringify(payoutResult.response || {}),
                        createdTransaction.id
                    ]);

                    await syncUserFinancialProfile(query, userId);
                    await saveLog(userId, null, 'WITHDRAW_FAST_TRACK', `VIP Fast-Track ?ekim tamamland?: ${normalizedAmount} TL`, req.ip);

                    return res.json({
                        success: true,
                        newBalance: currentBalance - normalizedAmount,
                        autoProcessed: true,
                        transactionId: createdTransaction.id,
                        message: 'VIP Fast-Track aktif. ?ekim otomatik onayland?.'
                    });
                }

                await query(`
                    UPDATE transactions
                    SET
                        review_reason = ?,
                        provider_response = ?::jsonb,
                        updated_at = NOW()
                    WHERE id = ?
                `, [
                    payoutResult.message || 'Fast-Track sa?lay?c?s? yan?t vermedi, manuel kuyru?a d??t?.',
                    JSON.stringify(payoutResult.response || {}),
                    createdTransaction.id
                ]);
            }

            await saveLog(userId, null, 'WITHDRAW_REQUEST', `?ekim talebi: ${normalizedAmount} TL`, req.ip);
            return res.json({
                success: true,
                newBalance: currentBalance - normalizedAmount,
                transactionId: createdTransaction.id,
                message: fastTrackEligible
                    ? 'Fast-Track denendi, i?lem manuel kuyru?a b?rak?ld?.'
                    : '?ekim talebi al?nd?.'
            });
        }

        await saveLog(userId, null, 'DEPOSIT_REQUEST', `Yat?r?m talebi: ${normalizedAmount} TL`, req.ip);
        return res.json({
            success: true,
            newBalance: currentBalance,
            transactionId: createdTransaction.id,
            message: assetSymbol
                ? `${method || methodConfig?.label || 'Kripto'} yat?r?m? kaydedildi. Blok onay? bekleniyor.`
                : 'Yat?r?m talebi al?nd?, onay bekleniyor.'
        });
    } catch (error) {
        console.error('Transaction error:', error);
        return res.json({ success: false, message: '??lem kaydedilemedi.' });
    }
});

// ================== SANDIK SİSTEMİ ==================

// 5. SANDIK SATIN ALMA VE ÖDÜL VERME
app.post('/api/buy-chest', async (req, res) => {
    console.log('📦 Sandık Satın Alma:', req.body);

    const { user, chestId, chestName, price, quantity } = req.body;

    if (!user || !chestId || !price) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    const rewardType = chestId === 'gems' ? 'money' : 'card';

    try {
        const users = await query('SELECT id, balance FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;
        const currentBalance = parseFloat(users[0].balance);
        const totalCost = parseFloat(price) * (quantity || 1);

        if (currentBalance < totalCost) {
            return res.json({ success: false, message: 'Yetersiz bakiye!' });
        }

        // Bakiyeyi düş
        await query('UPDATE users SET balance = balance - ? WHERE id = ?', [totalCost, userId]);

        // Sandık satın alımını kaydet
        await query(
            'INSERT INTO chest_purchases (user_id, chest_type, chest_name, price, quantity, reward_type, reward_value) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, chestId, chestName || chestId, price, quantity || 1, rewardType, 'pending']
        );

        const newBalance = currentBalance - totalCost;

        await saveLog(userId, null, 'CHEST_PURCHASE', `Sandık satın alındı: ${chestName} x${quantity || 1}`, req.ip);

        res.json({
            success: true,
            newBalance: newBalance,
            message: 'Sandık satın alındı!'
        });
    } catch (error) {
        console.error("❌ Sandık Satın Alma Hatası:", error);
        res.json({ success: false, message: 'İşlem başarısız.' });
    }
});

// 6. ÖDÜL EKLEME (Sandık açma sonucu)
app.post('/api/add-reward', async (req, res) => {
    console.log('🎁 Ödül Ekleme:', req.body);

    const { user, rewardType, amount, cardData } = req.body;

    if (!user || !rewardType) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const users = await query('SELECT id, balance FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;
        let newBalance = parseFloat(users[0].balance);

        if (rewardType === 'money' && amount) {
            // Para ödülü
            newBalance += parseFloat(amount);
            await query('UPDATE users SET balance = ?, total_win = total_win + ? WHERE id = ?', [newBalance, amount, userId]);

            await saveLog(userId, null, 'CHEST_REWARD_MONEY', `Sandıktan para ödülü: ${amount} TL`, req.ip);

            res.json({ success: true, newBalance: newBalance, message: `${amount} TL kazandınız!` });
        }
        else if (rewardType === 'card' && cardData) {
            // Kart ödülü
            await query(
                'INSERT INTO user_cards (user_id, card_id, card_name, card_img, buff, rarity, duration, activation_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userId, cardData.id, cardData.name, cardData.img, cardData.buff, cardData.rarity, cardData.duration || 900000, null]
            );

            // Güncel kartları çek
            const cards = await query('SELECT * FROM user_cards WHERE user_id = ?', [userId]);
            const formattedCards = cards.map(c => ({
                id: c.card_id,
                name: c.card_name,
                img: c.card_img,
                buff: c.buff,
                rarity: c.rarity,
                duration: c.duration,
                activationTime: c.activation_time
            }));

            await saveLog(userId, null, 'CHEST_REWARD_CARD', `Sandıktan kart ödülü: ${cardData.name}`, req.ip);

            res.json({ success: true, cards: formattedCards, message: `${cardData.name} kartı kazandınız!` });
        }
        else {
            res.json({ success: false, message: 'Geçersiz ödül tipi.' });
        }
    } catch (error) {
        console.error("❌ Ödül Ekleme Hatası:", error);
        res.json({ success: false, message: 'Ödül eklenemedi.' });
    }
});

// 7. KART AKTİVASYONU
app.post('/api/activate-card', async (req, res) => {
    console.log('🃏 Kart Aktivasyonu:', req.body);

    const { user, cardIndex } = req.body;

    if (!user || cardIndex === undefined) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const users = await query('SELECT id FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;

        // Kullanıcının kartlarını çek
        const cards = await query('SELECT * FROM user_cards WHERE user_id = ? ORDER BY id ASC', [userId]);

        if (cardIndex >= cards.length) {
            return res.json({ success: false, message: 'Kart bulunamadı!' });
        }

        const card = cards[cardIndex];

        // Zaten aktif mi kontrol et
        if (card.activation_time) {
            return res.json({ success: false, message: 'Bu kart zaten aktif!' });
        }

        // Kartı aktif et
        const activationTime = Date.now();
        await query('UPDATE user_cards SET activation_time = ? WHERE id = ?', [activationTime, card.id]);

        // Güncel kartları çek
        const updatedCards = await query('SELECT * FROM user_cards WHERE user_id = ?', [userId]);
        const formattedCards = updatedCards.map(c => ({
            id: c.card_id,
            name: c.card_name,
            img: c.card_img,
            buff: c.buff,
            rarity: c.rarity,
            duration: c.duration,
            activationTime: c.activation_time
        }));

        await saveLog(userId, null, 'CARD_ACTIVATE', `Kart aktive edildi: ${card.card_name}`, req.ip);

        res.json({ success: true, cards: formattedCards, message: 'Kart aktive edildi!' });
    } catch (error) {
        console.error("❌ Kart Aktivasyonu Hatası:", error);
        res.json({ success: false, message: 'Kart aktive edilemedi.' });
    }
});

// ================== GÜNLÜK ÖDÜL SİSTEMİ ==================

// 8. GÜNLÜK ÖDÜL AL
app.post('/api/claim-daily-reward', async (req, res) => {
    console.log('🎁 Günlük Ödül Talebi:', req.body);

    const { user } = req.body;

    if (!user) {
        return res.json({ success: false, message: 'Kullanıcı bilgisi eksik!' });
    }

    try {
        const users = await query('SELECT id, balance FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;
        const today = new Date().toISOString().split('T')[0];

        // Bugün zaten alınmış mı kontrol et
        const existing = await query('SELECT * FROM daily_rewards WHERE user_id = ? AND claim_date = ?', [userId, today]);
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Bugünkü ödülünüzü zaten aldınız!', alreadyClaimed: true });
        }

        // Rastgele ödül belirle
        const isMoney = Math.random() > 0.5;
        let rewardAmount;
        let rewardType;
        let rewardText;

        if (isMoney) {
            rewardAmount = Math.floor(Math.random() * 91) + 10; // 10-100 TL
            rewardType = 'money';
            rewardText = rewardAmount + ' TL';

            // Bakiyeye ekle
            await query('UPDATE users SET balance = balance + ? WHERE id = ?', [rewardAmount, userId]);
        } else {
            rewardAmount = Math.floor(Math.random() * 30) + 1; // 1-30 Free Spin
            rewardType = 'spin';
            rewardText = rewardAmount + ' Free Spin';
        }

        // Ödülü kaydet
        await query('INSERT INTO daily_rewards (user_id, reward_type, reward_amount, claim_date) VALUES (?, ?, ?, ?)',
            [userId, rewardType, rewardAmount, today]);

        // Güncel bakiyeyi al
        const updatedUser = await query('SELECT balance FROM users WHERE id = ?', [userId]);
        const newBalance = parseFloat(updatedUser[0].balance);

        await saveLog(userId, null, 'DAILY_REWARD', `Günlük ödül alındı: ${rewardText}`, req.ip);

        res.json({
            success: true,
            reward: rewardText,
            rewardType: rewardType,
            rewardAmount: rewardAmount,
            newBalance: newBalance,
            message: `Tebrikler! ${rewardText} kazandınız!`
        });
    } catch (error) {
        console.error("❌ Günlük Ödül Hatası:", error);
        res.json({ success: false, message: 'Ödül alınamadı.' });
    }
});

// 9. GÜNLÜK ÖDÜL DURUMU KONTROL
app.get('/api/daily-reward-status/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const users = await query('SELECT id FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.json({ canClaim: false });
        }

        const userId = users[0].id;
        const today = new Date().toISOString().split('T')[0];

        const existing = await query('SELECT * FROM daily_rewards WHERE user_id = ? AND claim_date = ?', [userId, today]);

        res.json({
            canClaim: existing.length === 0,
            lastClaim: existing.length > 0 ? existing[0].created_at : null
        });
    } catch (error) {
        console.error(error);
        res.json({ canClaim: false });
    }
});

// ================== BAHİS SİSTEMİ ==================
// NOT: Ana bahis endpoint'i /api/place-bet satır 1429'da tanımlı (kupon sistemi)

// 11. KULLANICI BAHİS GEÇMİŞİ
app.get('/api/my-bets/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const users = await query('SELECT id FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.json({ success: false, bets: [] });
        }

        const bets = await query('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [users[0].id]);
        res.json({ success: true, bets: bets });
    } catch (error) {
        console.error(error);
        res.json({ success: false, bets: [] });
    }
});

// ================== ÇARK SİSTEMİ ==================

// 12. ÇARK ÇEVİR
app.post('/api/spin-wheel', async (req, res) => {
    console.log('🎡 Çark Çevirme:', req.body);

    const { user } = req.body;

    if (!user) {
        return res.json({ success: false, message: 'Kullanıcı bilgisi eksik!' });
    }

    try {
        const users = await query('SELECT id, balance FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Son çevirme zamanını kontrol et
        const lastSpin = await query('SELECT spin_time FROM wheel_spins WHERE user_id = ? ORDER BY spin_time DESC LIMIT 1', [userId]);

        if (lastSpin.length > 0) {
            const lastSpinTime = parseInt(lastSpin[0].spin_time);
            if (now - lastSpinTime < oneWeek) {
                const nextSpinTime = lastSpinTime + oneWeek;
                return res.json({
                    success: false,
                    message: 'Haftalık hakkınızı kullandınız!',
                    nextSpinTime: nextSpinTime
                });
            }
        }

        // Ödül belirle
        const prizes = ["100 TL", "20 FS", "500 TL", "50 FS", "1000 TL", "100 FS", "5000 TL", "250 FS"];
        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const prize = prizes[prizeIndex];

        // Promosyon kodu oluştur
        const promoCode = "KING-" + Math.floor(10000 + Math.random() * 90000);

        // Çevirmeyi kaydet
        await query('INSERT INTO wheel_spins (user_id, prize, promo_code, spin_time) VALUES (?, ?, ?, ?)',
            [userId, prize, promoCode, now]);

        // Promosyon kodunu ekle
        const prizeValue = parseInt(prize.split(' ')[0]);
        const prizeType = prize.includes('TL') ? 'money' : 'spin';

        await query('INSERT INTO promo_codes (code, type, value, max_uses, is_active) VALUES (?, ?, ?, ?, ?)',
            [promoCode, prizeType, prizeValue, 1, 1]);

        await saveLog(userId, null, 'WHEEL_SPIN', `Çark çevirildi: ${prize}`, req.ip);

        res.json({
            success: true,
            prize: prize,
            promoCode: promoCode,
            message: `Tebrikler! ${prize} kazandınız!`
        });
    } catch (error) {
        console.error("❌ Çark Hatası:", error);
        res.json({ success: false, message: 'Çark çevrilemedi.' });
    }
});

// 13. ÇARK DURUMU KONTROL
app.get('/api/wheel-status/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const users = await query('SELECT id FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.json({ canSpin: false });
        }

        const userId = users[0].id;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        const lastSpin = await query('SELECT spin_time FROM wheel_spins WHERE user_id = ? ORDER BY spin_time DESC LIMIT 1', [userId]);

        if (lastSpin.length === 0) {
            return res.json({ canSpin: true });
        }

        const lastSpinTime = parseInt(lastSpin[0].spin_time);
        const canSpin = (now - lastSpinTime) >= oneWeek;
        const nextSpinTime = lastSpinTime + oneWeek;

        res.json({
            canSpin: canSpin,
            nextSpinTime: canSpin ? null : nextSpinTime,
            lastSpinTime: lastSpinTime
        });
    } catch (error) {
        console.error(error);
        res.json({ canSpin: false });
    }
});

// ================== PROMOSYON SİSTEMİ ==================

// 14. PROMOSYON KODU KULLAN
app.post('/api/redeem-coupon', async (req, res) => {
    console.log('🎫 Kupon Kullanma:', req.body);

    const { user, code } = req.body;

    if (!user || !code) {
        return res.json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const users = await query('SELECT id, balance FROM users WHERE username = ?', [user]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;
        let currentBalance = parseFloat(users[0].balance);

        // Kodu kontrol et
        const promos = await query('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1', [code.toUpperCase()]);

        if (promos.length === 0) {
            return res.json({ success: false, message: 'Geçersiz veya kullanılmış kod!' });
        }

        const promo = promos[0];

        // Kullanım limiti kontrolü
        if (promo.current_uses >= promo.max_uses) {
            return res.json({ success: false, message: 'Bu kod kullanım limitine ulaşmış!' });
        }

        // Süre kontrolü
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
            return res.json({ success: false, message: 'Bu kodun süresi dolmuş!' });
        }

        // Ödülü ver
        let rewardText = '';
        if (promo.type === 'money') {
            currentBalance += promo.value;
            await query('UPDATE users SET balance = ? WHERE id = ?', [currentBalance, userId]);
            rewardText = promo.value + ' TL hesabınıza eklendi!';
        } else if (promo.type === 'spin') {
            rewardText = promo.value + ' Free Spin kazandınız!';
        } else if (promo.type === 'bonus') {
            currentBalance += promo.value;
            await query('UPDATE users SET balance = ? WHERE id = ?', [currentBalance, userId]);
            rewardText = promo.value + ' TL bonus eklendi!';
        }

        // Kullanım sayısını artır
        await query('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?', [promo.id]);

        // Tek kullanımlıksa deaktif et
        if (promo.max_uses === 1) {
            await query('UPDATE promo_codes SET is_active = 0 WHERE id = ?', [promo.id]);
        }

        await saveLog(userId, null, 'PROMO_REDEEM', `Promosyon kodu kullanıldı: ${code}`, req.ip);

        res.json({
            success: true,
            newBalance: currentBalance,
            message: rewardText
        });
    } catch (error) {
        console.error("❌ Kupon Hatası:", error);
        res.json({ success: false, message: 'Kod kullanılamadı.' });
    }
});

// ================== MAÇLAR - football-data.org API v4 ==================

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const SPORTS_GAME_ODDS_API_KEY = process.env.SPORTS_GAME_ODDS_API_KEY || process.env.SPORTS_ODDS_API_KEY_HEADER || '';
const SPORTS_GAME_ODDS_BOOKMAKERS = (process.env.SPORTS_GAME_ODDS_BOOKMAKERS || 'fanduel,draftkings,betmgm')
    .split(',')
    .map((bookmaker) => bookmaker.trim())
    .filter(Boolean);
const SPORTS_GAME_ODDS_ODD_IDS = [
    'points-home-game-ml3way-home',
    'points-all-game-ml3way-draw',
    'points-away-game-ml3way-away',
    'points-home-reg-ml3way-home',
    'points-all-reg-ml3way-draw',
    'points-away-reg-ml3way-away',
    'points-all-game-ou-over',
    'points-all-game-ou-under',
    'points-all-reg-ou-over',
    'points-all-reg-ou-under',
    'bothTeamsScored-all-game-yn-yes',
    'bothTeamsScored-all-game-yn-no'
].join(',');
const SPORTS_GAME_ODDS_LEAGUES = {
    EPL: { name: 'Premier League', flag: '🏴' },
    BUNDESLIGA: { name: 'Bundesliga', flag: '🇩🇪' },
    LA_LIGA: { name: 'La Liga', flag: '🇪🇸' },
    IT_SERIE_A: { name: 'Serie A', flag: '🇮🇹' },
    FR_LIGUE_1: { name: 'Ligue 1', flag: '🇫🇷' },
    BR_SERIE_A: { name: 'Serie A', flag: '🇧🇷' },
    UEFA_CHAMPIONS_LEAGUE: { name: 'Sampiyonlar Ligi', flag: '🏆' },
    UEFA_EUROPA_LEAGUE: { name: 'Avrupa Ligi', flag: '🏆' },
    MLS: { name: 'MLS', flag: '🇺🇸' },
    LIGA_MX: { name: 'Liga MX', flag: '🇲🇽' },
    INTERNATIONAL_SOCCER: { name: 'Uluslararasi Futbol', flag: '🌍' }
};

// football-data.org Competition Kodları (Ücretsiz Tier)
const LEAGUES = {
    // İngiltere
    'PL': {
        code: 'PL',
        name: 'Premier League',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        country: 'EN'
    },

    // Türkiye
    'TSL': {
        code: 'TSL',
        name: 'Süper Lig',
        flag: '🇹🇷',
        country: 'TR'
    },

    'ELC': {
        code: 'ELC',
        name: 'Championship',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        country: 'EN'
    },

    // Avrupa Büyük Ligleri
    'BL1': {
        code: 'BL1',
        name: 'Bundesliga',
        flag: '🇩🇪',
        country: 'DE'
    },
    'PD': {
        code: 'PD',
        name: 'La Liga',
        flag: '🇪🇸',
        country: 'ES'
    },
    'SA': {
        code: 'SA',
        name: 'Serie A',
        flag: '🇮🇹',
        country: 'IT'
    },
    'FL1': {
        code: 'FL1',
        name: 'Ligue 1',
        flag: '🇫🇷',
        country: 'FR'
    },

    // Diğer Avrupa
    'DED': {
        code: 'DED',
        name: 'Eredivisie',
        flag: '🇳🇱',
        country: 'NL'
    },
    'PPL': {
        code: 'PPL',
        name: 'Primeira Liga',
        flag: '🇵🇹',
        country: 'PT'
    },

    // Amerika
    'BSA': {
        code: 'BSA',
        name: 'Série A',
        flag: '🇧🇷',
        country: 'BR'
    },

    // Uluslararası Turnuvalar
    'CL': {
        code: 'CL',
        name: 'Şampiyonlar Ligi',
        flag: '🏆',
        country: 'EU'
    },
    'EC': {
        code: 'EC',
        name: 'Avrupa Şampiyonası',
        flag: '🏆',
        country: 'EU'
    },
    'WC': {
        code: 'WC',
        name: 'Dünya Kupası',
        flag: '🌍',
        country: 'INT'
    }
};

// Güçlü takımlar (düşük oran alırlar)
const STRONG_TEAMS = [
    'galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor',
    'real madrid', 'barcelona', 'atletico madrid',
    'manchester city', 'arsenal', 'liverpool', 'manchester united', 'chelsea',
    'bayern munich', 'bayern münchen', 'borussia dortmund', 'bayer leverkusen',
    'inter', 'ac milan', 'juventus', 'napoli',
    'paris saint-germain', 'psg', 'monaco', 'marseille',
    'benfica', 'porto', 'sporting',
    'ajax', 'psv', 'feyenoord',
    'flamengo', 'palmeiras', 'corinthians',
    'boca juniors', 'river plate',
    'al-nassr', 'al-hilal', 'al-ahli', 'al-ittihad'
];

// Oran hesaplama fonksiyonu
function generateOdds(homeTeam, awayTeam) {
    const homeStrong = STRONG_TEAMS.some(t => homeTeam.toLowerCase().includes(t));
    const awayStrong = STRONG_TEAMS.some(t => awayTeam.toLowerCase().includes(t));

    let homeOdds, drawOdds, awayOdds;

    if (homeStrong && !awayStrong) {
        homeOdds = (1.25 + Math.random() * 0.5).toFixed(2);
        drawOdds = (3.5 + Math.random() * 1.0).toFixed(2);
        awayOdds = (5.0 + Math.random() * 3.0).toFixed(2);
    } else if (!homeStrong && awayStrong) {
        homeOdds = (3.5 + Math.random() * 2.0).toFixed(2);
        drawOdds = (3.2 + Math.random() * 0.8).toFixed(2);
        awayOdds = (1.6 + Math.random() * 0.6).toFixed(2);
    } else if (homeStrong && awayStrong) {
        homeOdds = (2.0 + Math.random() * 0.6).toFixed(2);
        drawOdds = (3.0 + Math.random() * 0.5).toFixed(2);
        awayOdds = (2.2 + Math.random() * 0.8).toFixed(2);
    } else {
        homeOdds = (1.8 + Math.random() * 0.7).toFixed(2);
        drawOdds = (3.2 + Math.random() * 0.6).toFixed(2);
        awayOdds = (3.5 + Math.random() * 1.5).toFixed(2);
    }

    return {
        home: parseFloat(homeOdds),
        draw: parseFloat(drawOdds),
        away: parseFloat(awayOdds)
    };
}

// UTC zamanını İstanbul saatine çevir (UTC+3)
function toIstanbulTime(utcDateStr) {
    // football-data.org'den gelen ISO 8601 format: "2024-01-14T15:00:00Z"
    const date = new Date(utcDateStr);
    // İstanbul UTC+3 (UTC bazlı işlem yap, lokal saat karışmasın)
    date.setUTCHours(date.getUTCHours() + 3);
    return date;
}

// Detaylı oranlar oluştur
function generateDetailedOdds(homeTeam, awayTeam) {
    const basicOdds = generateOdds(homeTeam, awayTeam);
    const h = basicOdds.home;
    const d = basicOdds.draw;
    const a = basicOdds.away;

    return {
        matchResult: basicOdds,
        doubleChance: {
            '1X': parseFloat((1 / (1 / h + 1 / d) * 1.05).toFixed(2)),
            '12': parseFloat((1 / (1 / h + 1 / a) * 1.05).toFixed(2)),
            'X2': parseFloat((1 / (1 / d + 1 / a) * 1.05).toFixed(2))
        },
        btts: { yes: parseFloat((1.80 + Math.random() * 0.2).toFixed(2)), no: parseFloat((1.90 + Math.random() * 0.2).toFixed(2)) },
        totals: {
            '0.5': { over: parseFloat((1.08 + Math.random() * 0.1).toFixed(2)), under: parseFloat((6.50 + Math.random() * 1.5).toFixed(2)) },
            '1.5': { over: parseFloat((1.25 + Math.random() * 0.15).toFixed(2)), under: parseFloat((3.80 + Math.random() * 0.5).toFixed(2)) },
            '2.5': { over: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)), under: parseFloat((1.95 + Math.random() * 0.2).toFixed(2)) },
            '3.5': { over: parseFloat((2.50 + Math.random() * 0.4).toFixed(2)), under: parseFloat((1.50 + Math.random() * 0.15).toFixed(2)) },
            '4.5': { over: parseFloat((3.80 + Math.random() * 0.8).toFixed(2)), under: parseFloat((1.22 + Math.random() * 0.1).toFixed(2)) },
            '5.5': { over: parseFloat((5.50 + Math.random() * 1.5).toFixed(2)), under: parseFloat((1.10 + Math.random() * 0.08).toFixed(2)) }
        },
        firstHalf: {
            home: parseFloat((h * 1.35 + Math.random() * 0.3).toFixed(2)),
            draw: parseFloat((1.85 + Math.random() * 0.25).toFixed(2)),
            away: parseFloat((a * 1.35 + Math.random() * 0.3).toFixed(2))
        },
        handicap: {
            '-1': { home: parseFloat((h * 1.6).toFixed(2)), draw: 4.00, away: parseFloat((a * 0.55).toFixed(2)) },
            '+1': { home: parseFloat((h * 0.55).toFixed(2)), draw: 4.00, away: parseFloat((a * 1.6).toFixed(2)) }
        },
        corners: {
            '8.5': { over: parseFloat((1.75 + Math.random() * 0.2).toFixed(2)), under: parseFloat((2.05 + Math.random() * 0.2).toFixed(2)) },
            '9.5': { over: parseFloat((1.95 + Math.random() * 0.25).toFixed(2)), under: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)) },
            '10.5': { over: parseFloat((2.20 + Math.random() * 0.3).toFixed(2)), under: parseFloat((1.65 + Math.random() * 0.15).toFixed(2)) }
        },
        homeGoals: {
            '0.5': { over: parseFloat((1.35 + Math.random() * 0.15).toFixed(2)), under: parseFloat((3.00 + Math.random() * 0.5).toFixed(2)) },
            '1.5': { over: parseFloat((1.95 + Math.random() * 0.25).toFixed(2)), under: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)) }
        },
        awayGoals: {
            '0.5': { over: parseFloat((1.50 + Math.random() * 0.2).toFixed(2)), under: parseFloat((2.50 + Math.random() * 0.4).toFixed(2)) },
            '1.5': { over: parseFloat((2.40 + Math.random() * 0.35).toFixed(2)), under: parseFloat((1.55 + Math.random() * 0.15).toFixed(2)) }
        },
        firstGoal: {
            home: parseFloat((1.75 + Math.random() * 0.2).toFixed(2)),
            away: parseFloat((2.20 + Math.random() * 0.3).toFixed(2)),
            noGoal: parseFloat((8.50 + Math.random() * 2.0).toFixed(2))
        },
        correctScore: {
            '1-0': parseFloat((6.50 + Math.random() * 1.5).toFixed(2)),
            '2-0': parseFloat((9.00 + Math.random() * 2.0).toFixed(2)),
            '2-1': parseFloat((8.50 + Math.random() * 1.8).toFixed(2)),
            '1-1': parseFloat((6.00 + Math.random() * 1.2).toFixed(2)),
            '0-0': parseFloat((9.50 + Math.random() * 2.5).toFixed(2)),
            '0-1': parseFloat((8.00 + Math.random() * 2.0).toFixed(2)),
            '0-2': parseFloat((12.00 + Math.random() * 3.0).toFixed(2)),
            '1-2': parseFloat((11.00 + Math.random() * 2.5).toFixed(2)),
            '2-2': parseFloat((12.00 + Math.random() * 3.0).toFixed(2)),
            '3-0': parseFloat((15.00 + Math.random() * 4.0).toFixed(2)),
            '3-1': parseFloat((14.00 + Math.random() * 3.5).toFixed(2)),
            '3-2': parseFloat((21.00 + Math.random() * 5.0).toFixed(2))
        }
    };
}

// Detaylı oranlar oluştur (API'den gelen veriye göre veya fallback) - KULLANILMIYOR
function generateDetailedOddsFromAPI(bookmakerOdds) {
    // Ana oranlar (1X2)
    let h2h = { home: 2.10, draw: 3.25, away: 3.40 };
    let totals = {};
    let btts = { yes: 1.85, no: 1.95 };

    if (bookmakerOdds) {
        // H2H (1X2)
        const h2hMarket = bookmakerOdds.find(m => m.key === 'h2h');
        if (h2hMarket && h2hMarket.outcomes) {
            h2h = {
                home: h2hMarket.outcomes[0]?.price || 2.10,
                draw: h2hMarket.outcomes[2]?.price || 3.25,
                away: h2hMarket.outcomes[1]?.price || 3.40
            };
        }

        // Totals (Üst/Alt)
        const totalsMarket = bookmakerOdds.find(m => m.key === 'totals');
        if (totalsMarket && totalsMarket.outcomes) {
            const over = totalsMarket.outcomes.find(o => o.name === 'Over');
            const under = totalsMarket.outcomes.find(o => o.name === 'Under');
            const point = over?.point || 2.5;
            totals[point] = {
                over: over?.price || 1.90,
                under: under?.price || 1.90
            };
        }
    }

    // Varsayılan detaylı oranlar oluştur
    const baseHome = h2h.home;
    const baseAway = h2h.away;
    const balanceFactor = (baseHome + baseAway) / 2;

    return {
        // 1. Maç Sonucu (1X2)
        matchResult: h2h,

        // 2. Çifte Şans
        doubleChance: {
            '1X': parseFloat((1 / (1 / h2h.home + 1 / h2h.draw) * 1.05).toFixed(2)),
            '12': parseFloat((1 / (1 / h2h.home + 1 / h2h.away) * 1.05).toFixed(2)),
            'X2': parseFloat((1 / (1 / h2h.draw + 1 / h2h.away) * 1.05).toFixed(2))
        },

        // 3. Toplam Gol (Üst/Alt)
        totals: {
            '0.5': { over: parseFloat((1.08 + Math.random() * 0.1).toFixed(2)), under: parseFloat((6.50 + Math.random() * 1.5).toFixed(2)) },
            '1.5': { over: parseFloat((1.25 + Math.random() * 0.15).toFixed(2)), under: parseFloat((3.80 + Math.random() * 0.5).toFixed(2)) },
            '2.5': totals['2.5'] || { over: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)), under: parseFloat((1.95 + Math.random() * 0.2).toFixed(2)) },
            '3.5': { over: parseFloat((2.50 + Math.random() * 0.4).toFixed(2)), under: parseFloat((1.50 + Math.random() * 0.15).toFixed(2)) },
            '4.5': { over: parseFloat((3.80 + Math.random() * 0.8).toFixed(2)), under: parseFloat((1.22 + Math.random() * 0.1).toFixed(2)) },
            '5.5': { over: parseFloat((5.50 + Math.random() * 1.5).toFixed(2)), under: parseFloat((1.10 + Math.random() * 0.08).toFixed(2)) }
        },

        // 4. Karşılıklı Gol (BTTS)
        btts: btts,

        // 5. İlk Yarı Sonucu
        firstHalf: {
            home: parseFloat((h2h.home * 1.35 + Math.random() * 0.3).toFixed(2)),
            draw: parseFloat((1.85 + Math.random() * 0.25).toFixed(2)),
            away: parseFloat((h2h.away * 1.35 + Math.random() * 0.3).toFixed(2))
        },

        // 6. İkinci Yarı Sonucu
        secondHalf: {
            home: parseFloat((h2h.home * 1.25 + Math.random() * 0.25).toFixed(2)),
            draw: parseFloat((2.10 + Math.random() * 0.3).toFixed(2)),
            away: parseFloat((h2h.away * 1.25 + Math.random() * 0.25).toFixed(2))
        },

        // 7. Handikaplı Maç Sonucu
        handicap: {
            '-1': { home: parseFloat((h2h.home * 1.6 + Math.random() * 0.4).toFixed(2)), draw: parseFloat((3.80 + Math.random() * 0.5).toFixed(2)), away: parseFloat((h2h.away * 0.55 + Math.random() * 0.2).toFixed(2)) },
            '+1': { home: parseFloat((h2h.home * 0.55 + Math.random() * 0.2).toFixed(2)), draw: parseFloat((3.80 + Math.random() * 0.5).toFixed(2)), away: parseFloat((h2h.away * 1.6 + Math.random() * 0.4).toFixed(2)) },
            '-2': { home: parseFloat((h2h.home * 2.5 + Math.random() * 0.8).toFixed(2)), draw: parseFloat((4.50 + Math.random() * 1.0).toFixed(2)), away: parseFloat((h2h.away * 0.35 + Math.random() * 0.15).toFixed(2)) },
            '+2': { home: parseFloat((h2h.home * 0.35 + Math.random() * 0.15).toFixed(2)), draw: parseFloat((4.50 + Math.random() * 1.0).toFixed(2)), away: parseFloat((h2h.away * 2.5 + Math.random() * 0.8).toFixed(2)) }
        },

        // 8. Toplam Köşe
        corners: {
            '8.5': { over: parseFloat((1.75 + Math.random() * 0.2).toFixed(2)), under: parseFloat((2.05 + Math.random() * 0.2).toFixed(2)) },
            '9.5': { over: parseFloat((1.95 + Math.random() * 0.25).toFixed(2)), under: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)) },
            '10.5': { over: parseFloat((2.20 + Math.random() * 0.3).toFixed(2)), under: parseFloat((1.65 + Math.random() * 0.15).toFixed(2)) },
            '11.5': { over: parseFloat((2.60 + Math.random() * 0.4).toFixed(2)), under: parseFloat((1.45 + Math.random() * 0.12).toFixed(2)) }
        },

        // 9. Ev Sahibi Toplam Gol
        homeGoals: {
            '0.5': { over: parseFloat((1.35 + Math.random() * 0.15).toFixed(2)), under: parseFloat((3.00 + Math.random() * 0.5).toFixed(2)) },
            '1.5': { over: parseFloat((1.95 + Math.random() * 0.25).toFixed(2)), under: parseFloat((1.85 + Math.random() * 0.2).toFixed(2)) },
            '2.5': { over: parseFloat((3.20 + Math.random() * 0.6).toFixed(2)), under: parseFloat((1.32 + Math.random() * 0.1).toFixed(2)) }
        },

        // 10. Deplasman Toplam Gol
        awayGoals: {
            '0.5': { over: parseFloat((1.50 + Math.random() * 0.2).toFixed(2)), under: parseFloat((2.50 + Math.random() * 0.4).toFixed(2)) },
            '1.5': { over: parseFloat((2.40 + Math.random() * 0.35).toFixed(2)), under: parseFloat((1.55 + Math.random() * 0.15).toFixed(2)) },
            '2.5': { over: parseFloat((4.20 + Math.random() * 0.9).toFixed(2)), under: parseFloat((1.20 + Math.random() * 0.08).toFixed(2)) }
        },

        // 11. İlk Gol
        firstGoal: {
            home: parseFloat((1.75 + Math.random() * 0.2).toFixed(2)),
            away: parseFloat((2.20 + Math.random() * 0.3).toFixed(2)),
            noGoal: parseFloat((8.50 + Math.random() * 2.0).toFixed(2))
        },

        // 12. Skor Tahmini (En Popüler)
        correctScore: {
            '1-0': parseFloat((6.50 + Math.random() * 1.5).toFixed(2)),
            '2-0': parseFloat((9.00 + Math.random() * 2.0).toFixed(2)),
            '2-1': parseFloat((8.50 + Math.random() * 1.8).toFixed(2)),
            '1-1': parseFloat((6.00 + Math.random() * 1.2).toFixed(2)),
            '0-0': parseFloat((9.50 + Math.random() * 2.5).toFixed(2)),
            '0-1': parseFloat((8.00 + Math.random() * 2.0).toFixed(2)),
            '0-2': parseFloat((12.00 + Math.random() * 3.0).toFixed(2)),
            '1-2': parseFloat((11.00 + Math.random() * 2.5).toFixed(2)),
            '2-2': parseFloat((12.00 + Math.random() * 3.0).toFixed(2)),
            '3-0': parseFloat((15.00 + Math.random() * 4.0).toFixed(2)),
            '3-1': parseFloat((14.00 + Math.random() * 3.5).toFixed(2)),
            '3-2': parseFloat((21.00 + Math.random() * 5.0).toFixed(2))
        }
    };
}

// Manuel maçlar (API'de olmayan maçları buraya ekle)
// Tarih formatı: 'YYYY-MM-DD', Saat: İstanbul saati (UTC+3)
function normalizeOddValue(value, fallback = null) {
    const num = Number(value);
    return Number.isFinite(num) ? parseFloat(num.toFixed(2)) : fallback;
}

function americanOddsToDecimal(rawOdds) {
    if (rawOdds === null || rawOdds === undefined) return null;

    const oddsStr = String(rawOdds).trim();
    if (!oddsStr) return null;

    if (/^[+-]\d+(\.\d+)?$/.test(oddsStr)) {
        const odds = parseFloat(oddsStr);
        if (!Number.isFinite(odds) || odds === 0) return null;
        return odds > 0
            ? normalizeOddValue(1 + odds / 100)
            : normalizeOddValue(1 + 100 / Math.abs(odds));
    }

    const decimalOdds = parseFloat(oddsStr);
    if (!Number.isFinite(decimalOdds) || decimalOdds <= 1) return null;

    return normalizeOddValue(decimalOdds);
}

function extractBookmakerPrice(oddNode) {
    if (!oddNode) return null;

    const candidatePrices = [];
    if (oddNode.bookOdds) candidatePrices.push(oddNode.bookOdds);
    if (oddNode.fairOdds) candidatePrices.push(oddNode.fairOdds);

    if (oddNode.byBookmaker) {
        SPORTS_GAME_ODDS_BOOKMAKERS.forEach((bookmakerID) => {
            const bookmakerEntry = oddNode.byBookmaker[bookmakerID];
            if (bookmakerEntry?.available && bookmakerEntry.odds) {
                candidatePrices.push(bookmakerEntry.odds);
            }
        });

        Object.values(oddNode.byBookmaker).forEach((bookmakerEntry) => {
            if (bookmakerEntry?.available && bookmakerEntry.odds) {
                candidatePrices.push(bookmakerEntry.odds);
            }
        });
    }

    for (const price of candidatePrices) {
        const decimalOdds = americanOddsToDecimal(price);
        if (decimalOdds) return decimalOdds;
    }

    return null;
}

function extractMarketLine(oddNode) {
    if (!oddNode) return null;

    const candidates = [
        oddNode.bookOverUnder,
        oddNode.fairOverUnder,
        oddNode.openBookOverUnder,
        oddNode.openFairOverUnder,
        oddNode.bookSpread,
        oddNode.fairSpread
    ];

    for (const candidate of candidates) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
            return parseFloat(parsed.toFixed(1));
        }
    }

    return null;
}

function calculateDoubleChanceOdds(matchResult) {
    if (!matchResult?.home || !matchResult?.draw || !matchResult?.away) {
        return null;
    }

    return {
        '1X': normalizeOddValue(1 / (1 / matchResult.home + 1 / matchResult.draw) * 1.05),
        '12': normalizeOddValue(1 / (1 / matchResult.home + 1 / matchResult.away) * 1.05),
        'X2': normalizeOddValue(1 / (1 / matchResult.draw + 1 / matchResult.away) * 1.05)
    };
}

function selectTotalLines(totals) {
    const availableLines = Object.keys(totals || {})
        .map((line) => Number(line))
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    if (availableLines.length === 0) return [];

    const preferredLines = [];
    [2.5, 3.5].forEach((targetLine) => {
        if (availableLines.includes(targetLine)) preferredLines.push(targetLine);
    });

    availableLines.forEach((line) => {
        if (!preferredLines.includes(line)) preferredLines.push(line);
    });

    return preferredLines.slice(0, 2);
}

function toClientDetailedOdds(homeTeam, awayTeam, detailedOdds = {}) {
    const fallback = generateDetailedOdds(homeTeam, awayTeam);
    const matchResult = {
        home: normalizeOddValue(detailedOdds?.matchResult?.home, fallback.matchResult.home),
        draw: normalizeOddValue(detailedOdds?.matchResult?.draw, fallback.matchResult.draw),
        away: normalizeOddValue(detailedOdds?.matchResult?.away, fallback.matchResult.away)
    };

    const doubleChance = detailedOdds?.doubleChance || calculateDoubleChanceOdds(matchResult) || fallback.doubleChance;
    const totals = { ...fallback.totals, ...(detailedOdds?.totals || {}) };
    const btts = {
        yes: normalizeOddValue(detailedOdds?.btts?.yes, fallback.btts.yes),
        no: normalizeOddValue(detailedOdds?.btts?.no, fallback.btts.no)
    };

    const overUnder = [];
    selectTotalLines(totals).forEach((line) => {
        const market = totals[line] || totals[line.toFixed(1)] || {};
        if (market.over) overUnder.push({ label: `Ust ${line}`, odds: normalizeOddValue(market.over) });
        if (market.under) overUnder.push({ label: `Alt ${line}`, odds: normalizeOddValue(market.under) });
    });

    return {
        matchResult: [
            { label: '1', desc: `${homeTeam} Kazanir`, odds: matchResult.home },
            { label: 'X', desc: 'Beraberlik', odds: matchResult.draw },
            { label: '2', desc: `${awayTeam} Kazanir`, odds: matchResult.away }
        ],
        overUnder,
        bothScore: [
            { label: 'Var', odds: btts.yes },
            { label: 'Yok', odds: btts.no }
        ],
        doubleChance: [
            { label: '1X', odds: normalizeOddValue(doubleChance['1X'], fallback.doubleChance['1X']) },
            { label: '12', odds: normalizeOddValue(doubleChance['12'], fallback.doubleChance['12']) },
            { label: 'X2', odds: normalizeOddValue(doubleChance['X2'], fallback.doubleChance['X2']) }
        ]
    };
}

function formatSportsGameOddsLeague(leagueID) {
    if (SPORTS_GAME_ODDS_LEAGUES[leagueID]) {
        return SPORTS_GAME_ODDS_LEAGUES[leagueID];
    }

    const name = String(leagueID || 'SOCCER')
        .split('_')
        .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');

    return { name, flag: '⚽' };
}

function getSportsGameOddsMatchResult(eventOdds) {
    const markets = [
        {
            home: 'points-home-game-ml3way-home',
            draw: 'points-all-game-ml3way-draw',
            away: 'points-away-game-ml3way-away'
        },
        {
            home: 'points-home-reg-ml3way-home',
            draw: 'points-all-reg-ml3way-draw',
            away: 'points-away-reg-ml3way-away'
        },
        {
            home: 'points-home-game-ml-home',
            away: 'points-away-game-ml-away'
        },
        {
            home: 'points-home-reg-ml-home',
            away: 'points-away-reg-ml-away'
        }
    ];

    for (const market of markets) {
        const home = extractBookmakerPrice(eventOdds?.[market.home]);
        const away = extractBookmakerPrice(eventOdds?.[market.away]);
        const draw = market.draw ? extractBookmakerPrice(eventOdds?.[market.draw]) : null;

        if (home && away && (!market.draw || draw)) {
            return { home, draw, away };
        }
    }

    return {};
}

function getSportsGameOddsTotals(eventOdds) {
    const totals = {};

    Object.values(eventOdds || {}).forEach((oddNode) => {
        if (!oddNode) return;
        if (oddNode.statID !== 'points' || oddNode.betTypeID !== 'ou' || oddNode.statEntityID !== 'all') return;
        if (!['game', 'reg'].includes(oddNode.periodID)) return;

        const line = extractMarketLine(oddNode);
        const price = extractBookmakerPrice(oddNode);
        if (!Number.isFinite(line) || !price) return;

        const key = line.toFixed(1);
        if (!totals[key]) totals[key] = {};
        if (oddNode.sideID === 'over') totals[key].over = price;
        if (oddNode.sideID === 'under') totals[key].under = price;
    });

    return totals;
}

function getSportsGameOddsBtts(eventOdds) {
    return {
        yes: extractBookmakerPrice(eventOdds?.['bothTeamsScored-all-game-yn-yes']),
        no: extractBookmakerPrice(eventOdds?.['bothTeamsScored-all-game-yn-no'])
    };
}

function buildTeamLogoDataUri(label, bgColor = '#0f172a', textColor = '#10b981') {
    const safeLabel = String(label || '?')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .slice(0, 3)
        .toUpperCase();
    const safeBgColor = /^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : '#0f172a';
    const safeTextColor = /^#[0-9a-fA-F]{6}$/.test(textColor) ? textColor : '#10b981';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="24" fill="${safeBgColor}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${safeTextColor}">${safeLabel}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function mapSportsGameOddsEvent(event, todayStr) {
    const homeTeam = event?.teams?.home?.names?.medium || event?.teams?.home?.names?.long || 'Home';
    const awayTeam = event?.teams?.away?.names?.medium || event?.teams?.away?.names?.long || 'Away';
    const homeShort = event?.teams?.home?.names?.short || homeTeam.slice(0, 3);
    const awayShort = event?.teams?.away?.names?.short || awayTeam.slice(0, 3);
    const leagueMeta = formatSportsGameOddsLeague(event?.leagueID);
    const startsAt = event?.status?.startsAt || new Date().toISOString();
    const istanbulDate = toIstanbulTime(startsAt);
    const isoStr = istanbulDate.toISOString();
    const dateStr = isoStr.split('T')[0];
    const timeStr = isoStr.split('T')[1].substring(0, 5);
    const sourceOdds = {
        matchResult: getSportsGameOddsMatchResult(event?.odds),
        totals: getSportsGameOddsTotals(event?.odds),
        btts: getSportsGameOddsBtts(event?.odds)
    };
    const detailedOdds = toClientDetailedOdds(homeTeam, awayTeam, sourceOdds);

    return {
        id: event.eventID,
        league: leagueMeta.name,
        leagueFlag: leagueMeta.flag,
        leagueBadge: '',
        leagueKey: event.leagueID,
        homeTeam,
        awayTeam,
        homeLogo: buildTeamLogoDataUri(homeShort, event?.teams?.home?.colors?.primary, event?.teams?.home?.colors?.primaryContrast),
        awayLogo: buildTeamLogoDataUri(awayShort, event?.teams?.away?.colors?.primary, event?.teams?.away?.colors?.primaryContrast),
        date: dateStr,
        time: timeStr,
        venue: event?.info?.venue?.name || '',
        round: event?.info?.seasonWeek || '',
        odds: {
            home: detailedOdds.matchResult[0].odds,
            draw: detailedOdds.matchResult[1].odds,
            away: detailedOdds.matchResult[2].odds
        },
        detailedOdds,
        status: event?.status?.live ? 'live' : (event?.status?.ended || event?.status?.completed ? 'finished' : 'upcoming'),
        isToday: dateStr === todayStr
    };
}

const MANUAL_MATCHES = [
    {
        homeTeam: 'Atletico Madrid',
        awayTeam: 'FC Barcelona',
        date: '2026-02-12',
        time: '23:00',
        league: 'La Liga',
        leagueFlag: '🇪🇸',
        leagueKey: 'PD'
    },
    {
        homeTeam: 'Thun',
        awayTeam: 'Lausanne',
        date: '2026-02-12',
        time: '22:30',
        league: 'İsviçre Süper Lig',
        leagueFlag: '🇨🇭',
        leagueKey: 'SWISS'
    },
    // ===== SÜPER LİG - CUMA (13 Şubat) =====
    {
        homeTeam: 'Galatasaray',
        awayTeam: 'Eyüpspor',
        date: '2026-02-13',
        time: '20:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 1.04, draw: 9.28, away: 17.65 }
    },
    {
        homeTeam: 'Antalyaspor',
        awayTeam: 'Samsunspor',
        date: '2026-02-13',
        time: '20:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 3.63, draw: 3.05, away: 1.87 }
    },
    // ===== SÜPER LİG - CUMARTESİ (14 Şubat) =====
    {
        homeTeam: 'Gençlerbirliği',
        awayTeam: 'Rizespor',
        date: '2026-02-14',
        time: '14:30',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 2.38, draw: 2.98, away: 2.62 }
    },
    {
        homeTeam: 'Alanyaspor',
        awayTeam: 'Konyaspor',
        date: '2026-02-14',
        time: '17:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 1.98, draw: 3.14, away: 3.17 }
    },
    {
        homeTeam: 'Trabzonspor',
        awayTeam: 'Fenerbahçe',
        date: '2026-02-14',
        time: '20:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 3.22, draw: 3.48, away: 1.85 }
    },
    // ===== SÜPER LİG - PAZAR (15 Şubat) =====
    {
        homeTeam: 'Kocaelispor',
        awayTeam: 'Gaziantep FK',
        date: '2026-02-15',
        time: '14:30',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 1.82, draw: 3.22, away: 3.58 }
    },
    {
        homeTeam: 'Göztepe',
        awayTeam: 'Kayserispor',
        date: '2026-02-15',
        time: '17:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 1.48, draw: 3.67, away: 5.31 }
    },
    {
        homeTeam: 'Başakşehir',
        awayTeam: 'Beşiktaş',
        date: '2026-02-15',
        time: '20:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 2.42, draw: 3.36, away: 2.34 }
    },
    // ===== SÜPER LİG - PAZARTESİ (16 Şubat) =====
    {
        homeTeam: 'Kasımpaşa',
        awayTeam: 'Fatih Karagümrük',
        date: '2026-02-16',
        time: '20:00',
        league: 'Süper Lig',
        leagueFlag: '🇹🇷',
        leagueKey: 'TSL',
        customOdds: { home: 1.76, draw: 3.32, away: 3.69 }
    }
];

// Maç cache'i (10 dakika)
let matchCache = {
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika

// Tüm liglerden maçları çek (football-data.org v4)
async function fetchAllMatchesFromFootballData() {
    console.log('🔄 football-data.org\'den maçlar çekiliyor...');
    console.log(`📋 ${Object.keys(LEAGUES).length} lig kontrol ediliyor...`);

    if (!FOOTBALL_DATA_API_KEY) {
        console.error('❌ FOOTBALL_DATA_API_KEY .env dosyasında tanımlı değil!');
        return [];
    }

    try {
        // Bugünden 7 gün sonrasına kadar maçları çek (tek istek)
        const today = new Date();
        const apiMatches = [];
        const chunkDays = 10;
        const windowCount = 3;
        for (let windowIndex = 0; windowIndex < windowCount; windowIndex++) {
            const rangeStart = new Date(today.getTime() + windowIndex * chunkDays * 24 * 60 * 60 * 1000);
            const rangeEnd = new Date(today.getTime() + (windowIndex + 1) * chunkDays * 24 * 60 * 60 * 1000);
            const windowFrom = rangeStart.toISOString().split('T')[0];
            const windowTo = rangeEnd.toISOString().split('T')[0];
            const windowUrl = `https://api.football-data.org/v4/matches?dateFrom=${windowFrom}&dateTo=${windowTo}`;
            const windowResponse = await fetch(windowUrl, {
                headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
            });
            if (!windowResponse.ok) {
                console.error(`âŒ football-data.org pencere hatasÄ±: ${windowResponse.status} ${windowResponse.statusText} (${windowFrom} - ${windowTo})`);
                continue;
            }
            const windowPayload = await windowResponse.json();
            apiMatches.push(...(windowPayload.matches || []));
        }
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const apiUrl = `https://api.football-data.org/v4/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
        const response = await fetch(apiUrl, {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
        });

        if (!response.ok) {
            console.error(`❌ football-data.org API hatası: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        data.matches = [...apiMatches, ...(data.matches || [])].filter((match, index, arr) =>
            index === arr.findIndex((item) => item.id === match.id)
        );

        if (!data.matches || data.matches.length === 0) {
            console.log('ℹ️ Yaklaşan maç bulunamadı');
            return [];
        }

        // Bugünün tarihini al (İstanbul saati, UTC+3)
        const todayIST = new Date();
        todayIST.setUTCHours(todayIST.getUTCHours() + 3);
        const todayStr = todayIST.toISOString().split('T')[0];

        // Varsayılan takım logosu (logo bulunamazsa futbol topu)
        const DEFAULT_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/240px-Soccerball.svg.png';

        // Sadece LEAGUES'de tanımlı liglerin maçlarını filtrele
        const validCodes = new Set(Object.keys(LEAGUES));

        let matches = data.matches
            .filter(match => validCodes.has(match.competition.code) && match.status !== 'FINISHED')
            .map(match => {
                const leagueKey = match.competition.code;
                const leagueInfo = LEAGUES[leagueKey];

                // Saati İstanbul'a çevir (UTC bazlı)
                const istanbulDate = toIstanbulTime(match.utcDate);
                const isoStr = istanbulDate.toISOString();
                const dateStr = isoStr.split('T')[0];
                const timeStr = isoStr.split('T')[1].substring(0, 5);

                // Oranları hesapla
                const generatedOdds = generateDetailedOdds(match.homeTeam.name, match.awayTeam.name);
                const detailedOdds = toClientDetailedOdds(match.homeTeam.name, match.awayTeam.name, generatedOdds);

                // Bugünün maçı mı kontrol et
                const isToday = dateStr === todayStr;

                // Maç durumunu belirle
                let status = 'upcoming';
                if (match.status === 'IN_PLAY' || match.status === 'PAUSED') status = 'live';
                else if (match.status === 'FINISHED') status = 'finished';

                return {
                    id: match.id,
                    league: leagueInfo.name,
                    leagueFlag: leagueInfo.flag,
                    leagueBadge: match.competition.emblem || '',
                    leagueKey: leagueKey,
                    homeTeam: match.homeTeam.name,
                    awayTeam: match.awayTeam.name,
                    homeLogo: match.homeTeam.crest || DEFAULT_LOGO,
                    awayLogo: match.awayTeam.crest || DEFAULT_LOGO,
                    date: dateStr,
                    time: timeStr,
                    venue: match.venue || '',
                    round: match.matchday,
                    odds: generatedOdds.matchResult,
                    detailedOdds: detailedOdds,
                    status: status,
                    isToday: isToday
                };
            });

        // API'den gelen tüm takım logolarını cache'le (manuel maçlar için)
        const teamCrests = {};
        data.matches.forEach(m => {
            if (m.homeTeam && m.homeTeam.crest) teamCrests[m.homeTeam.name.toLowerCase()] = m.homeTeam.crest;
            if (m.awayTeam && m.awayTeam.crest) teamCrests[m.awayTeam.name.toLowerCase()] = m.awayTeam.crest;
        });

        // Türk takım logoları (Wikipedia/Commons)
        // Türk takım logoları (Transfermarkt CDN - güvenilir)
        const TURKISH_LOGOS = {
            'galatasaray': 'https://tmssl.akamaized.net/images/wappen/head/141.png',
            'fenerbahçe': 'https://tmssl.akamaized.net/images/wappen/head/36.png',
            'beşiktaş': 'https://tmssl.akamaized.net/images/wappen/head/114.png',
            'trabzonspor': 'https://tmssl.akamaized.net/images/wappen/head/449.png',
            'başakşehir': 'https://tmssl.akamaized.net/images/wappen/head/6890.png',
            'göztepe': 'https://tmssl.akamaized.net/images/wappen/head/2381.png',
            'antalyaspor': 'https://tmssl.akamaized.net/images/wappen/head/589.png',
            'alanyaspor': 'https://tmssl.akamaized.net/images/wappen/head/7060.png',
            'kasımpaşa': 'https://tmssl.akamaized.net/images/wappen/head/3061.png',
            'konyaspor': 'https://tmssl.akamaized.net/images/wappen/head/2832.png',
            'samsunspor': 'https://tmssl.akamaized.net/images/wappen/head/4171.png',
            'kayserispor': 'https://tmssl.akamaized.net/images/wappen/head/3205.png',
            'rizespor': 'https://tmssl.akamaized.net/images/wappen/head/3843.png',
            'eyüpspor': 'https://tmssl.akamaized.net/images/wappen/head/3203.png',
            'gaziantep': 'https://tmssl.akamaized.net/images/wappen/head/82.png',
            'kocaelispor': 'https://tmssl.akamaized.net/images/wappen/head/1484.png',
            'gençlerbirliği': 'https://tmssl.akamaized.net/images/wappen/head/3286.png',
            'fatih karagümrük': 'https://tmssl.akamaized.net/images/wappen/head/1963.png'
        };

        // Manuel maçları ekle (API'de olmayanlar)
        const existingPairs = new Set(matches.map(m => `${m.homeTeam.toLowerCase()}-${m.awayTeam.toLowerCase()}`));
        MANUAL_MATCHES.forEach((mm, idx) => {
            if (mm.date < todayStr) return;
            const pairKey = `${mm.homeTeam.toLowerCase()}-${mm.awayTeam.toLowerCase()}`;
            if (!existingPairs.has(pairKey)) {
                const isToday = mm.date === todayStr;

                // customOdds varsa onu kullan, yoksa generateDetailedOdds
                let generatedOdds;
                if (mm.customOdds) {
                    generatedOdds = generateDetailedOdds(mm.homeTeam, mm.awayTeam);
                    generatedOdds.matchResult = mm.customOdds;
                } else {
                    generatedOdds = generateDetailedOdds(mm.homeTeam, mm.awayTeam);
                }
                const detailedOdds = toClientDetailedOdds(mm.homeTeam, mm.awayTeam, generatedOdds);

                // Logoları bul: önce Türk logo haritası, sonra API cache, sonra DEFAULT_LOGO
                const findCrest = (name) => {
                    const lower = name.toLowerCase();
                    // Türk takım logoları
                    if (TURKISH_LOGOS[lower]) return TURKISH_LOGOS[lower];
                    for (const [tName, tLogo] of Object.entries(TURKISH_LOGOS)) {
                        if (lower.includes(tName) || tName.includes(lower)) return tLogo;
                    }
                    // API cache
                    if (teamCrests[lower]) return teamCrests[lower];
                    for (const [teamName, crest] of Object.entries(teamCrests)) {
                        if (teamName.includes(lower) || lower.includes(teamName)) return crest;
                        const keywords = lower.split(' ');
                        if (keywords.some(kw => kw.length > 3 && teamName.includes(kw))) return crest;
                    }
                    return DEFAULT_LOGO;
                };
                matches.push({
                    id: `manual-${idx}`,
                    league: mm.league,
                    leagueFlag: mm.leagueFlag,
                    leagueBadge: '',
                    leagueKey: mm.leagueKey,
                    homeTeam: mm.homeTeam,
                    awayTeam: mm.awayTeam,
                    homeLogo: findCrest(mm.homeTeam),
                    awayLogo: findCrest(mm.awayTeam),
                    date: mm.date,
                    time: mm.time,
                    venue: '',
                    round: '',
                    odds: generatedOdds.matchResult,
                    detailedOdds: detailedOdds,
                    status: 'upcoming',
                    isToday: isToday
                });
                console.log(`📌 Manuel eklendi: ${mm.homeTeam} - ${mm.awayTeam}`);
            }
        });

        // Duplicate temizle
        const seenIds = new Set();
        matches = matches.filter(m => {
            if (seenIds.has(m.id)) return false;
            seenIds.add(m.id);
            return true;
        });

        // Tarihe göre sırala
        matches.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateA - dateB;
        });

        // Bugünün maçlarını say
        const todayCount = matches.filter(m => m.isToday).length;

        // Lig bazında log
        const leagueCounts = {};
        matches.forEach(m => {
            leagueCounts[m.league] = (leagueCounts[m.league] || 0) + 1;
        });
        Object.entries(leagueCounts).forEach(([name, count]) => {
            console.log(`✅ ${name}: ${count} maç`);
        });

        console.log('═══════════════════════════════════════');
        console.log(`✅ TOPLAM: ${matches.length} maç yüklendi`);
        console.log(`📅 BUGÜN: ${todayCount} maç var`);
        console.log('═══════════════════════════════════════');

        return matches;
    } catch (e) {
        console.error('❌ football-data.org hatası:', e.message);
        return [];
    }
}

// Maçları liglere göre grupla
async function fetchAllMatchesFromSportsGameOdds() {
    console.log('SportsGameOdds API\'den maclar cekiliyor...');

    if (!SPORTS_GAME_ODDS_API_KEY) {
        console.warn('SPORTS_GAME_ODDS_API_KEY tanimli degil, fallback calisacak.');
        return [];
    }

    try {
        const today = new Date();
        const apiMatches = [];
        const chunkDays = 10;
        const windowCount = 3;
        for (let windowIndex = 0; windowIndex < windowCount; windowIndex++) {
            const rangeStart = new Date(today.getTime() + windowIndex * chunkDays * 24 * 60 * 60 * 1000);
            const rangeEnd = new Date(today.getTime() + (windowIndex + 1) * chunkDays * 24 * 60 * 60 * 1000);
            const windowFrom = rangeStart.toISOString().split('T')[0];
            const windowTo = rangeEnd.toISOString().split('T')[0];
            const windowUrl = `https://api.football-data.org/v4/matches?dateFrom=${windowFrom}&dateTo=${windowTo}`;
            const windowResponse = await fetch(windowUrl, {
                headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
            });
            if (!windowResponse.ok) {
                console.error(`âŒ football-data.org pencere hatasÄ±: ${windowResponse.status} ${windowResponse.statusText} (${windowFrom} - ${windowTo})`);
                continue;
            }
            const windowPayload = await windowResponse.json();
            apiMatches.push(...(windowPayload.matches || []));
        }
        const startsAfter = today.toISOString();
        const startsBefore = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const todayIST = new Date();
        todayIST.setUTCHours(todayIST.getUTCHours() + 3);
        const todayStr = todayIST.toISOString().split('T')[0];
        const leaguesResponse = await fetch('https://api.sportsgameodds.com/v2/leagues/?sportID=SOCCER', {
            headers: {
                'X-Api-Key': SPORTS_GAME_ODDS_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!leaguesResponse.ok) {
            const errorText = await leaguesResponse.text();
            throw new Error(`SportsGameOdds leagues ${leaguesResponse.status}: ${errorText}`);
        }

        const leaguesPayload = await leaguesResponse.json();
        const availableLeagueIDs = (leaguesPayload.data || [])
            .filter((league) => league?.enabled && league?.leagueID)
            .map((league) => league.leagueID);

        if (availableLeagueIDs.length === 0) {
            console.warn('SportsGameOdds icin erisilebilir futbol ligi bulunamadi.');
            return [];
        }

        let nextCursor = null;
        let pageCount = 0;
        let events = [];

        do {
            const params = new URLSearchParams({
                leagueID: availableLeagueIDs.join(','),
                type: 'match',
                oddsAvailable: 'true',
                ended: 'false',
                startsAfter,
                startsBefore,
                bookmakerID: SPORTS_GAME_ODDS_BOOKMAKERS.join(','),
                oddID: SPORTS_GAME_ODDS_ODD_IDS,
                limit: '100'
            });

            if (nextCursor) {
                params.set('cursor', nextCursor);
            }

            const response = await fetch(`https://api.sportsgameodds.com/v2/events/?${params.toString()}`, {
                headers: {
                    'X-Api-Key': SPORTS_GAME_ODDS_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`SportsGameOdds ${response.status}: ${errorText}`);
            }

            const payload = await response.json();
            events = events.concat(payload.data || []);
            nextCursor = payload.nextCursor || null;
            pageCount += 1;
        } while (nextCursor && pageCount < 10);

        const matches = events
            .filter((event) => event?.teams?.home && event?.teams?.away && !event?.status?.cancelled)
            .map((event) => mapSportsGameOddsEvent(event, todayStr))
            .sort((a, b) => new Date(`${a.date}T${a.time}:00`) - new Date(`${b.date}T${b.time}:00`));

        console.log(`SportsGameOdds basarili: ${matches.length} mac`);
        return matches;
    } catch (error) {
        console.error('SportsGameOdds hatasi:', error.message);
        return [];
    }
}

async function fetchAllMatches() {
    return fetchAllMatchesFromFootballData();
}

function groupMatchesByLeague(matches) {
    const grouped = {};

    // Önce tüm ligleri LEAGUES sırasına göre ekle
    Object.entries(LEAGUES).forEach(([key, info]) => {
        grouped[key] = {
            key: key,
            name: info.name,
            flag: info.flag,
            badge: '',
            country: info.country,
            matches: [],
            matchCount: 0,
            todayCount: 0
        };
    });

    // Maçları ilgili liglere ekle
    matches.forEach(match => {
        // LEAGUES'de olmayan manuel ligler için otomatik grup oluştur
        if (!grouped[match.leagueKey]) {
            grouped[match.leagueKey] = {
                key: match.leagueKey,
                name: match.league,
                flag: match.leagueFlag,
                badge: match.leagueBadge || '',
                country: '',
                matches: [],
                matchCount: 0,
                todayCount: 0
            };
        }
        grouped[match.leagueKey].matches.push(match);
        grouped[match.leagueKey].matchCount++;
        // Badge'i API'den gelen emblem ile doldur
        if (match.leagueBadge && !grouped[match.leagueKey].badge) {
            grouped[match.leagueKey].badge = match.leagueBadge;
        }
        if (match.isToday) {
            grouped[match.leagueKey].todayCount++;
        }
    });

    // Sadece maçı olan ligleri döndür, array olarak
    return Object.values(grouped).filter(league => league.matchCount > 0);
}

// 15. CANLI MAÇLARI ÇEK (football-data.org)
app.get('/api/live-matches', async (req, res) => {
    try {
        const { league, refresh } = req.query;
        const now = Date.now();

        let allMatches;

        // Cache kontrolü
        if (!refresh && matchCache.data && (now - matchCache.timestamp) < CACHE_DURATION) {
            console.log('📦 Cache\'den maçlar yüklendi');
            allMatches = matchCache.data;
        } else {
            // football-data.org'den maçları çek
            allMatches = await fetchAllMatches();
            // Cache'e kaydet
            matchCache = { data: allMatches, timestamp: now };
        }

        // Filtreleme için kopya
        let filteredMatches = [...allMatches];

        // Lig filtresi
        if (league) {
            filteredMatches = filteredMatches.filter(m => m.leagueKey === league);
        }

        // Bugün filtresi
        if (req.query.today === 'true') {
            filteredMatches = filteredMatches.filter(m => m.isToday);
        }

        // Arama filtresi
        if (req.query.search) {
            const searchTerm = req.query.search.toLowerCase();
            filteredMatches = filteredMatches.filter(m =>
                m.homeTeam.toLowerCase().includes(searchTerm) ||
                m.awayTeam.toLowerCase().includes(searchTerm) ||
                m.league.toLowerCase().includes(searchTerm)
            );
        }

        // Liglere göre grupla
        const leagueGroups = groupMatchesByLeague(filteredMatches);

        // Bugünün maçları (tüm liglerden)
        const todayMatches = allMatches.filter(m => m.isToday);
        const todayByLeague = groupMatchesByLeague(todayMatches);

        // İstatistikler
        const stats = {
            totalMatches: allMatches.length,
            filteredCount: filteredMatches.length,
            todayCount: todayMatches.length,
            leagueCount: leagueGroups.length
        };

        res.json({
            success: true,
            // Liglere göre gruplanmış maçlar
            leagues: leagueGroups,
            // Bugünün maçları (liglere göre gruplanmış)
            todayLeagues: todayByLeague,
            // Tüm maçlar (düz liste - geriye uyumluluk)
            matches: filteredMatches,
            // Bugünün tüm maçları (düz liste)
            todayMatches: todayMatches,
            // İstatistikler
            stats: stats,
            cached: !!(matchCache.data && (now - matchCache.timestamp) < CACHE_DURATION)
        });
    } catch (error) {
        console.error('❌ Maç çekme hatası:', error);
        res.json({ success: false, matches: [], leagues: [], error: error.message });
    }
});

// 15a. BAHİS YATIR (Kupon Sistemi)
app.post('/api/place-bet', async (req, res) => {
    try {
        const { username, amount, totalOdds, potentialWin, selections } = req.body;

        console.log('📝 Bahis isteği:', { username, amount, totalOdds, selectionsCount: selections?.length });

        if (!username) {
            return res.json({ success: false, message: 'Kullanıcı adı eksik!' });
        }
        if (!amount || amount <= 0) {
            return res.json({ success: false, message: 'Geçersiz bahis tutarı!' });
        }
        if (!selections || selections.length === 0) {
            return res.json({ success: false, message: 'Lütfen en az bir bahis seçin!' });
        }

        // Kullanıcıyı bul
        const users = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const user = users[0];

        // Bakiye kontrolü
        if (parseFloat(user.balance) < parseFloat(amount)) {
            return res.json({ success: false, message: 'Yetersiz bakiye!' });
        }

        // Minimum bahis kontrolü
        if (amount < 10) {
            return res.json({ success: false, message: 'Minimum bahis tutarı 10 TL!' });
        }

        // Bakiyeden düş
        const newBalance = parseFloat(user.balance) - parseFloat(amount);
        await query('UPDATE users SET balance = ?, total_bet = total_bet + ? WHERE id = ?', [newBalance, amount, user.id]);

        // Kupon oluştur
        const couponResult = await query(
            'INSERT INTO coupons (user_id, amount, total_odds, potential_win, status) VALUES (?, ?, ?, ?, ?)',
            [user.id, amount, totalOdds, potentialWin, 'pending']
        );
        const couponId = couponResult.insertId;

        // Her seçimi kaydet
        for (const sel of selections) {
            await query(
                'INSERT INTO coupon_selections (coupon_id, match_id, match_name, pick_type, pick_label, odds, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [couponId, sel.matchId || '', sel.match, sel.pick, sel.label, sel.odds, 'pending']
            );
        }

        // Eski bets tablosuna da kaydet (geriye uyumluluk)
        for (const sel of selections) {
            await query(
                'INSERT INTO bets (user_id, match_name, pick, odds, amount, potential_win, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [user.id, sel.match, `${sel.pick}: ${sel.label}`, sel.odds, amount / selections.length, (amount / selections.length) * sel.odds, 'pending']
            );
        }

        // Log kaydet
        await query(
            'INSERT INTO logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
            [user.id, 'place_bet', `Kupon #${couponId}: ${selections.length} seçim, ${amount} TL, Oran: ${totalOdds}`, req.ip]
        );

        console.log(`🎫 Kupon oluşturuldu: #${couponId} - ${username} - ${amount} TL - ${selections.length} seçim`);

        res.json({
            success: true,
            message: 'Kupon başarıyla oluşturuldu!',
            couponId: couponId,
            newBalance: newBalance
        });

    } catch (error) {
        console.error('❌ Bahis hatası:', error);
        res.json({ success: false, message: 'Bahis yatırılamadı: ' + error.message });
    }
});

// 15a2. KULLANICI KUPONLARINI GETİR
app.get('/api/coupons/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const users = await query('SELECT id FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;

        // Kuponları çek
        const coupons = await query(
            'SELECT * FROM coupons WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        // Her kupon için seçimleri çek
        for (let coupon of coupons) {
            const selections = await query(
                'SELECT * FROM coupon_selections WHERE coupon_id = ?',
                [coupon.id]
            );
            coupon.selections = selections;
        }

        res.json({ success: true, coupons });

    } catch (error) {
        console.error('❌ Kupon getirme hatası:', error);
        res.json({ success: false, message: 'Kuponlar yüklenemedi!' });
    }
});

// 15a3. TEK KUPON DETAYI
app.get('/api/coupon/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const coupons = await query('SELECT c.*, u.username FROM coupons c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [id]);
        if (coupons.length === 0) {
            return res.json({ success: false, message: 'Kupon bulunamadı!' });
        }

        const coupon = coupons[0];
        const selections = await query('SELECT * FROM coupon_selections WHERE coupon_id = ?', [id]);
        coupon.selections = selections;

        res.json({ success: true, coupon });

    } catch (error) {
        console.error('❌ Kupon detay hatası:', error);
        res.json({ success: false, message: 'Kupon detayı yüklenemedi!' });
    }
});

// 15a4. KULLANICI GEÇMİŞİ (LOG)
app.get('/api/user-history/:username', async (req, res) => {
    try {
        const { username } = req.params;

        const users = await query('SELECT id FROM users WHERE username = ?', [username]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı!' });
        }

        const userId = users[0].id;

        // Logları çek (son 50 işlem)
        const history = await query(
            'SELECT * FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [userId]
        );

        res.json({ success: true, history });

    } catch (error) {
        console.error('❌ Geçmiş getirme hatası:', error);
        res.json({ success: false, message: 'Geçmiş yüklenemedi!' });
    }
});

// 15b. MAÇLARI LİSTELE (Veritabanından - eski endpoint)
app.get('/api/matches', async (req, res) => {
    try {
        const { sport } = req.query;
        let sql = 'SELECT * FROM matches WHERE status != "finished"';
        let params = [];

        if (sport) {
            sql += ' AND sport_type = ?';
            params.push(sport);
        }

        sql += ' ORDER BY match_date ASC, match_time ASC';

        const matches = await query(sql, params);
        res.json({ success: true, matches: matches });
    } catch (error) {
        console.error(error);
        res.json({ success: false, matches: [] });
    }
});

// 15c. OYUN BAŞLAT (Veritral API Integration)
app.get('/api/launch-game', authenticateToken, async (req, res) => {
    try {
        const { gameId } = req.query;
        const userId = req.user.id;

        if (!gameId) {
            return res.json({ success: false, message: 'Oyun ID eksik!' });
        }

        // Kullanıcı ve Veritral ayarlarını çek
        const providerStateRows = await query(`
            SELECT is_active, current_rtp_percent
            FROM provider_games
            WHERE game_key = ?
            LIMIT 1
        `, [gameId]);
        const providerState = providerStateRows[0];
        if (providerState && providerState.is_active === false) {
            return res.json({
                success: false,
                message: `Bu oyun RTP alarmı nedeniyle geçici olarak kapatıldı. Son RTP: ${toNumber(providerState.current_rtp_percent).toFixed(2)}%`
            });
        }

        const user = (await query('SELECT username, balance FROM users WHERE id = ?', [userId]))[0];
        const settings = await query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('veritral_api_key', 'veritral_api_secret', 'veritral_launch_url')");
        
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);

        if (!settingsObj.veritral_api_key || !settingsObj.veritral_api_secret) {
            // Eğer Veritral ayarı yoksa eski demo sistemini fallback olarak kullan (veya hata döndür)
            // Kullanıcı gerçek entegrasyon istediği için hata döndürmek daha mantıklı
            return res.json({ 
                success: false, 
                message: 'Veritral API ayarları eksik! Lütfen admin panelinden yapılandırınız.' 
            });
        }

        const launchUrl = settingsObj.veritral_launch_url || 'https://api.veritral.com/v1/game/launch';

        // Veritral API'ye istek at
        const response = await fetch(launchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': settingsObj.veritral_api_key,
                'X-API-SECRET': settingsObj.veritral_api_secret
            },
            body: JSON.stringify({
                user_id: userId.toString(),
                username: user.username,
                balance: parseFloat(user.balance),
                game_id: gameId,
                currency: 'TRY',
                lang: 'tr',
                return_url: `${req.protocol}://${req.get('host')}/`
            })
        });

        const data = await response.json();

        if (data.success && data.launch_url) {
            res.json({
                success: true,
                launchUrl: data.launch_url
            });
        } else {
            console.error('❌ Veritral API Hatası:', data);
            res.json({ 
                success: false, 
                message: 'Oyun başlatılamadı: ' + (data.message || 'API Hatası')
            });
        }
    } catch (error) {
        console.error('❌ Launch Game Hatası:', error);
        res.json({ success: false, message: 'Sistem hatası: ' + error.message });
    }
});

// ================== LİDERLİK TABLOSU ==================

// 16. LİDERLİK TABLOSU
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaders = await query(`
            SELECT username, total_win, level
            FROM users
            WHERE role = 'user' AND status = 'active'
            ORDER BY total_win DESC
            LIMIT 10
        `);
        res.json({ success: true, leaders: leaders });
    } catch (error) {
        console.error(error);
        res.json({ success: false, leaders: [] });
    }
});

// ================== DUYURU ==================

// 17. DUYURU ÇEKME
app.get('/api/announcement', async (req, res) => {
    try {
        const announcement = await query('SELECT setting_value, updated_at FROM settings WHERE setting_key = "announcement"');
        const timeResult = await query('SELECT setting_value FROM settings WHERE setting_key = "announcement_time"');

        if (announcement.length === 0) {
            return res.json({ message: "Hoşgeldiniz!", timestamp: 0 });
        }

        const timestamp = timeResult.length > 0 ? parseInt(timeResult[0].setting_value) : 0;
        res.json({ message: announcement[0].setting_value, timestamp: timestamp });
    } catch (error) {
        res.json({ message: "Hoşgeldiniz!", timestamp: 0 });
    }
});

// ================== ADMIN API'LERİ ==================

// 18. TÜM KULLANICILARI LİSTELE
app.get('/api/users', authenticateToken, ensureStaffPermission(PERMISSIONS.CRM_READ), async (req, res) => {
    try {
        const users = await query(`
            SELECT id, username, email, phone, balance, bonus_balance, status, role, level,
                   total_deposit, total_withdraw, ggr, risk_score, loyalty_level,
                   total_bet, total_win, created_at, last_login
            FROM users
            WHERE role = 'user'
            ORDER BY id DESC
        `);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 19. KULLANICI DETAYI
app.get('/api/users/:id', authenticateToken, ensureStaffPermission(PERMISSIONS.CRM_READ), async (req, res) => {
    try {
        const users = await query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (users.length === 0) {
            return res.json({ success: false, message: 'Kullanıcı bulunamadı' });
        }

        const user = users[0];
        const transactions = await query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [user.id]);
        const bets = await query('SELECT * FROM bets WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [user.id]);

        res.json({
            success: true,
            user: user,
            transactions: transactions,
            bets: bets
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 20. KULLANICI GÜNCELLE
app.put('/api/users/:id', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const { balance, status, role } = req.body;
        const userId = req.params.id;

        let updates = [];
        let params = [];

        if (balance !== undefined) {
            updates.push('balance = ?');
            params.push(balance);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }

        if (updates.length === 0) {
            return res.json({ success: false, message: 'Güncellenecek alan yok' });
        }

        params.push(userId);
        await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        await saveLog(null, req.user.id, 'USER_UPDATE', `Kullanıcı güncellendi: ID ${userId}`, req.ip);

        res.json({ success: true, message: 'Kullanıcı güncellendi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 21. KULLANICI BANLA
app.post('/api/users/:id/ban', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await query('UPDATE users SET status = "banned" WHERE id = ?', [userId]);

        await saveLog(null, req.user.id, 'USER_BAN', `Kullanıcı banlandı: ID ${userId}`, req.ip);

        res.json({ success: true, message: 'Kullanıcı banlandı' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 22. KULLANICI BAN KALDIR
app.post('/api/users/:id/unban', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        await query('UPDATE users SET status = "active" WHERE id = ?', [userId]);

        await saveLog(null, req.user.id, 'USER_UNBAN', `Kullanıcı ban kaldırıldı: ID ${userId}`, req.ip);

        res.json({ success: true, message: 'Ban kaldırıldı' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ================== HESAP DOĞRULAMA YÖNETİMİ (ADMIN) ==================

// 22a. BEKLEYEN DOĞRULAMA TALEPLERİ
app.get('/api/verification-requests', authenticateToken, async (req, res) => {
    try {
        const requests = await query(`
            SELECT id, username, email, phone, verification_status, verification_document,
                   verification_note, created_at
            FROM users
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC
        `);
        res.json(requests);
    } catch (error) {
        console.error('❌ Doğrulama talepleri hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// 22b. TÜM KULLANICILARIN DOĞRULAMA DURUMLARI
app.get('/api/verification-all', authenticateToken, async (req, res) => {
    try {
        const status = req.query.status || '';
        let sql = `
            SELECT id, username, email, phone, verification_status, verification_document,
                   verification_note, verification_date, created_at
            FROM users
            WHERE role = 'user'
        `;

        if (status) {
            sql += ` AND verification_status = '${status}'`;
        }

        sql += ' ORDER BY created_at DESC';

        const users = await query(sql);
        res.json(users);
    } catch (error) {
        console.error('❌ Doğrulama listesi hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// 22c. DOĞRULAMA ONAYLA
app.post('/api/verify-user/:id/approve', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;

        await query(`
            UPDATE users
            SET verification_status = 'verified',
                verification_date = NOW(),
                verification_note = 'Hesabınız başarıyla doğrulandı.'
            WHERE id = ?
        `, [userId]);

        await saveLog(userId, req.user.id, 'VERIFICATION_APPROVE', `Hesap doğrulaması onaylandı: ID ${userId}`, req.ip);

        console.log(`✅ Hesap doğrulandı: User ID ${userId}`);
        res.json({ success: true, message: 'Hesap doğrulaması onaylandı!' });
    } catch (error) {
        console.error('❌ Doğrulama onay hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// 22d. DOĞRULAMA REDDET
app.post('/api/verify-user/:id/reject', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const { reason } = req.body;

        await query(`
            UPDATE users
            SET verification_status = 'rejected',
                verification_date = NOW(),
                verification_note = ?
            WHERE id = ?
        `, [reason || 'Belgeniz uygun bulunmadı. Lütfen tekrar deneyin.', userId]);

        await saveLog(userId, req.user.id, 'VERIFICATION_REJECT', `Hesap doğrulaması reddedildi: ID ${userId} - ${reason}`, req.ip);

        console.log(`❌ Hesap doğrulaması reddedildi: User ID ${userId}`);
        res.json({ success: true, message: 'Hesap doğrulaması reddedildi!' });
    } catch (error) {
        console.error('❌ Doğrulama red hatası:', error);
        res.status(500).json({ error: error.message });
    }
});

// 23. TÜM İŞLEMLERİ LİSTELE
app.get('/api/transactions', authenticateToken, ensureStaffSession, async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        if (!hasPermission(actor, PERMISSIONS.TRANSACTIONS_READ)) {
            return res.json([]);
        }

        const { status, type } = req.query;
        let sql = `
            SELECT t.*, u.username
            FROM transactions t
            JOIN users u ON t.user_id = u.id
        `;
        let conditions = [];
        let params = [];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (type) {
            conditions.push('t.type = ?');
            params.push(type);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY t.created_at DESC';

        const transactions = await query(sql, params);
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 24. İŞLEM ONAYLA
app.post('/api/transactions/:id/approve', authenticateToken, ensureStaffPermission(PERMISSIONS.TRANSACTIONS_MANAGE), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const result = await processFinanceDecision({
            transactionId: Number(req.params.id),
            action: 'approve',
            note: String(req.body.note || '').trim(),
            actor,
            ip: req.ip
        });

        res.json({ success: true, message: result.message, autoProcessed: result.autoProcessed, finalStatus: result.finalStatus });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

app.post('/api/transactions/:id/reject', authenticateToken, ensureStaffPermission(PERMISSIONS.TRANSACTIONS_MANAGE), async (req, res) => {
    try {
        const actor = getActiveStaffActor(req);
        const result = await processFinanceDecision({
            transactionId: Number(req.params.id),
            action: 'reject',
            note: String(req.body.reason || req.body.note || '').trim(),
            actor,
            ip: req.ip
        });

        res.json({ success: true, message: result.message, finalStatus: result.finalStatus });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

app.get('/api/bets', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT b.*, u.username
            FROM bets b
            JOIN users u ON b.user_id = u.id
        `;

        if (status) {
            sql += ' WHERE b.status = ?';
        }

        sql += ' ORDER BY b.created_at DESC';

        const bets = await query(sql, status ? [status] : []);
        res.json(bets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 27. BAHİS SONUÇLANDIR
app.post('/api/bets/:id/settle', authenticateToken, async (req, res) => {
    try {
        const betId = req.params.id;
        const { result } = req.body; // 'won' veya 'lost'

        if (!['won', 'lost'].includes(result)) {
            return res.json({ success: false, message: 'Geçersiz sonuç' });
        }

        const bets = await query('SELECT * FROM bets WHERE id = ?', [betId]);
        if (bets.length === 0) {
            return res.json({ success: false, message: 'Bahis bulunamadı' });
        }

        const bet = bets[0];

        if (bet.status !== 'pending') {
            return res.json({ success: false, message: 'Bu bahis zaten sonuçlanmış' });
        }

        // Bahisi güncelle
        await query('UPDATE bets SET status = ?, settled_at = NOW() WHERE id = ?', [result, betId]);

        // Kazandıysa ödeme yap
        if (result === 'won') {
            await query('UPDATE users SET balance = balance + ?, total_win = total_win + ? WHERE id = ?',
                [bet.potential_win, bet.potential_win, bet.user_id]);
        }

        await saveLog(bet.user_id, req.user.id, 'BET_SETTLE',
            `Bahis sonuçlandırıldı: ${result === 'won' ? 'KAZANDI' : 'KAYBETTİ'} - ${bet.potential_win} TL`, req.ip);

        res.json({ success: true, message: 'Bahis sonuçlandırıldı' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 28. LOGLAR
app.get('/api/logs', authenticateToken, async (req, res) => {
    try {
        const logs = await query(`
            SELECT l.*,
                   u.username as user_name,
                   a.username as admin_name
            FROM logs l
            LEFT JOIN users u ON l.user_id = u.id
            LEFT JOIN users a ON l.admin_id = a.id
            ORDER BY l.created_at DESC
            LIMIT 500
        `);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 29. AYARLAR
app.get('/api/settings', authenticateToken, ensureStaffSession, async (req, res) => {
    try {
        const settings = await query('SELECT * FROM settings');
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.setting_key] = s.setting_value;
        });
        res.json(settingsObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 30. AYAR GÜNCELLE
app.post('/api/settings', authenticateToken, ensurePrimaryAdmin, async (req, res) => {
    try {
        const settings = req.body;

        for (const [key, value] of Object.entries(settings)) {
            await query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
                [key, value]
            );
        }

        await saveLog(null, req.user.id, 'SETTINGS_UPDATE', `Ayarlar güncellendi`, req.ip);

        res.json({ success: true, message: 'Ayarlar güncellendi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 31. DUYURU GÜNCELLE
app.post('/admin/api/duyuru-guncelle', authenticateToken, async (req, res) => {
    try {
        const { announcement } = req.body;
        const now = Date.now();

        await query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
            ['announcement', announcement]
        );

        // Duyuru zamanını kaydet
        await query(
            'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value',
            ['announcement_time', now.toString()]
        );

        await saveLog(null, req.user.id, 'ANNOUNCEMENT_UPDATE', `Duyuru güncellendi: ${announcement}`, req.ip);

        res.json({ success: true, message: 'Duyuru güncellendi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 32. DASHBOARD İSTATİSTİKLERİ
app.get('/api/dashboard-stats', authenticateToken, ensureStaffSession, async (req, res) => {
    try {
        const canSeeFinancials = !req.user?.isStaff || hasPermission(req.user, PERMISSIONS.DASHBOARD_FINANCIAL);
        const totalUsers = await query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
        const totalBalance = await query('SELECT SUM(balance) as total FROM users');
        const pendingDeposits = await query("SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = 'deposit' AND status = 'pending'");
        const pendingWithdraws = await query("SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE type = 'withdraw' AND status = 'pending'");
        const pendingBets = await query("SELECT COUNT(*) as count FROM bets WHERE status = 'pending'");
        const todayDeposits = await query("SELECT SUM(amount) as total FROM transactions WHERE type = 'deposit' AND status IN ('approved', 'completed') AND created_at::DATE = CURRENT_DATE");
        const todayWithdraws = await query("SELECT SUM(amount) as total FROM transactions WHERE type = 'withdraw' AND status IN ('approved', 'completed') AND created_at::DATE = CURRENT_DATE");
        const activePlayers = await query("SELECT COUNT(*) as count FROM users WHERE role = 'user' AND status = 'active' AND last_login >= NOW() - INTERVAL '24 hours'");

        const pendingDepositCount = Number(pendingDeposits[0].count || 0);
        const pendingWithdrawCount = Number(pendingWithdraws[0].count || 0);
        const todayDepositTotal = Number(todayDeposits[0].total || 0);
        const todayWithdrawTotal = Number(todayWithdraws[0].total || 0);

        res.json({
            totalUsers: totalUsers[0].count,
            totalBalance: canSeeFinancials ? (totalBalance[0].total || 0) : 0,
            activePlayers: activePlayers[0].count || 0,
            pendingDeposits: {
                count: canSeeFinancials ? pendingDepositCount : 0,
                total: canSeeFinancials ? (pendingDeposits[0].total || 0) : 0
            },
            pendingWithdraws: {
                count: canSeeFinancials ? pendingWithdrawCount : 0,
                total: canSeeFinancials ? (pendingWithdraws[0].total || 0) : 0
            },
            pendingBets: pendingBets[0].count,
            todayDeposits: canSeeFinancials ? todayDepositTotal : 0,
            todayWithdraws: canSeeFinancials ? todayWithdrawTotal : 0,
            todayTransactionCount: canSeeFinancials ? (pendingDepositCount + pendingWithdrawCount) : 0
        });
    } catch (error) {
        console.error('❌ Dashboard Stats Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 33. MAÇ EKLE/GÜNCELLE
app.post('/api/matches', authenticateToken, async (req, res) => {
    try {
        const { team1, team2, logo1, logo2, match_time, match_date, sport_type, odds_1, odds_x, odds_2 } = req.body;

        await query(
            'INSERT INTO matches (team1, team2, logo1, logo2, match_time, match_date, sport_type, odds_1, odds_x, odds_2) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [team1, team2, logo1 || '', logo2 || '', match_time, match_date, sport_type || 'futbol', odds_1 || 1.5, odds_x || 3.0, odds_2 || 2.5]
        );

        res.json({ success: true, message: 'Maç eklendi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 34. MAÇ SİL
app.delete('/api/matches/:id', authenticateToken, async (req, res) => {
    try {
        await query('DELETE FROM matches WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Maç silindi' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 35. PROMOSYON KODU EKLE
app.post('/api/promo-codes', authenticateToken, async (req, res) => {
    try {
        const { code, type, value, max_uses, expires_at } = req.body;

        await query(
            'INSERT INTO promo_codes (code, type, value, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)',
            [code.toUpperCase(), type, value, max_uses || 1, expires_at || null]
        );

        res.json({ success: true, message: 'Promosyon kodu eklendi' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.json({ success: false, message: 'Bu kod zaten mevcut' });
        }
        res.status(500).json({ error: error.message });
    }
});

// 36. PROMOSYON KODLARINI LİSTELE
app.get('/api/promo-codes', authenticateToken, async (req, res) => {
    try {
        const codes = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
        res.json(codes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Groq AI Canlı Destek API ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const formatSupportCurrency = (amount) => `${Number(amount || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
})} TL`;

const getTransactionStatusLabel = (status) => {
    switch ((status || '').toLowerCase()) {
        case 'approved':
            return 'Onaylandı';
        case 'pending':
            return 'Beklemede';
        case 'rejected':
            return 'Reddedildi';
        default:
            return 'Bilinmiyor';
    }
};

const normalizeSupportBonusType = (bonusType = '') => {
    const normalized = bonusType.toString().trim().toLowerCase();
    if (normalized.includes('kayip')) return { key: 'loss', label: 'Kayıp Bonusu' };
    if (normalized.includes('freebet') || normalized.includes('free bet')) return { key: 'freebet', label: 'Freebet' };
    if (normalized.includes('hosgeldin') || normalized.includes('hoşgeldin') || normalized.includes('welcome')) return { key: 'welcome', label: 'Hoşgeldin' };
    if (normalized.includes('yatirim') || normalized.includes('yatırım')) return { key: 'deposit', label: 'Yatırım Bonusu' };
    return { key: 'generic', label: bonusType || 'Bonus' };
};

async function findSupportUser({ userId, username }) {
    if (userId) {
        const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length > 0) return users[0];
    }

    if (username) {
        const users = await query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length > 0) return users[0];
    }

    return null;
}

async function getTodayLossAmount(userId) {
    const couponRows = await query(`
        SELECT
            COALESCE(SUM(amount), 0) AS total_bet,
            COALESCE(SUM(actual_win), 0) AS total_win
        FROM coupons
        WHERE user_id = ? AND created_at::DATE = CURRENT_DATE
    `, [userId]);

    const betRows = await query(`
        SELECT
            COALESCE(SUM(amount), 0) AS total_bet,
            COALESCE(SUM(CASE WHEN status = 'won' THEN potential_win ELSE 0 END), 0) AS total_win
        FROM bets
        WHERE user_id = ? AND created_at::DATE = CURRENT_DATE
    `, [userId]);

    const couponBet = Number(couponRows?.[0]?.total_bet || 0);
    const couponWin = Number(couponRows?.[0]?.total_win || 0);
    const betStake = Number(betRows?.[0]?.total_bet || 0);
    const betWin = Number(betRows?.[0]?.total_win || 0);

    return Math.max((couponBet + betStake) - (couponWin + betWin), 0);
}

async function getFinancialHistorySummary(userId) {
    const lastDepositRows = await query(`
        SELECT amount, status, created_at
        FROM transactions
        WHERE user_id = ? AND type = 'deposit'
        ORDER BY created_at DESC
        LIMIT 1
    `, [userId]);

    const lastWithdrawRows = await query(`
        SELECT amount, status, created_at
        FROM transactions
        WHERE user_id = ? AND type = 'withdraw'
        ORDER BY created_at DESC
        LIMIT 1
    `, [userId]);

    const lastDeposit = lastDepositRows[0] || null;
    const lastWithdrawal = lastWithdrawRows[0] || null;
    const todayLoss = await getTodayLossAmount(userId);

    return {
        last_deposit: lastDeposit
            ? `${formatSupportCurrency(lastDeposit.amount)} (${getTransactionStatusLabel(lastDeposit.status)})`
            : 'Kayıt bulunamadı',
        last_withdrawal: lastWithdrawal
            ? `${formatSupportCurrency(lastWithdrawal.amount)} (${getTransactionStatusLabel(lastWithdrawal.status)})`
            : 'Kayıt bulunamadı',
        total_loss_today: formatSupportCurrency(todayLoss),
        total_loss_today_value: Number(todayLoss.toFixed(2))
    };
}

async function getWelcomeBonusAmount() {
    const settingsRows = await query("SELECT setting_value FROM settings WHERE setting_key = 'welcome_bonus'");
    const value = Number(settingsRows?.[0]?.setting_value || 0);
    return value > 0 ? value : 100;
}

async function hasUserReceivedSupportBonusToday(userId, bonusLabel) {
    const rows = await query(`
        SELECT id
        FROM logs
        WHERE user_id = ?
          AND action = 'SUPPORT_BONUS'
          AND details LIKE ?
          AND created_at::DATE = CURRENT_DATE
        LIMIT 1
    `, [userId, `%${bonusLabel}%`]);

    return rows.length > 0;
}

app.post('/api/chat/support', async (req, res) => {
    try {
        const { message, username, userId, balance, history = [] } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: 'Mesaj gerekli' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(503).json({ success: false, error: 'Gemini API anahtari ayarlanmamis' });
        }

        const currentUser = await findSupportUser({ userId, username });
        const contextUserId = currentUser?.id ? String(currentUser.id) : (userId ? String(userId) : null);

        const supportFunctions = {
            getUserBalance: async ({ userId: requestedUserId }) => {
                const targetUser = await findSupportUser({
                    userId: requestedUserId || contextUserId,
                    username
                });

                if (!targetUser) {
                    return { status: 'Hata', message: 'Kullanıcı bulunamadı. Lütfen giriş yapın.' };
                }

                return {
                    balance: formatSupportCurrency(targetUser.balance),
                    balance_value: Number(targetUser.balance || 0),
                    status: targetUser.status === 'active' ? 'Aktif' : targetUser.status,
                    verification_status: getVerificationStatusText(targetUser.verification_status)
                };
            },

            getFinancialHistory: async ({ userId: requestedUserId }) => {
                const targetUser = await findSupportUser({
                    userId: requestedUserId || contextUserId,
                    username
                });

                if (!targetUser) {
                    return { status: 'Hata', message: 'Kullanıcı bulunamadı. Lütfen giriş yapın.' };
                }

                return await getFinancialHistorySummary(targetUser.id);
            },

            activateBonus: async ({ userId: requestedUserId, bonusType }) => {
                const targetUser = await findSupportUser({
                    userId: requestedUserId || contextUserId,
                    username
                });

                if (!targetUser) {
                    return { status: 'Hata', message: 'Bonus tanimlamak için once giris yapmaniz gerekiyor.' };
                }

                const normalizedBonus = normalizeSupportBonusType(bonusType);
                if (await hasUserReceivedSupportBonusToday(targetUser.id, normalizedBonus.label)) {
                    return {
                        status: 'Hata',
                        message: `${normalizedBonus.label} bugun zaten hesabiniza tanimlanmis gorunuyor.`
                    };
                }

                let amount = 0;

                if (normalizedBonus.key === 'loss') {
                    const todayLoss = await getTodayLossAmount(targetUser.id);
                    if (todayLoss <= 0) {
                        return {
                            status: 'Hata',
                            message: 'Bugun icin kayip gorunmedigi icin kayip bonusu tanimlanamiyor.'
                        };
                    }
                    amount = Math.min(Math.max(Number((todayLoss * 0.10).toFixed(2)), 25), 500);
                } else if (normalizedBonus.key === 'welcome') {
                    if (Number(targetUser.total_deposit || 0) > 0) {
                        return {
                            status: 'Hata',
                            message: 'Hosgeldin bonusu yalnizca ilk yatirim oncesi tanimlanabilir.'
                        };
                    }
                    amount = await getWelcomeBonusAmount();
                } else if (normalizedBonus.key === 'deposit') {
                    const lastDepositRows = await query(`
                        SELECT amount
                        FROM transactions
                        WHERE user_id = ? AND type = 'deposit' AND status IN ('approved', 'completed')
                        ORDER BY created_at DESC
                        LIMIT 1
                    `, [targetUser.id]);

                    const lastDepositAmount = Number(lastDepositRows?.[0]?.amount || 0);
                    if (lastDepositAmount <= 0) {
                        return {
                            status: 'Hata',
                            message: 'Yatırım bonusu için önce onaylanmış bir yatırım görünmeli.'
                        };
                    }
                    amount = Math.min(Math.max(Number((lastDepositAmount * 0.15).toFixed(2)), 50), 750);
                } else {
                    amount = 100;
                }

                await query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, targetUser.id]);
                await saveLog(targetUser.id, null, 'SUPPORT_BONUS', `${normalizedBonus.label} aktif edildi (${amount.toFixed(2)} TL)`, req.ip);

                const updatedUserRows = await query('SELECT balance FROM users WHERE id = ?', [targetUser.id]);
                const updatedBalance = Number(updatedUserRows?.[0]?.balance || 0);

                return {
                    status: 'Başarılı',
                    message: `${normalizedBonus.label} hesabınıza tanımlandı. Bol şans!`,
                    bonus_type: normalizedBonus.label,
                    amount: formatSupportCurrency(amount),
                    amount_value: Number(amount.toFixed(2)),
                    newBalance: updatedBalance
                };
            }
        };

        const tools = [
            {
                functionDeclarations: [
                    {
                        name: 'getUserBalance',
                        description: 'Kullanıcının hesabındaki güncel bakiyeyi ve hesap durumunu sorgular.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                userId: { type: 'STRING' }
                            },
                            required: ['userId']
                        }
                    },
                    {
                        name: 'getFinancialHistory',
                        description: 'Kullanıcının son finansal işlemlerini ve günlük kayıp durumunu sorgular.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                userId: { type: 'STRING' }
                            },
                            required: ['userId']
                        }
                    },
                    {
                        name: 'activateBonus',
                        description: 'Kullanıcının hesabına kayıp bonusu, yatırım bonusu, hoşgeldin bonusu veya freebet tanımlar.',
                        parameters: {
                            type: 'OBJECT',
                            properties: {
                                userId: { type: 'STRING' },
                                bonusType: {
                                    type: 'STRING',
                                    description: "Bonusun turu: 'Kayıp Bonusu', 'Freebet', 'Hoşgeldin' veya 'Yatırım Bonusu'"
                                }
                            },
                            required: ['userId', 'bonusType']
                        }
                    }
                ]
            }
        ];

        const sanitizedHistorySource = Array.isArray(history)
            ? history
                .filter((item) => item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string')
                .slice(-12)
            : [];

        while (sanitizedHistorySource.length && sanitizedHistorySource[0].role === 'model') {
            sanitizedHistorySource.shift();
        }

        const sanitizedHistory = sanitizedHistorySource.map((item) => ({
            role: item.role,
            parts: [{ text: item.text.slice(0, 4000) }]
        }));

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            tools,
            systemInstruction: `
KİMLİK: Senin adın 'Selin'. CLASH BET'in sevilen canlı destek uzmanısın.
TARZ: Kusursuz Türkçe konuş. Türkçe karakterleri her zaman doğru kullan: ç, ğ, ı, İ, ö, ş, ü.
ÜSLUP: Samimi ama profesyonel ol. Gerektiğinde "dostum", "kardeşim", "abi" gibi sıcak hitaplar kullanabilirsin ama dozu kaçırma.
DOĞALLIK: Yeri geldiğinde kısa Türkçe şakalar, gündelik deyimler, hafif site jargonu ve uygun atasözleri kullanabilirsin. Bunları zorlama; doğal, kısa ve yerinde kullan.
MİZAH SINIRI: Espriler sıcak ve rahatlatıcı olsun; laubali, kaba veya yapay durmasın.
YAKLAŞIM: Kullanıcının sorununu sahiplen, meseleyi tek tek çöz ve konuşmayı sanki aynı temsilci takip ediyormuş gibi sürdür.
YETKİ: Bakiye görebilir, finansal geçmişe bakabilir ve kullanıcıya bonus tanımlayabilirsin.

KULLANICI BAĞLAMI:
- Giriş durumu: ${currentUser ? 'Giriş yapmış kullanıcı' : 'Misafir kullanıcı'}
${currentUser ? `- Kullanıcı ID: ${currentUser.id}` : '- Kullanıcı ID: yok'}
${username ? `- Kullanıcı adı: ${username}` : '- Kullanıcı adı: bilinmiyor'}
${balance ? `- Frontend bakiyesi: ${balance} TL` : ''}

SİTENİN TEMEL KURALLARI:
- Para yatırma: Kripto, Havale, Papara. Minimum 100 TL.
- Para çekme: Minimum 200 TL. İlk çekimde KYC gerekebilir.
- Bonuslar: Hoşgeldin, kayıp bonusu, yatırım bonusu, VIP bonusları.
- VIP: 5 seviye. Özel bonuslar ve yüksek limitler sunulur.
- Şans çarkı haftalık çalışır, markette sandıklar vardır.

ÖNEMLİ KURALLAR:
1. Kullanıcı hesap özelinde bilgi sorarsa önce ilgili fonksiyonu kullan.
2. Kullanıcı "bonusum nerede", "zarardayım destek at", "bonus tanımla" gibi bir şey derse uygun bonus türüyle activateBonus kullan.
3. Kullanıcı giriş yapmadıysa hesap özeline girme, nazikçe giriş yapmasını iste.
4. Eğer geçmişte mesaj varsa yeniden "merhaba", "hoş geldin", "nasıl yardımcı olabilirim" diye başa sarma; doğrudan mevcut konudan devam et.
5. Kullanıcı bir sorun yazdıysa önce sorunu kendi cümlenle sahiplen, sonra tek bir net adım öner veya doğrudan çözüm ver.
6. Uzun, şablon listeler dökme; konu özelse konuya özel yanıt ver.
7. Kısa, net ve akıcı cevap ver. Gereksiz uzatma yapma.
8. Bonus aktif olursa sevinçli ama kontrollü bir dille cevap ver.
9. Teknik hata olursa sakinleştirici ve çözüm odaklı kal.
10. Cümleler doğal, pürüzsüz ve ana dili Türkçe olan biri gibi aksın.
11. Bozuk karakter, yarım ifade, yapay çeviri dili veya tuhaf sözdizimi kullanma.
12. Kullanıcı "gerçek misin" diye sorarsa dürüst ol ama sohbetteki desteğin ciddiyetini koru; konuyu çözmeye devam et.
`
        });

        const chat = model.startChat({
            history: sanitizedHistory,
            generationConfig: { temperature: 0.72, topP: 0.9 }
        });

        let result = await chat.sendMessage(message);
        let response = result.response;
        let userUpdate = null;

        for (let step = 0; step < 3; step++) {
            const functionCalls = typeof response.functionCalls === 'function' ? (response.functionCalls() || []) : [];
            if (functionCalls.length === 0) break;

            const functionResponses = [];
            for (const call of functionCalls) {
                const handler = supportFunctions[call.name];
                const apiResult = handler
                    ? await handler(call.args || {})
                    : { status: 'Hata', message: 'İstenen fonksiyon bulunamadı.' };

                if (apiResult?.newBalance != null) {
                    userUpdate = { balance: Number(apiResult.newBalance) };
                } else if (apiResult?.balance_value != null) {
                    userUpdate = { balance: Number(apiResult.balance_value) };
                }

                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: apiResult
                    }
                });
            }

            result = await chat.sendMessage(functionResponses);
            response = result.response;
        }

        let reply = typeof response.text === 'function'
            ? response.text()
            : 'Dostum su an baglanti tarafinda ufak bir gecikme var ama buradayim.';

        if (sanitizedHistory.length > 0) {
            reply = reply
                .replace(/^(?:merhaba(?:lar)?|selam(?:lar)?|hoş geldin(?:iz)?)[^.!?\n]*[.!?\n]+\s*/iu, '')
                .replace(/^nasıl yardımcı olabilirim\??\s*/iu, '');
        }

        reply = reply.trim() || 'Mesajın bende, aynı yerden devam edelim.';

        res.json({
            success: true,
            reply,
            meta: {
                provider: 'gemini',
                userUpdate
            }
        });
    } catch (error) {
        console.error('Gemini Chat Error:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

app.post('/api/chat/groq', async (req, res) => {
    try {
        const { message, username, balance } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, error: 'Mesaj gerekli' });
        }

        const systemPrompt = `Sen CLASH BET casino sitesinin Türkçe konuşan, yardımsever ve profesyonel canlı destek temsilcisisin. Adın Selin.

Site Özellikleri:
- Para Yatırma: Kripto (BTC, ETH, USDT, BNB, TON), Banka Havalesi, Papara. Minimum 100 TL.
- Para Çekme: Minimum 200 TL, 1-24 saat işlem süresi. İlk çekimde KYC gerekebilir.
- Bonuslar: %100 Hoşgeldin, %10 Kayıp Bonusu, Haftalık Yatırım Bonusu, VIP Özel Bonuslar
- VIP: 5 seviye (Başlangıç, Gelişmiş, Profesyonel, Premium, Efsane). Özel bonuslar, yüksek limitler, kişisel temsilci.
- Market: Sandıklar satın alınabilir (Bronz, Gümüş, Altın, Efsanevi). Bonus, free spin, TL ödüller içerir.
- Şans Çarkı: Haftalık 1 çevirme hakkı. Bonus TL, Free Spin, Market kredisi kazanılabilir.
- Oyunlar: Slot, Canlı Casino, Spor Bahisleri, Masa Oyunları.
- Günlük Ödül: Her gün giriş yapanlar için sandık ödülü.

Kurallar:
- Kısa, öz ve samimi yanıtlar ver
- Emoji kullan ama abartma
- Adım adım talimatlar ver
- Kullanıcının sorusuna direkt cevap ver
- Türkçe konuş
${username ? `- Kullanıcı adı: ${username}` : '- Kullanıcı giriş yapmamış'}
${balance ? `- Bakiye: ${balance} TL` : ''}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Groq API Error:', data.error);
            return res.status(500).json({ success: false, error: data.error.message });
        }

        const reply = data.choices?.[0]?.message?.content || 'Üzgünüm, şu anda yanıt veremiyorum.';
        res.json({ success: true, reply });

    } catch (error) {
        console.error('Groq Chat Error:', error);
        res.status(500).json({ success: false, error: 'Sunucu hatası' });
    }
});

// ================== VERİTRAL CASİNO API ==================

// Veritral API yapılandırması
const VERITRAL_API_KEY = process.env.VERITRAL_API_KEY || '';
const VERITRAL_API_SECRET = process.env.VERITRAL_API_SECRET || '';
const VERITRAL_LAUNCH_URL = process.env.VERITRAL_LAUNCH_URL || 'https://api.veritral.com/api/v2/launch';

// Oyun önbelleği (5 dakika)
let gameCache = { data: null, timestamp: 0 };
const GAME_CACHE_DURATION = 5 * 60 * 1000;

// Veritral API'den oyun listesi çek
async function fetchVeritralGames() {
    const now = Date.now();
    if (gameCache.data && (now - gameCache.timestamp) < GAME_CACHE_DURATION) {
        return gameCache.data;
    }

    try {
        const response = await fetch('https://api.veritral.com/api/v2/gamelist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: VERITRAL_API_KEY,
                api_key: VERITRAL_API_KEY,
                api_secret: VERITRAL_API_SECRET
            })
        });

        const result = await response.json();

        if (result.response && result.response.status === 'OK' && result.response.data) {
            gameCache = { data: result.response.data, timestamp: now };
            console.log(`✅ Veritral: ${Object.keys(result.response.data).length || 0} oyun yüklendi`);
            return result.response.data;
        } else {
            console.warn('⚠️ Veritral API yanıtı başarısız:', result.response?.data?.error_message || 'Bilinmeyen hata');
            return null;
        }
    } catch (error) {
        console.error('❌ Veritral API hatası:', error.message);
        return null;
    }
}

// Yedek oyun kataloğu (API erişimi olmadığında kullanılır)
const fallbackGames = [
    { id: "vs20fruitsw", name: "Sweet Bonanza", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/00/92/d5/0092d5152a2a2e393ae82a102c2b969c.jpg", popular: true },
    { id: "vs20olympgate", name: "Gates of Olympus", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/ca/c7/4e/cac74ec16122373734b4feaecf447c55.jpg", popular: true },
    { id: "vs20sugarrush", name: "Sugar Rush", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/e1/d7/0c/e1d70c0e96ea7a01f1dba547ff2bec10.jpg", popular: true },
    { id: "vs20doghouse", name: "The Dog House", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/03/21/5c/03215c8e22b3d99d45aef2c6844fc424.jpg", popular: true },
    { id: "vs25wolfgold", name: "Wolf Gold", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/74/d3/7d/74d37d928c831e884fd3d6a61d699e6c.jpg" },
    { id: "vs20fruitswx", name: "Sweet Bonanza 1000", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/ad/80/8b/ad808ba076e0137b26b45ef8cc732d38.jpg", popular: true },
    { id: "vs20olympx", name: "Gates of Olympus 1000", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/4d/d1/a5/4dd1a5b91ee90740cceccd6c39c89164.jpg", popular: true },
    { id: "vs20sugarrushx", name: "Sugar Rush 1000", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/e1/d7/0c/e1d70c0e96ea7a01f1dba547ff2bec10.jpg" },
    { id: "vs20starlight", name: "Starlight Princess", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/c3/c7/ff/c3c7ffe09c30742dbe942812fe832366.jpg", popular: true },
    { id: "vs20starlightx", name: "Starlight Princess 1000", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/c3/c7/ff/c3c7ffe09c30742dbe942812fe832366.jpg" },
    { id: "vs10bbbonanza", name: "Big Bass Bonanza", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/54/4a/8b/544a8b4f492bc72ed9d0029aa4d2ff70.jpg", popular: true },
    { id: "vs10bbplash", name: "Big Bass Splash", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/25/44/70/2544702316b5c5967d086a9597945edd.jpg" },
    { id: "vs20fruitparty", name: "Fruit Party", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/7d/5b/f5/7d5bf5471806417a40dafa8be448735e.jpg" },
    { id: "vs20fparty2", name: "Fruit Party 2", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/e9/44/aa/e944aa1d9e0b889b33090a7d3f4c2afb.jpg" },
    { id: "vswaysmadame", name: "Madame Destiny Megaways", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/e9/cc/82/e9cc82b2798f6e5a215f865a7489d0ac.jpg" },
    { id: "vs20midas", name: "The Hand of Midas", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/46/43/7f/46437fa49532acb50c79c1f5f3b3b0fe.jpg" },
    { id: "vs40wildwest", name: "Wild West Gold", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/89/1e/73/891e73cb1575b5e5634bcf158601fa57.jpg" },
    { id: "vswaysbufking", name: "Buffalo King Megaways", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/05/0e/8c/050e8cb4c4970803dfb6a32f5998a65e.jpg" },
    { id: "vs20goldfever", name: "Gems Bonanza", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/31/c8/25/31c8251c07e7277d597336f3fbcc54b3.jpg" },
    { id: "vs25scarabqueen", name: "John Hunter Scarab Queen", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/d8/b3/29/d8b329e04204b8a6aa2003bcdf92fd5c.jpg" },
    { id: "vs25mustang", name: "Mustang Gold", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/57/51/62/5751625176ba1e3d5be81e1388be12b1.jpg" },
    { id: "vswaysrhino", name: "Great Rhino Megaways", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/c6/9e/61/c69e617241eb3758d7c354ec6a3e928a.jpg" },
    { id: "vs25chilli", name: "Chilli Heat", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/ca/bb/42/cabb42b3aea42ff2996ee01e9b9776dc.jpg" },
    { id: "vs5joker", name: "Joker's Jewels", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/dc/5a/96/dc5a9637bad11cf7781ed638d00fcbcf.jpg" },
    { id: "vs12bbbonanza", name: "Bigger Bass Bonanza", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/04/c9/db/04c9db4f9f507a64e36eb25bf17fec61.jpg" },
    { id: "vs10bbbxmas", name: "Christmas Big Bass", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/29/62/c0/2962c037caf2aee17283f3fd017dc5e4.jpg" },
    { id: "vs20cleocatra", name: "Cleocatra", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/8e/fa/8e/8efa8e1e00a48b4b42ae5b443ac81c61.jpg" },
    { id: "vs20bchprty", name: "Wild Beach Party", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/8e/52/d2/8e52d2218ad7fbee43547fb70477cb0a.jpg" },
    { id: "vs50juicyfr", name: "Juicy Fruits", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/6e/88/a4/6e88a4716ea32a7009f3e82ef91b6509.jpg" },
    { id: "vswayshammthor", name: "Power of Thor Megaways", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/23/05/44/23054497779f41e2f47fcfe659ca777a.jpg" },
    { id: "vs10floatdrg", name: "Floating Dragon", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/81/5f/d1/815fd140631d3d588ed51a557aed563c.jpg" },
    { id: "vs10nudgeit", name: "Rise of Giza", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/75/c4/32/75c4328e374ff7b3991ea34b38dbf447.jpg" },
    { id: "vs10bookfallen", name: "Book of the Fallen", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/65/c6/b0/65c6b0639192ec6f52f13ae42c4aabaf.jpg" },
    { id: "vswayscryscav", name: "Crystal Caverns", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/41/9f/e1/419fe1784d59cd8a04a2b943ad5060ac.jpg" },
    { id: "vs4096magician", name: "Magician's Secrets", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/84/b2/24/84b224d2ea90792070e258d6c1db1593.jpg" },
    { id: "vs20smugglers", name: "Smugglers Cove", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/3f/59/89/3f59891d76d55ae071c20c4ea61407ab.jpg" },
    { id: "vs20superx", name: "Super X", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/29/d6/0f/29d60f43aa826aaace8fa7941e00a21c.jpg" },
    { id: "vs25bountygold", name: "Bounty Gold", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/17/93/ca/1793cae16d91983ebb436f4a54ad7094.jpg" },
    { id: "vs40bigjuan", name: "Big Juan", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/1d/13/45/1d1345435a09c8484d5e74280c3dce24.jpg" },
    { id: "vs20daydead", name: "Day of Dead", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/91/a9/bb/91a9bb10c43c1f8d81d9959d5820602b.jpg" },
    { id: "vs576mystic", name: "Mystic Chief", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/82/3f/46/823f46368fa120fd5f163654b5bce88a.jpg" },
    { id: "vs9piggybank", name: "Piggy Bank Bills", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/1200x/a7/90/c1/a790c1b5498d246832d842123e81f702.jpg" },
    { id: "vs20trsre", name: "Treasure Wild", provider: "Pragmatic Play", category: "slots", image: "https://i.pinimg.com/736x/88/a3/bc/88a3bcca3e468ddbf1ba395e9e81f226.jpg" },
    // Evolution Gaming - Canlı Casino
    { id: "evolution_lightning_roulette", name: "Lightning Roulette", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/95/f4/1b/95f41be75e8bcd1f113e28bc94ec7c3e.jpg", popular: true },
    { id: "evolution_crazy_time", name: "Crazy Time", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/8c/e2/3b/8ce23b10dbca3ae1b0a8ca9e2be66cf3.jpg", popular: true },
    { id: "evolution_blackjack", name: "Blackjack VIP", provider: "Evolution Gaming", category: "table", image: "https://i.pinimg.com/736x/73/e2/52/73e2520ff0d47e73f0a52a94ac5ca3e4.jpg", popular: true },
    { id: "evolution_baccarat", name: "Speed Baccarat", provider: "Evolution Gaming", category: "table", image: "https://i.pinimg.com/736x/2a/c4/f7/2ac4f7a7e44c4a49389a2be49f8f5b6e.jpg" },
    { id: "evolution_monopoly", name: "Monopoly Live", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/b0/02/5f/b0025ff400c81e4e6c3c32d1ba4ebe92.jpg", popular: true },
    { id: "evolution_dream_catcher", name: "Dream Catcher", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/66/23/d2/6623d24ebdf6b8d1f9b3c67ce3cf49e0.jpg" },
    { id: "evolution_mega_ball", name: "Mega Ball", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/9c/d1/b3/9cd1b307bf9f2e6c2a5c6db8bdf5e67d.jpg" },
    { id: "evolution_gonzos", name: "Gonzo's Treasure Hunt", provider: "Evolution Gaming", category: "live", image: "https://i.pinimg.com/736x/03/de/e3/03dee30f78f24d4b1484e64b59b36d74.jpg" },
    // NetEnt Slots
    { id: "netent_starburst", name: "Starburst", provider: "NetEnt", category: "slots", image: "https://i.pinimg.com/736x/65/78/d2/6578d247975302bd3da9e0cfbe9fca24.jpg", popular: true },
    { id: "netent_gonzos_quest", name: "Gonzo's Quest", provider: "NetEnt", category: "slots", image: "https://i.pinimg.com/736x/f2/d2/ad/f2d2ade2cd3ac7dd70f26bc94b37c8bf.jpg" },
    { id: "netent_dead_or_alive2", name: "Dead or Alive 2", provider: "NetEnt", category: "slots", image: "https://i.pinimg.com/736x/3e/43/e3/3e43e3bd0a3b32e1bbc5ecdc3befe46d.jpg" },
    { id: "netent_divine_fortune", name: "Divine Fortune", provider: "NetEnt", category: "slots", image: "https://i.pinimg.com/736x/e4/be/86/e4be86a5fef35f1c0d1c4f14d19ac97e.jpg" },
    // Play'n GO
    { id: "playngo_book_of_dead", name: "Book of Dead", provider: "Play'n GO", category: "slots", image: "https://i.pinimg.com/736x/3b/85/a1/3b85a19a11aa2e28c0a5bf06ff10bccc.jpg", popular: true },
    { id: "playngo_reactoonz", name: "Reactoonz", provider: "Play'n GO", category: "slots", image: "https://i.pinimg.com/736x/f1/61/b2/f161b21ae32dcf4e9b3b8dc2b6f2e7f0.jpg", popular: true },
    { id: "playngo_fire_joker", name: "Fire Joker", provider: "Play'n GO", category: "slots", image: "https://i.pinimg.com/736x/c5/0e/0e/c50e0e893c26dcb72a26384a9b76d05c.jpg" },
    // Push Gaming
    { id: "push_jammin_jars", name: "Jammin' Jars", provider: "Push Gaming", category: "slots", image: "https://i.pinimg.com/736x/df/8c/82/df8c827e9b68db808d73de973f2e2e86.jpg", popular: true },
    { id: "push_jammin_jars2", name: "Jammin' Jars 2", provider: "Push Gaming", category: "slots", image: "https://i.pinimg.com/736x/a9/15/4f/a9154f6cd6b1b9c3afaa648ad66bac65.jpg" },
    // Hacksaw Gaming
    { id: "hacksaw_wanted", name: "Wanted Dead or a Wild", provider: "Hacksaw Gaming", category: "slots", image: "https://i.pinimg.com/736x/0b/e2/e2/0be2e23bc5d25754698e21c5f3e6ecf4.jpg", popular: true },
    { id: "hacksaw_chaos_crew", name: "Chaos Crew", provider: "Hacksaw Gaming", category: "slots", image: "https://i.pinimg.com/736x/d5/3c/e3/d53ce371ef35ec7fc3f8b821fdfc1f00.jpg" },
    // Nolimit City
    { id: "nolimit_mental", name: "Mental", provider: "Nolimit City", category: "slots", image: "https://i.pinimg.com/736x/62/f4/cb/62f4cb9b7ff1968a9d4e3285c10de15b.jpg", popular: true },
    { id: "nolimit_tombstone", name: "Tombstone RIP", provider: "Nolimit City", category: "slots", image: "https://i.pinimg.com/736x/c6/79/36/c67936e20e5e29e94e08c9bd8f3d37d9.jpg" },
];

// Oyun listesi API'si
app.get('/api/veritral/games', async (req, res) => {
    try {
        const { provider, category, search, page = 1, limit = 40 } = req.query;

        // Önce Veritral API'den dene, başarısızda fallback kullan
        let games = [];
        const veritralData = await fetchVeritralGames();

        if (veritralData && Array.isArray(veritralData)) {
            // Veritral verisi varsa dönüştür
            games = veritralData.map(g => ({
                id: g.game_id || g.id,
                name: g.game_name || g.name,
                provider: g.provider_name || g.provider || 'Unknown',
                category: (g.game_type || g.category || 'slots').toLowerCase(),
                image: g.image || g.thumbnail || g.banner || '',
                popular: g.popular || false
            }));
        } else {
            // Fallback: yedek oyun kataloğu
            games = [...fallbackGames];
        }

        // Filtreleme
        if (provider && provider !== 'all') {
            games = games.filter(g => g.provider.toLowerCase().includes(provider.toLowerCase()));
        }
        if (category && category !== 'all') {
            games = games.filter(g => g.category === category.toLowerCase());
        }
        if (search) {
            const term = search.toLowerCase();
            games = games.filter(g =>
                g.name.toLowerCase().includes(term) ||
                g.provider.toLowerCase().includes(term)
            );
        }

        // Sayfalama
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIdx = (pageNum - 1) * limitNum;
        const paginatedGames = games.slice(startIdx, startIdx + limitNum);
        const providerGameRows = paginatedGames.length
            ? await query(`
                SELECT provider_key, game_key, is_active, current_rtp_percent, last_alert_at
                FROM provider_games
                WHERE game_key = ANY(?::text[])
            `, [paginatedGames.map((game) => game.id)])
            : [];
        const providerGameMap = new Map(providerGameRows.map((item) => [item.game_key, item]));
        const decoratedGames = paginatedGames.map((game) => {
            const providerState = providerGameMap.get(game.id);

            return {
                ...game,
                is_active: providerState ? Boolean(providerState.is_active) : true,
                current_rtp_percent: providerState ? toNumber(providerState.current_rtp_percent) : 0,
                last_alert_at: providerState?.last_alert_at || null
            };
        });

        // Sağlayıcı listesini oluştur
        const allGames = veritralData ? games : fallbackGames;
        const providers = [...new Set(allGames.map(g => g.provider))].sort();

        res.json({
            success: true,
            games: decoratedGames,
            total: games.length,
            page: pageNum,
            totalPages: Math.ceil(games.length / limitNum),
            providers: providers,
            source: veritralData ? 'veritral' : 'fallback'
        });
    } catch (error) {
        console.error('❌ Oyun listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

// Sağlayıcı listesi API'si
app.get('/api/veritral/providers', async (req, res) => {
    try {
        const veritralData = await fetchVeritralGames();
        let games = veritralData && Array.isArray(veritralData)
            ? veritralData.map(g => ({ provider: g.provider_name || g.provider || 'Unknown' }))
            : fallbackGames;

        const providerCounts = {};
        games.forEach(g => {
            const p = g.provider;
            providerCounts[p] = (providerCounts[p] || 0) + 1;
        });

        const providers = Object.entries(providerCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        res.json({ success: true, providers });
    } catch (error) {
        console.error('❌ Sağlayıcı listesi hatası:', error);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});

// Oyun Başlatma API'si (Veritral Launch)
app.get('/api/launch-game', authenticateToken, async (req, res) => {
    try {
        const { gameId } = req.query;
        const userId = req.user.id;

        if (!gameId) {
            return res.json({ success: false, message: 'Oyun ID gerekli!' });
        }

        // Veritral API ile oyun başlat
        try {
            const launchResponse = await fetch(VERITRAL_LAUNCH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: VERITRAL_API_KEY,
                    api_key: VERITRAL_API_KEY,
                    api_secret: VERITRAL_API_SECRET,
                    game_id: gameId,
                    player_id: userId.toString(),
                    currency: 'TRY',
                    language: 'tr',
                    return_url: `http://localhost:${PORT}`
                })
            });

            const launchData = await launchResponse.json();

            if (launchData.response && launchData.response.status === 'OK' && launchData.response.data?.launch_url) {
                // Log kaydet
                await saveLog(userId, null, 'GAME_LAUNCH', `Oyun başlatıldı: ${gameId}`, req.ip);
                return res.json({
                    success: true,
                    launchUrl: launchData.response.data.launch_url
                });
            }
        } catch (launchError) {
            console.warn('⚠️ Veritral launch hatası, demo moda geçiliyor:', launchError.message);
        }

        // Fallback: Demo URL (Veritral erişimi yoksa)
        const demoUrl = `https://demogamesfree.pragmaticplay.net/gs2c/openGame.do?gameSymbol=${gameId}&websiteUrl=https://clashbet.com&jurisdiction=99&lang=tr&cur=TRY`;

        await saveLog(userId, null, 'GAME_LAUNCH_DEMO', `Demo oyun başlatıldı: ${gameId}`, req.ip);

        res.json({
            success: true,
            launchUrl: demoUrl,
            demo: true
        });

    } catch (error) {
        console.error('❌ Oyun başlatma hatası:', error);
        res.json({ success: false, message: 'Oyun başlatılamadı!' });
    }
});

// Sunucuyu Başlat
const server = app.listen(PORT, () => {
    console.log(`
    🚀 SİSTEM BAŞLATILDI!
    -------------------------------------------
    🌐 Web Sitesi:   http://localhost:${PORT}
    🔧 Admin Paneli: http://localhost:${PORT}/admin/login
    -------------------------------------------
    `);
}).on('error', (err) => {
    console.error('❌ SUNUCU BAŞLATMA HATASI:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} şu anda kullanımda. Lütfen başka bir port deneyin veya bu portu kullanan uygulamayı kapatın.`);
    }
});

server.on('close', () => {
    console.log('⚠️ Sunucu kapatıldı (Server Closed Event)');
});
