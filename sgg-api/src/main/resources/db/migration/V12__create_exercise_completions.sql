CREATE TABLE exercise_completions (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    assignment_id   BIGINT NOT NULL REFERENCES routine_assignments(id),
    exercise_id     BIGINT NOT NULL REFERENCES template_exercises(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    is_completed    BOOLEAN NOT NULL DEFAULT TRUE,
    weight_kg       DECIMAL(6,2),
    actual_reps     INTEGER,
    notes           TEXT,
    completed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_exercise_completions_unique
    ON exercise_completions(assignment_id, exercise_id, user_id);

CREATE INDEX idx_exercise_completions_gym ON exercise_completions(gym_id);
CREATE INDEX idx_exercise_completions_assignment ON exercise_completions(assignment_id);
CREATE INDEX idx_exercise_completions_user_date ON exercise_completions(user_id, completed_at);
