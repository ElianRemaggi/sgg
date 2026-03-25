CREATE TABLE routine_assignments (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    template_id     BIGINT NOT NULL REFERENCES routine_templates(id),
    member_user_id  BIGINT NOT NULL REFERENCES users(id),
    assigned_by     BIGINT NOT NULL REFERENCES users(id),
    starts_at       TIMESTAMP NOT NULL,
    ends_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routine_assignments_member ON routine_assignments(member_user_id, gym_id);
CREATE INDEX idx_routine_assignments_gym ON routine_assignments(gym_id);
CREATE INDEX idx_routine_assignments_active ON routine_assignments(member_user_id, gym_id, ends_at)
    WHERE ends_at IS NULL;
