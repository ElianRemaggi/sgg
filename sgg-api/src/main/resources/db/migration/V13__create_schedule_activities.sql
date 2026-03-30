CREATE TABLE schedule_activities (
    id           BIGSERIAL PRIMARY KEY,
    gym_id       BIGINT NOT NULL REFERENCES gyms(id),
    name         VARCHAR(200) NOT NULL,
    description  TEXT,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_activities_gym ON schedule_activities(gym_id);
CREATE INDEX idx_schedule_activities_gym_day ON schedule_activities(gym_id, day_of_week);
