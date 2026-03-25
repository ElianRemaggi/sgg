-- V10: Soporte para autenticación nativa email/contraseña
-- Permite usuarios sin Supabase UID (registrados nativamente)

ALTER TABLE users ALTER COLUMN supabase_uid DROP NOT NULL;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Recrear índice único parcial: solo aplica cuando supabase_uid no es null
DROP INDEX IF EXISTS idx_users_supabase_uid;
CREATE UNIQUE INDEX idx_users_supabase_uid ON users (supabase_uid) WHERE supabase_uid IS NOT NULL;
