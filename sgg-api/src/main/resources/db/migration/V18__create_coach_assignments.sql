CREATE TABLE coach_assignments (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    coach_user_id   BIGINT NOT NULL REFERENCES users(id),
    member_user_id  BIGINT NOT NULL REFERENCES users(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    unassigned_at   TIMESTAMP
);

CREATE INDEX idx_coach_assignments_gym    ON coach_assignments(gym_id);
CREATE INDEX idx_coach_assignments_coach  ON coach_assignments(coach_user_id, gym_id);
CREATE INDEX idx_coach_assignments_member ON coach_assignments(member_user_id, gym_id);

-- Solo una asignación activa por par coach-member-gym
CREATE UNIQUE INDEX idx_coach_assignments_active_unique
    ON coach_assignments(gym_id, coach_user_id, member_user_id)
    WHERE unassigned_at IS NULL;
