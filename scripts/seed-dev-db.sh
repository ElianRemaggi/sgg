#!/bin/bash
# ─── Seed BD de desarrollo con datos de prueba (Supabase) ────
# Crea gyms, miembros y usuarios de prueba para testear manualmente.
# Uso: ./scripts/seed-dev-db.sh
#
# IMPORTANTE: Primero logueate en la app con tu cuenta real
# para que el /auth/sync cree tu usuario en la BD.
# Después ejecutá este script.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../.env"

# Parsear JDBC URL → host / port / dbname
DB_HOST=$(echo "$SUPABASE_DB_URL" | sed 's|jdbc:postgresql://||' | cut -d: -f1)
DB_PORT=$(echo "$SUPABASE_DB_URL" | sed 's|jdbc:postgresql://[^:]*:||' | cut -d/ -f1 | cut -d? -f1)
DB_NAME=$(echo "$SUPABASE_DB_URL" | sed 's|.*://[^/]*/||' | cut -d? -f1)

PSQL_CMD="PGPASSWORD=$SUPABASE_DB_PASSWORD PGSSLMODE=require psql -h $DB_HOST -p $DB_PORT -U $SUPABASE_DB_USER -d $DB_NAME"

echo "Buscando tu usuario en la BD..."
REAL_USER=$(eval "$PSQL_CMD" -t -A -c "SELECT id FROM users ORDER BY id LIMIT 1;")

if [ -z "$REAL_USER" ]; then
    echo "No hay usuarios en la BD."
    echo "  Primero logueate en http://localhost:3000 para que se cree tu usuario."
    exit 1
fi

echo "  Tu user_id es: $REAL_USER"

echo "Insertando datos de prueba..."
eval "$PSQL_CMD" <<SQL

-- ═══ USUARIOS DE PRUEBA ═══

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

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, $REAL_USER, 'ADMIN', 'ACTIVE'
FROM gyms g WHERE g.slug = 'crossfit-norte'
ON CONFLICT DO NOTHING;

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, $REAL_USER, 'ADMIN', 'ACTIVE'
FROM gyms g WHERE g.slug = 'iron-gym-sur'
ON CONFLICT DO NOTHING;

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

INSERT INTO gym_members (gym_id, user_id, role, status, membership_expires_at)
SELECT g.id, u.id, 'MEMBER', 'ACTIVE', NOW() + INTERVAL '15 days'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'laura.miembro@test.com'
ON CONFLICT DO NOTHING;

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

INSERT INTO gym_members (gym_id, user_id, role, status)
SELECT g.id, u.id, 'MEMBER', 'BLOCKED'
FROM gyms g, users u
WHERE g.slug = 'crossfit-norte' AND u.email = 'bloqueado@test.com'
ON CONFLICT DO NOTHING;

SQL

echo "Insertando rutina Elian..."
eval "$PSQL_CMD" <<SQL
DO \$elian\$
DECLARE
    v_gym_id      BIGINT;
    v_creator_id  BIGINT := $REAL_USER;
    v_template_id BIGINT;
    v_block_id    BIGINT;
