CREATE TABLE gym_requests (
    id            BIGSERIAL PRIMARY KEY,
    gym_name      VARCHAR(200) NOT NULL,
    contact_name  VARCHAR(200) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    message       TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CONTACTED','APPROVED','REJECTED')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_requests_status     ON gym_requests(status);
CREATE INDEX idx_gym_requests_created_at ON gym_requests(created_at DESC);
