require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setup() {
    try {
        console.log('🚀 Promosyonlar tablosu oluşturuluyor...');
        const createTable = `
            CREATE TABLE IF NOT EXISTS promotions (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                image_url TEXT,
                bonus_type VARCHAR(50),
                btn_text VARCHAR(50),
                btn_link VARCHAR(255),
                active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTable);
        console.log('✅ Promotions tablosu hazır.');

        console.log('📦 Örnek veriler ekleniyor...');
        const seedData = `
            INSERT INTO promotions (title, description, image_url, bonus_type, btn_text, btn_link)
            VALUES 
            ('%100 Hoşgeldin Bonusu', 'İlk yatırımınıza özel 2000 TL''ye kadar %100 bonus!', 'banner-bg.png', 'welcome', 'Hemen Al', '#'),
            ('Haftalık Kayıp Bonusu', 'Slotlarda yaşadığınız kayıpların %20''sini geri iade ediyoruz.', 'wild-west-bg.png', 'cashback', 'Detaylar', '#'),
            ('Arkadaşını Getir', 'Getirdiğin her arkadaşın için anında 500 TL bonus kazan!', 'wolf-gold-bg.png', 'referral', 'Davet Et', '#')
            ON CONFLICT DO NOTHING;
        `;
        await pool.query(seedData);
        console.log('✅ Örnek promosyonlar başarıyla eklendi.');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Hata:', err.message);
        process.exit(1);
    }
}

setup();
