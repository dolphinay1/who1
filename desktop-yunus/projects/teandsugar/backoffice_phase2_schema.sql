-- =====================================================
-- CLASH BET BACKOFFICE - FAZ 2 FİNANS OTOMASYONU / KILL-SWITCH
-- =====================================================

-- -----------------------------------------------------
-- 1. Users genişletmeleri
-- -----------------------------------------------------
ALTER TABLE IF EXISTS users
    ADD COLUMN IF NOT EXISTS vip_fast_track_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- -----------------------------------------------------
-- 2. Transactions Faz 2 alanları
-- -----------------------------------------------------
ALTER TABLE IF EXISTS transactions
    ADD COLUMN IF NOT EXISTS asset_symbol VARCHAR(20),
    ADD COLUMN IF NOT EXISTS network VARCHAR(30),
    ADD COLUMN IF NOT EXISTS tx_hash VARCHAR(190),
    ADD COLUMN IF NOT EXISTS confirmations INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS required_confirmations INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(190),
    ADD COLUMN IF NOT EXISTS review_reason TEXT,
    ADD COLUMN IF NOT EXISTS processed_by_admin_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS processed_via VARCHAR(40) NOT NULL DEFAULT 'manual',
    ADD COLUMN IF NOT EXISTS auto_processed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS provider_payload JSONB,
    ADD COLUMN IF NOT EXISTS provider_response JSONB,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_transactions_status_type_created ON transactions(status, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_reference ON transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_asset_symbol ON transactions(asset_symbol);

-- -----------------------------------------------------
-- 3. Payment Method Limitleri
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_method_limits (
    id BIGSERIAL PRIMARY KEY,
    method_key VARCHAR(50) NOT NULL,
    label VARCHAR(80) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    min_amount NUMERIC(14,2) NOT NULL,
    max_amount NUMERIC(14,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'TRY',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_by_admin_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_method_limits UNIQUE (method_key, transaction_type),
    CONSTRAINT chk_payment_method_type CHECK (transaction_type IN ('deposit', 'withdraw')),
    CONSTRAINT chk_payment_method_minmax CHECK (min_amount >= 0 AND max_amount > 0 AND min_amount <= max_amount)
);

CREATE INDEX IF NOT EXISTS idx_payment_method_limits_sort ON payment_method_limits(sort_order, label);

-- -----------------------------------------------------
-- 4. Crypto webhook kayıtları
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS crypto_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    provider_name VARCHAR(80) NOT NULL DEFAULT 'crypto-listener',
    asset_symbol VARCHAR(20) NOT NULL,
    network VARCHAR(30),
    tx_hash VARCHAR(190) NOT NULL UNIQUE,
    wallet_address TEXT,
    user_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
    transaction_id INTEGER NULL REFERENCES transactions(id) ON DELETE SET NULL,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    fiat_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    confirmations INTEGER NOT NULL DEFAULT 0,
    required_confirmations INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payload JSONB,
    received_ip VARCHAR(90),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_crypto_event_status CHECK (status IN ('PENDING', 'CONFIRMED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_crypto_webhook_events_user ON crypto_webhook_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crypto_webhook_events_status ON crypto_webhook_events(status, updated_at DESC);

-- -----------------------------------------------------
-- 5. Provider / RTP metrikleri
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS provider_games (
    id BIGSERIAL PRIMARY KEY,
    provider_key VARCHAR(80) NOT NULL,
    provider_label VARCHAR(120) NOT NULL,
    game_key VARCHAR(160) NOT NULL,
    game_name VARCHAR(160) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    current_rtp_percent NUMERIC(8,2) NOT NULL DEFAULT 0,
    last_profit_loss NUMERIC(14,2) NOT NULL DEFAULT 0,
    last_bet_volume NUMERIC(14,2) NOT NULL DEFAULT 0,
    last_win_volume NUMERIC(14,2) NOT NULL DEFAULT 0,
    round_count INTEGER NOT NULL DEFAULT 0,
    payload JSONB,
    last_alert_at TIMESTAMPTZ NULL,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_provider_games UNIQUE (provider_key, game_key)
);

CREATE INDEX IF NOT EXISTS idx_provider_games_provider ON provider_games(provider_key, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_games_active ON provider_games(is_active, current_rtp_percent DESC);

CREATE TABLE IF NOT EXISTS provider_alerts (
    id BIGSERIAL PRIMARY KEY,
    provider_game_id BIGINT NOT NULL REFERENCES provider_games(id) ON DELETE CASCADE,
    provider_key VARCHAR(80) NOT NULL,
    provider_label VARCHAR(120) NOT NULL,
    game_key VARCHAR(160) NOT NULL,
    game_name VARCHAR(160) NOT NULL,
    alert_type VARCHAR(40) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'CRITICAL',
    message TEXT NOT NULL,
    payload JSONB,
    acknowledged_by_admin_id BIGINT NULL REFERENCES admins(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_alerts_created ON provider_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_alerts_ack ON provider_alerts(acknowledged_at, created_at DESC);
