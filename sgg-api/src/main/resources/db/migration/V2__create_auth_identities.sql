CREATE TABLE auth_identities (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    provider     VARCHAR(50) NOT NULL,
    provider_uid VARCHAR(200) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_uid)
);

CREATE INDEX idx_auth_identities_user_id ON auth_identities(user_id);
