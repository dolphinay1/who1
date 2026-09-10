const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://Ruzgar:Ruzgar.07@localhost:3003/postgres',
});

const schema = `
-- =====================================================
-- 1. KULLANICILAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    birthdate DATE DEFAULT NULL,
    referral_code VARCHAR(50) DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'banned', 'pending')),
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    total_deposit DECIMAL(15,2) DEFAULT 0.00,
    total_withdraw DECIMAL(15,2) DEFAULT 0.00,
    total_bet DECIMAL(15,2) DEFAULT 0.00,
    total_win DECIMAL(15,2) DEFAULT 0.00,
    verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
    verification_document VARCHAR(255) DEFAULT NULL,
    verification_note VARCHAR(255) DEFAULT NULL,
    verification_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);

-- =====================================================
-- 2. FİNANSAL İŞLEMLER TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    method VARCHAR(50) DEFAULT 'Havale',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- =====================================================
-- 3. KUPONLAR TABLOSU 
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    total_odds DECIMAL(10,2) NOT NULL,
    potential_win DECIMAL(15,2) NOT NULL,
    actual_win DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'partial')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP NULL
);

-- =====================================================
-- 3b. KUPON SEÇİMLERİ TABLOSU 
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_selections (
    id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    match_id VARCHAR(100) NOT NULL,
    match_name VARCHAR(255) NOT NULL,
    pick_type VARCHAR(50) NOT NULL,
    pick_label VARCHAR(100) NOT NULL,
    odds DECIMAL(5,2) NOT NULL,
    match_result VARCHAR(50) DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost'))
);

-- =====================================================
-- 3c. ESKİ BAHİSLER TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS bets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_name VARCHAR(255) NOT NULL,
    pick VARCHAR(50) NOT NULL,
    odds DECIMAL(5,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    potential_win DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP NULL
);

-- =====================================================
-- 4. SANDIK SATIN ALIMLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS chest_purchases (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chest_type VARCHAR(50) NOT NULL,
    chest_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 1,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('card', 'money')),
    reward_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. KULLANICI KARTLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS user_cards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id VARCHAR(50) NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_img VARCHAR(255) NOT NULL,
    buff VARCHAR(100) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    duration INT DEFAULT 900000,
    activation_time BIGINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. GÜNLÜK ÖDÜLLER TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_rewards (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('money', 'spin')),
    reward_amount INT NOT NULL,
    claim_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, claim_date)
);

-- =====================================================
-- 7. ÇARK KAYITLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS wheel_spins (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prize VARCHAR(100) NOT NULL,
    promo_code VARCHAR(50) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    spin_time BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. PROMOSYON KODLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('money', 'spin', 'bonus')),
    value INT NOT NULL,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. MAÇLAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    team1 VARCHAR(100) NOT NULL,
    team2 VARCHAR(100) NOT NULL,
    logo1 VARCHAR(255) DEFAULT '',
    logo2 VARCHAR(255) DEFAULT '',
    match_time VARCHAR(10) NOT NULL,
    match_date DATE NOT NULL,
    sport_type VARCHAR(20) DEFAULT 'futbol' CHECK (sport_type IN ('futbol', 'basketbol', 'tenis', 'esports')),
    odds_1 DECIMAL(5,2) DEFAULT 1.50,
    odds_x DECIMAL(5,2) DEFAULT 3.00,
    odds_2 DECIMAL(5,2) DEFAULT 2.50,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'finished')),
    result VARCHAR(10) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 10. SİSTEM AYARLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. SİSTEM LOGLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    user_id INT DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 12. PROMOSYONLAR TABLOSU
-- =====================================================
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

-- =====================================================
-- 13. BANNERLAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Kullanıcı Ekle
INSERT INTO users (username, email, password, role, balance, status) 
VALUES ('admin', 'admin@clashbet.com', '$2b$10$rQZ5Jj8Qg8EqYpH4H8Q5xOvZ7Q5Q8xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5', 'admin', 100000.00, 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'CLASH BET'),
('announcement', 'Hoşgeldiniz! Yeni üyelere özel 2000 TL bonus!'),
('maintenance_mode', '0'),
('min_deposit', '50'),
('min_withdraw', '100'),
('welcome_bonus', '2000')
ON CONFLICT (setting_key) DO NOTHING;
`;

async function initDB() {
    try {
        console.log("PostgreSQL tabloları oluşturuluyor...");
        await pool.query(schema);
        console.log("Tablolar ve veriler başarıyla eklendi.");
        process.exit(0);
    } catch (err) {
        console.error("Tablo oluşturulurken hata:", err);
        process.exit(1);
    }
}

initDB();
