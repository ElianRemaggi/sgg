ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;

CREATE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_username_active ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_supabase_uid_active ON users(supabase_uid) WHERE deleted_at IS NULL;
