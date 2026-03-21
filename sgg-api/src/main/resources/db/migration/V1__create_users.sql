CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    avatar_url      VARCHAR(500),
    supabase_uid    VARCHAR(100) NOT NULL UNIQUE,
    platform_role   VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_supabase_uid ON users(supabase_uid);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform_role ON users(platform_role);
