#!/bin/bash
# ─── Seed BD de desarrollo con datos de prueba ────
# Crea gyms, miembros y usuarios de prueba para testear manualmente
# Uso: ./scripts/seed-dev-db.sh
#
# IMPORTANTE: Primero logueate en la app con tu cuenta real
# para que el /auth/sync cree tu usuario en la BD.
# Después ejecutá este script.

set -e

DB_CONTAINER="sgg-postgres-1"
DB_NAME="sgg_dev"
DB_USER="sgg_admin"

echo "→ Buscando tu usuario en la BD..."
REAL_USER=$(docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -A -c "SELECT id FROM users ORDER BY id LIMIT 1;")

if [ -z "$REAL_USER" ]; then
    echo "✗ No hay usuarios en la BD."
    echo "  Primero logueate en http://localhost:3000 para que se cree tu usuario."
    exit 1
fi

echo "  Tu user_id es: $REAL_USER"

echo "→ Insertando datos de prueba..."
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME <<SQL

-- ═══ USUARIOS DE PRUEBA ═══
-- (tu usuario real ya existe por el login)

INSERT INTO users (full_name, email, supabase_uid, platform_role)
VALUES
    ('Coach María García', 'maria.coach@test.com', 'test-coach-uid-001', 'USER'),
    ('Coach Pedro López', 'pedro.coach@test.com', 'test-coach-uid-002', 'USER'),
    ('Juan Miembro', 'juan.miembro@test.com', 'test-member-uid-001', 'USER'),
    ('Ana Miembro', 'ana.miembro@test.com', 'test-member-uid-002', 'USER'),
    ('Carlos Miembro', 'carlos.miembro@test.com', 'test-member-uid-003', 'USER'),
    ('Laura Miembro', 'laura.miembro@test.com', 'test-member-uid-004', 'USER'),
    ('Sofía Pendiente', 'sofia.pendiente@test.com', 'test-pending-uid-001', 'USER'),
    ('Diego Pendiente', 'diego.pendiente@test.com', 'test-pending-uid-002', 'USER'),
    ('Bloqueado Test', 'bloqueado@test.com', 'test-blocked-uid-001', 'USER')
ON CONFLICT (email) DO NOTHING;

-- ═══ GYMS ═══

INSERT INTO gyms (name, slug, description, logo_url, routine_cycle, owner_user_id, status)
VALUES
    ('CrossFit Norte', 'crossfit-norte', 'El mejor gimnasio de crossfit de la zona norte. Equipamiento de primera y coaches certificados.', NULL, 'WEEKLY', $REAL_USER, 'ACTIVE'),
    ('Iron Gym Sur', 'iron-gym-sur', 'Gimnasio de musculación y fitness en zona sur.', NULL, 'WEEKLY', $REAL_USER, 'ACTIVE'),
    ('Gym Suspendido', 'gym-suspendido', 'Este gym está suspendido para pruebas.', NULL, 'WEEKLY', $REAL_USER, 'SUSPENDED')
ON CONFLICT (slug) DO NOTHING;

-- ═══ MEMBRESÍAS ═══

-- Tu usuario como ADMIN de CrossFit Norte
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, $REAL_USER, 'ADMIN', 'ACTIVE'
FROM gyms g WHERE g.slug = 'crossfit-norte'
ON CONFLICT DO NOTHING;

-- Tu usuario como ADMIN de Iron Gym Sur
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, $REAL_USER, 'ADMIN', 'ACTIVE'
FROM gyms g WHERE g.slug = 'iron-gym-sur'
ON CONFLICT DO NOTHING;

-- Coaches activos en CrossFit Norte
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'COACH', 'ACTIVE'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'maria.coach@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'COACH', 'ACTIVE'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'pedro.coach@test.com'
ON CONFLICT DO NOTHING;

-- Miembros activos en CrossFit Norte
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'juan.miembro@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'ana.miembro@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'carlos.miembro@test.com'
ON CONFLICT DO NOTHING;

-- Miembro con vencimiento próximo
INSERT INTO gym_members (gym_id, user_id, role, status, membership_expires_at)
SELECT g.id, u.id, 'MEMBER', 'ACTIVE', NOW() + INTERVAL '15 days'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'laura.miembro@test.com'
ON CONFLICT DO NOTHING;

-- Solicitudes pendientes
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'PENDING'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'sofia.pendiente@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'PENDING'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'diego.pendiente@test.com'
ON CONFLICT DO NOTHING;

-- Miembro bloqueado
INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'BLOCKED'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'bloqueado@test.com'
ON CONFLICT DO NOTHING;

SQL

echo ""
echo "✓ Datos de prueba insertados:"
echo ""
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT g.name, g.slug, g.status, COUNT(gm.id) as miembros
FROM gyms g LEFT JOIN gym_members gm ON g.id = gm.gym_id
GROUP BY g.id ORDER BY g.id;
"
docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -c "
SELECT u.full_name, u.email, gm.role, gm.status, g.slug as gym
FROM gym_members gm
JOIN users u ON gm.user_id = u.id
JOIN gyms g ON gm.gym_id = g.id
ORDER BY g.slug, gm.role, u.full_name;
"

echo "→ Listo! Ahora logueate en http://localhost:3000"
echo "  Vas a ver 2 gyms (CrossFit Norte e Iron Gym Sur)"
echo "  CrossFit Norte tiene coaches, miembros, pendientes y bloqueados para probar"
