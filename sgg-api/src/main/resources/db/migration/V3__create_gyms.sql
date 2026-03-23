CREATE TABLE gyms (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    logo_url        VARCHAR(500),
    routine_cycle   VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',
    owner_user_id   BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_gyms_slug ON gyms(slug);
CREATE INDEX idx_gyms_owner ON gyms(owner_user_id);
CREATE INDEX idx_gyms_status ON gyms(status);
