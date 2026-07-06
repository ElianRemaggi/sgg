ALTER TABLE gym_members
    ADD CONSTRAINT gym_members_role_check
        CHECK (role IN ('MEMBER', 'COACH', 'ADMIN', 'ADMIN_COACH')),
    ADD CONSTRAINT gym_members_status_check
        CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED', 'INACTIVE'));

ALTER TABLE gyms
    ADD CONSTRAINT gyms_status_check
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'));
