ALTER TABLE users ADD COLUMN username VARCHAR(30);

DO $$
DECLARE
    rec       RECORD;
    base_un   TEXT;
    candidate TEXT;
    suffix    INT;
BEGIN
    FOR rec IN SELECT id, email FROM users ORDER BY id LOOP
        base_un := LOWER(SPLIT_PART(rec.email, '@', 1));
        base_un := REGEXP_REPLACE(base_un, '[^a-z0-9_]', '_', 'g');
        IF LENGTH(base_un) < 3 THEN
            base_un := RPAD(base_un, 3, '_');
        END IF;
        base_un := SUBSTRING(base_un, 1, 30);

        candidate := base_un;
        suffix    := 2;
        WHILE EXISTS (SELECT 1 FROM users WHERE username = candidate) LOOP
            IF LENGTH(base_un) + LENGTH(suffix::TEXT) > 30 THEN
                candidate := SUBSTRING(base_un, 1, 30 - LENGTH(suffix::TEXT)) || suffix::TEXT;
            ELSE
                candidate := base_un || suffix::TEXT;
            END IF;
            suffix := suffix + 1;
        END LOOP;

        UPDATE users SET username = candidate WHERE id = rec.id;
    END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX idx_users_username ON users(username);
