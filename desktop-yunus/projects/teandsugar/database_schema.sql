-- =====================================================
-- CLASH BET - VERİTABANI ŞEMASI
-- Bu dosyayı XAMPP phpMyAdmin'de çalıştır
-- =====================================================

-- Veritabanını oluştur (yoksa)
CREATE DATABASE IF NOT EXISTS clash_bet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clash_bet;

-- =====================================================
-- 1. KULLANICILAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    birthdate DATE DEFAULT NULL,
    referral_code VARCHAR(50) DEFAULT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    balance DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('active', 'banned', 'pending') DEFAULT 'active',
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    total_deposit DECIMAL(15,2) DEFAULT 0.00,
    total_withdraw DECIMAL(15,2) DEFAULT 0.00,
    total_bet DECIMAL(15,2) DEFAULT 0.00,
    total_win DECIMAL(15,2) DEFAULT 0.00,
    -- Hesap Doğrulama Alanları
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
    verification_document VARCHAR(255) DEFAULT NULL,
    verification_note VARCHAR(255) DEFAULT NULL,
    verification_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_status (status),
    INDEX idx_verification (verification_status)
) ENGINE=InnoDB;

-- =====================================================
-- 2. FİNANSAL İŞLEMLER TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type ENUM('deposit', 'withdraw') NOT NULL,
    method VARCHAR(50) DEFAULT 'Havale',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_note VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB;

-- =====================================================
-- 3. KUPONLAR TABLOSU (Ana Kupon Bilgileri)
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    total_odds DECIMAL(10,2) NOT NULL,
    potential_win DECIMAL(15,2) NOT NULL,
    actual_win DECIMAL(15,2) DEFAULT 0,
    status ENUM('pending', 'won', 'lost', 'partial') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- 3b. KUPON SEÇİMLERİ TABLOSU (Kupondaki Her Bahis)
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_selections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    match_id VARCHAR(100) NOT NULL,
    match_name VARCHAR(255) NOT NULL,
    pick_type VARCHAR(50) NOT NULL,
    pick_label VARCHAR(100) NOT NULL,
    odds DECIMAL(5,2) NOT NULL,
    match_result VARCHAR(50) DEFAULT NULL,
    status ENUM('pending', 'won', 'lost') DEFAULT 'pending',
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    INDEX idx_coupon_id (coupon_id)
) ENGINE=InnoDB;

-- =====================================================
-- 3c. ESKİ BAHİSLER TABLOSU (Geriye Uyumluluk)
-- =====================================================
CREATE TABLE IF NOT EXISTS bets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    match_name VARCHAR(255) NOT NULL,
    pick VARCHAR(50) NOT NULL,
    odds DECIMAL(5,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    potential_win DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'won', 'lost') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- 4. SANDIK SATIN ALIMLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS chest_purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chest_type VARCHAR(50) NOT NULL,
    chest_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT DEFAULT 1,
    reward_type ENUM('card', 'money') NOT NULL,
    reward_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- 5. KULLANICI KARTLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS user_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_id VARCHAR(50) NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_img VARCHAR(255) NOT NULL,
    buff VARCHAR(100) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    duration INT DEFAULT 900000,
    activation_time BIGINT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- 6. GÜNLÜK ÖDÜLLER TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reward_type ENUM('money', 'spin') NOT NULL,
    reward_amount INT NOT NULL,
    claim_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily (user_id, claim_date),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- 7. ÇARK KAYITLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS wheel_spins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    prize VARCHAR(100) NOT NULL,
    promo_code VARCHAR(50) NOT NULL,
    used TINYINT(1) DEFAULT 0,
    spin_time BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_promo_code (promo_code)
) ENGINE=InnoDB;

-- =====================================================
-- 8. PROMOSYON KODLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    type ENUM('money', 'spin', 'bonus') NOT NULL,
    value INT NOT NULL,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code)
) ENGINE=InnoDB;

-- =====================================================
-- 9. MAÇLAR TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team1 VARCHAR(100) NOT NULL,
    team2 VARCHAR(100) NOT NULL,
    logo1 VARCHAR(255) DEFAULT '',
    logo2 VARCHAR(255) DEFAULT '',
    match_time VARCHAR(10) NOT NULL,
    match_date DATE NOT NULL,
    sport_type ENUM('futbol', 'basketbol', 'tenis', 'esports') DEFAULT 'futbol',
    odds_1 DECIMAL(5,2) DEFAULT 1.50,
    odds_x DECIMAL(5,2) DEFAULT 3.00,
    odds_2 DECIMAL(5,2) DEFAULT 2.50,
    status ENUM('upcoming', 'live', 'finished') DEFAULT 'upcoming',
    result VARCHAR(10) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sport (sport_type),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- 10. SİSTEM AYARLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- 11. SİSTEM LOGLARI TABLOSU
-- =====================================================
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    admin_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action)
) ENGINE=InnoDB;

-- =====================================================
-- VARSAYILAN VERİLER
-- =====================================================

-- Admin Kullanıcı (Şifre: admin123)
INSERT INTO users (username, email, password, role, balance, status) VALUES
('admin', 'admin@clashbet.com', '$2b$10$rQZ5Jj8Qg8EqYpH4H8Q5xOvZ7Q5Q8xZ5xZ5xZ5xZ5xZ5xZ5xZ5xZ5', 'admin', 100000.00, 'active')
ON DUPLICATE KEY UPDATE role = 'admin';

-- Varsayılan Ayarlar
INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'CLASH BET'),
('announcement', 'Hoşgeldiniz! Yeni üyelere özel 2000 TL bonus!'),
('maintenance_mode', '0'),
('min_deposit', '50'),
('min_withdraw', '100'),
('welcome_bonus', '2000')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Örnek Maçlar
INSERT INTO matches (team1, team2, logo1, logo2, match_time, match_date, sport_type, odds_1, odds_x, odds_2) VALUES
('Fenerbahçe', 'Galatasaray', 'https://cdn.sportmonks.com/images/soccer/teams/24/88.png', 'https://cdn.sportmonks.com/images/soccer/teams/22/3990.png', '19:00', CURDATE(), 'futbol', 2.10, 3.25, 3.40),
('Beşiktaş', 'Trabzonspor', 'https://cdn.sportmonks.com/images/soccer/teams/3/643.png', 'https://cdn.sportmonks.com/images/soccer/teams/0/4192.png', '20:45', CURDATE(), 'futbol', 1.85, 3.50, 4.20),
('Real Madrid', 'Barcelona', 'https://cdn.sportmonks.com/images/soccer/teams/20/20.png', 'https://cdn.sportmonks.com/images/soccer/teams/19/83.png', '22:00', CURDATE(), 'futbol', 2.45, 3.30, 2.90),
('Manchester City', 'Liverpool', 'https://cdn.sportmonks.com/images/soccer/teams/9/9.png', 'https://cdn.sportmonks.com/images/soccer/teams/8/8.png', '18:30', CURDATE(), 'futbol', 1.95, 3.60, 3.85)
ON DUPLICATE KEY UPDATE match_time = VALUES(match_time);

-- Örnek Promosyon Kodları
INSERT INTO promo_codes (code, type, value, max_uses, is_active) VALUES
('HOSGELDIN', 'money', 100, 1000, 1),
('FREESPIN50', 'spin', 50, 500, 1),
('VIP2024', 'money', 500, 100, 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

SELECT 'Veritabanı başarıyla oluşturuldu!' AS Sonuc;