BEGIN
    SELECT id INTO v_gym_id FROM gyms WHERE slug = 'crossfit-norte';

    IF v_gym_id IS NULL THEN
        RAISE NOTICE 'Gym crossfit-norte no encontrado, omitiendo rutina Elian.';
        RETURN;
    END IF;

    IF EXISTS (SELECT 1 FROM routine_templates WHERE gym_id = v_gym_id AND name = 'Elian') THEN
        RAISE NOTICE 'Rutina Elian ya existe, omitiendo.';
        RETURN;
    END IF;

    INSERT INTO routine_templates (gym_id, name, description, created_by)
    VALUES (v_gym_id, 'Elian', 'Rutina Push/Pull 4 días', v_creator_id)
    RETURNING id INTO v_template_id;

    -- Día 1 – Pull
    INSERT INTO template_blocks (template_id, name, day_number, sort_order)
    VALUES (v_template_id, 'Día 1 – Pull', 1, 1)
    RETURNING id INTO v_block_id;

    INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
    (v_block_id, 'Jalón al pecho o dominadas asistidas', 4, '8-12', 1),
    (v_block_id, 'Remo con apoyo', 4, '8-10', 2),
    (v_block_id, 'Peso muerto rumano', 3, '8-10', 3),
    (v_block_id, 'Curl inclinado', 3, '10-12', 4),
    (v_block_id, 'Curl femoral', 3, '10-12', 5);

    -- Día 2 – Push
    INSERT INTO template_blocks (template_id, name, day_number, sort_order)
    VALUES (v_template_id, 'Día 2 – Push', 2, 2)
    RETURNING id INTO v_block_id;

    INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
    (v_block_id, 'Sentadilla', 4, '8-10', 1),
    (v_block_id, 'Prensa o zancadas', 3, '10-15', 2),
    (v_block_id, 'Press inclinado', 4, '8-10', 3),
    (v_block_id, 'Press hombros', 3, '8-10', 4),
    (v_block_id, 'Tríceps', 3, '10-12', 5),
    (v_block_id, 'Gemelos', 4, '12-15', 6);

    -- Día 3 – Pull (volumen)
    INSERT INTO template_blocks (template_id, name, day_number, sort_order)
    VALUES (v_template_id, 'Día 3 – Pull (volumen)', 3, 3)
    RETURNING id INTO v_block_id;

    INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
    (v_block_id, 'Jalón', 4, '10-12', 1),
    (v_block_id, 'Remo', 4, '10-12', 2),
    (v_block_id, 'Peso muerto rumano (más liviano)', 3, '10-12', 3),
    (v_block_id, 'Curl inclinado', 3, '12', 4),
    (v_block_id, 'Curl femoral', 3, '12-15', 5);

    -- Día 4 – Push (volumen)
    INSERT INTO template_blocks (template_id, name, day_number, sort_order)
    VALUES (v_template_id, 'Día 4 – Push (volumen)', 4, 4)
    RETURNING id INTO v_block_id;

    INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
    (v_block_id, 'Sentadilla', 3, '10', 1),
    (v_block_id, 'Prensa', 3, '12-15', 2),
    (v_block_id, 'Press inclinado', 4, '10-12', 3),
    (v_block_id, 'Press plano o máquina', 3, '10-12', 4),
    (v_block_id, 'Tríceps', 3, '12-15', 5),
    (v_block_id, 'Gemelos', 4, '15-20', 6);

    -- Asignación al usuario real: hoy → +3 meses
    INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
    VALUES (v_gym_id, v_template_id, v_creator_id, v_creator_id,
            '2026-04-30', '2026-07-30');

    RAISE NOTICE 'Rutina Elian creada (template_id=%)  con asignación 2026-04-30 → 2026-07-30', v_template_id;
END
\$elian\$;
SQL

echo ""
echo "Datos de prueba insertados:"
echo ""
eval "$PSQL_CMD" -c "
SELECT g.name, g.slug, g.status, COUNT(gm.id) as miembros
FROM gyms g LEFT JOIN gym_members gm ON g.id = gm.gym_id
GROUP BY g.id ORDER BY g.id;
"
eval "$PSQL_CMD" -c "
SELECT u.full_name, u.email, gm.role, gm.status, g.slug as gym
FROM gym_members gm
JOIN users u ON gm.user_id = u.id
JOIN gyms g ON gm.gym_id = g.id
ORDER BY g.slug, gm.role, u.full_name;
"

echo "Listo! Ahora logueate en http://localhost:3000"
echo "  Vas a ver 2 gyms (CrossFit Norte e Iron Gym Sur)"
echo "  CrossFit Norte tiene coaches, miembros, pendientes y bloqueados para probar"
