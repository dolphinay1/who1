const fs = require('fs');
const path = require('path');
const { ensurePhase2Defaults } = require('./phase2-service');

const seedDefaultAdmins = async (pool, bcrypt) => {
    const roleRows = await pool.query('SELECT id, role_key FROM admin_roles');
    const rolesByKey = Object.fromEntries(roleRows.rows.map((role) => [role.role_key, role.id]));

    const defaults = [
        {
            roleKey: 'ADMIN',
            username: process.env.BACKOFFICE_ADMIN_USERNAME || 'admin',
            fullName: 'System Admin',
            email: process.env.BACKOFFICE_ADMIN_EMAIL || 'admin@clashbet.local',
            password: process.env.BACKOFFICE_ADMIN_PASSWORD || 'Admin123!'
        },
        {
            roleKey: 'FINANCE',
            username: process.env.BACKOFFICE_FINANCE_USERNAME || 'finance',
            fullName: 'Finans Operasyon',
            email: process.env.BACKOFFICE_FINANCE_EMAIL || 'finance@clashbet.local',
            password: process.env.BACKOFFICE_FINANCE_PASSWORD || 'Finance123!'
        },
        {
            roleKey: 'SUPPORT',
            username: process.env.BACKOFFICE_SUPPORT_USERNAME || 'support',
            fullName: 'Canlı Destek',
            email: process.env.BACKOFFICE_SUPPORT_EMAIL || 'support@clashbet.local',
            password: process.env.BACKOFFICE_SUPPORT_PASSWORD || 'Support123!'
        }
    ];

    for (const account of defaults) {
        const passwordHash = await bcrypt.hash(account.password, 10);
        await pool.query(`
            INSERT INTO admins (role_id, username, full_name, email, password_hash, status)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
            ON CONFLICT (username)
            DO NOTHING
        `, [rolesByKey[account.roleKey], account.username, account.fullName, account.email, passwordHash]);
    }
};

const runBackofficeMigrations = async ({ pool, bcrypt, rootDir }) => {
    const schemaPaths = [
        path.join(rootDir, 'backoffice_phase1_schema.sql'),
        path.join(rootDir, 'backoffice_phase2_schema.sql')
    ];

    for (const schemaPath of schemaPaths) {
        const sqlText = fs.readFileSync(schemaPath, 'utf8');
        const statements = sqlText
            .split(/;\s*(?:\r?\n|$)/g)
            .map((statement) => statement.trim())
            .filter(Boolean);

        for (const statement of statements) {
            await pool.query(statement);
        }
    }

    await seedDefaultAdmins(pool, bcrypt);
    await ensurePhase2Defaults(async (sql, params = []) => {
        let index = 1;
        const pgSql = sql.replace(/\?/g, () => `$${index++}`);
        return pool.query(pgSql, params).then((result) => result.rows);
    });
};

module.exports = {
    runBackofficeMigrations
};
