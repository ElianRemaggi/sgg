ALTER TABLE gyms
    ADD COLUMN type VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
        CONSTRAINT gyms_type_check CHECK (type IN ('STANDARD', 'PERSONAL'));

CREATE INDEX idx_gyms_personal_owner ON gyms (owner_user_id) WHERE type = 'PERSONAL';
