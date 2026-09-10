require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
    try {
        const hash = await bcrypt.hash('clash123', 10);
        await pool.query(
            `INSERT INTO users (username, email, password, role, balance, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (username) DO UPDATE SET password = $3, role = $4`,
            ['patron', 'patron@clashbet.com', hash, 'admin', 100000.00, 'active']
        );
        console.log('✅ Admin kullanıcı oluşturuldu: patron / clash123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
}

createAdmin();
