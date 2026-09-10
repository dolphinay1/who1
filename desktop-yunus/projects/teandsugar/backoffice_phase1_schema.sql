-- =====================================================
-- CLASH BET BACKOFFICE - FAZ 1 ÇEKİRDEK ŞEMA
-- PostgreSQL odaklıdır ve mevcut users / transactions yapısına entegre olur.
-- =====================================================

-- -----------------------------------------------------
-- 1. USERS Genişletmeleri
-- -----------------------------------------------------
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ggr NUMERIC(14,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loyalty_level VARCHAR(30) NOT NULL DEFAULT 'BRONZE',
    ADD COLUMN IF NOT EXISTS last_risk_review_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_risk_score ON users(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_loyalty_level ON users(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC);

-- -----------------------------------------------------
-- 2. RBAC: Roller ve Adminler
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
    id BIGSERIAL PRIMARY KEY,
    role_key VARCHAR(30) NOT NULL UNIQUE,
    label VARCHAR(80) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_admin_roles_key CHECK (role_key IN ('ADMIN', 'FINANCE', 'SUPPORT'))
);

CREATE TABLE IF NOT EXISTS admins (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES admin_roles(id) ON DELETE RESTRICT,
    username VARCHAR(80) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_admin_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE INDEX IF NOT EXISTS idx_admins_role_id ON admins(role_id);
CREATE INDEX IF NOT EXISTS idx_admins_status ON admins(status);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_key VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admin_role_permissions UNIQUE (role_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role_id ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_key ON admin_role_permissions(permission_key);

INSERT INTO admin_roles (role_key, label, description) VALUES
('ADMIN', 'Admin', 'Tüm backoffice modüllerine tam erişim'),
('FINANCE', 'Finans', 'Finans akışları, işlemler ve kasa görünümü'),
('SUPPORT', 'Canlı Destek', 'Oyuncu CRM, ticket ve not yönetimi')
ON CONFLICT (role_key) DO UPDATE
SET label = EXCLUDED.label,
    description = EXCLUDED.description;

INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'dashboard:view' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'dashboard:financial' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'crm:read' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'notes:write' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'transactions:read' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'transactions:manage' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'tickets:read' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'search:global' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'admins:manage' FROM admin_roles WHERE role_key = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'dashboard:view' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'dashboard:financial' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'crm:read' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'transactions:read' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'transactions:manage' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'tickets:read' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'search:global' FROM admin_roles WHERE role_key = 'FINANCE'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'dashboard:view' FROM admin_roles WHERE role_key = 'SUPPORT'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'crm:read' FROM admin_roles WHERE role_key = 'SUPPORT'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'notes:write' FROM admin_roles WHERE role_key = 'SUPPORT'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'tickets:read' FROM admin_roles WHERE role_key = 'SUPPORT'
ON CONFLICT DO NOTHING;
INSERT INTO admin_role_permissions (role_id, permission_key)
SELECT id, 'search:global' FROM admin_roles WHERE role_key = 'SUPPORT'
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- 3. CRM Notları
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
    note_type VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
    note_text TEXT NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'INTERNAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notes_visibility CHECK (visibility IN ('INTERNAL', 'SUPPORT', 'FINANCE'))
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_admin_id ON notes(admin_id);
CREATE INDEX IF NOT EXISTS idx_notes_note_type ON notes(note_type);

-- -----------------------------------------------------
-- 4. IP Logları ve Anti-Fraud Kaynağı
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_ip_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address INET NOT NULL,
    user_agent TEXT,
    source VARCHAR(40) NOT NULL DEFAULT 'web',
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    login_count INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT uq_user_ip_logs UNIQUE (user_id, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_user_ip_logs_user_id ON user_ip_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_logs_ip_address ON user_ip_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_ip_logs_last_seen_at ON user_ip_logs(last_seen_at DESC);

-- -----------------------------------------------------
-- 5. CRM Ticket Kaydı
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    assigned_admin_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
    subject VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    channel VARCHAR(20) NOT NULL DEFAULT 'CHAT',
    last_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ticket_status CHECK (status IN ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_ticket_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_admin_id ON tickets(assigned_admin_id);

-- -----------------------------------------------------
-- 6. Finansal Özet Backfill
-- -----------------------------------------------------
UPDATE users
SET total_deposit = 0
WHERE total_deposit IS NULL;

UPDATE users
SET total_withdraw = 0
WHERE total_withdraw IS NULL;

UPDATE users
SET bonus_balance = 0
WHERE bonus_balance IS NULL;

WITH transaction_rollup AS (
    SELECT
        user_id,
        COALESCE(SUM(CASE WHEN type = 'deposit' AND status = 'approved' THEN amount ELSE 0 END), 0) AS approved_deposit,
        COALESCE(SUM(CASE WHEN type = 'withdraw' AND status = 'approved' THEN amount ELSE 0 END), 0) AS approved_withdraw
    FROM transactions
    GROUP BY user_id
)
UPDATE users u
SET total_deposit = r.approved_deposit,
    total_withdraw = r.approved_withdraw,
    ggr = r.approved_deposit - r.approved_withdraw,
    loyalty_level = CASE
        WHEN r.approved_deposit >= 50000 THEN 'VIP'
        WHEN r.approved_deposit >= 15000 THEN 'PLATINUM'
        WHEN r.approved_deposit >= 5000 THEN 'GOLD'
        WHEN r.approved_deposit >= 1000 THEN 'SILVER'
        ELSE 'BRONZE'
    END,
    risk_score = CASE
        WHEN r.approved_deposit > 0 AND ((r.approved_withdraw / r.approved_deposit) * 100) > 500 THEN GREATEST(u.risk_score, 80)
        ELSE u.risk_score
    END,
    last_risk_review_at = NOW()
FROM transaction_rollup r
WHERE u.id = r.user_id;
