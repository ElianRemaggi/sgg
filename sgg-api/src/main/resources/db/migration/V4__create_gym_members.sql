CREATE TABLE gym_members (
    id                      BIGSERIAL PRIMARY KEY,
    gym_id                  BIGINT NOT NULL REFERENCES gyms(id),
    user_id                 BIGINT NOT NULL REFERENCES users(id),
    role                    VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    membership_expires_at   TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX idx_gym_members_user_gym ON gym_members(user_id, gym_id);
CREATE UNIQUE INDEX idx_unique_pending_membership
    ON gym_members(user_id, gym_id) WHERE status = 'PENDING';
