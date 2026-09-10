-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT NULL AFTER username;
ALTER TABLE users ADD COLUMN birthdate DATE DEFAULT NULL AFTER phone;
ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) DEFAULT NULL AFTER birthdate;
