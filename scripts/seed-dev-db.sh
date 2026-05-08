#!/bin/bash
# ─── Seed BD de desarrollo ────────────────────────────────────────────────────
# Inserta usuarios, gym, plantillas, asignaciones y completions de prueba.
# Conecta al contenedor local (sgg-postgres-1), base de datos: sgg.
# Uso: ./scripts/seed-dev-db.sh

set -e

DB_CONTAINER="sgg-postgres-1"
DB_USER="sgg_admin"
DB_NAME="sgg"

PSQL="docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME"

echo "→ Insertando usuarios..."
$PSQL \
  -c "INSERT INTO users (full_name, email, username, platform_role, password_hash) VALUES
    ('Super Admin',  'superadmin@sgg.com', 'superadmin', 'SUPERADMIN', '\$2a\$10\$M.QEWfZS/ClA/Ss1y1GVGOZLtRlMcUW6oETOwuCOgoVJ0EuuEtPW6'),
    ('Owner Test',   'owner@sgg.com',      'owner',      'USER',       '\$2a\$10\$M.QEWfZS/ClA/Ss1y1GVGOZLtRlMcUW6oETOwuCOgoVJ0EuuEtPW6'),
    ('Coach Test',   'coach@sgg.com',      'coach',      'USER',       '\$2a\$10\$M.QEWfZS/ClA/Ss1y1GVGOZLtRlMcUW6oETOwuCOgoVJ0EuuEtPW6'),
    ('Member Test',  'member@sgg.com',     'member',     'USER',       '\$2a\$10\$M.QEWfZS/ClA/Ss1y1GVGOZLtRlMcUW6oETOwuCOgoVJ0EuuEtPW6'),
    ('Sol Polisiani','solpolisiani@gmail.com','solpolisiani','USER',    '\$2a\$10\$M.QEWfZS/ClA/Ss1y1GVGOZLtRlMcUW6oETOwuCOgoVJ0EuuEtPW6')
  ON CONFLICT (email) DO NOTHING;"

echo "→ Insertando gym..."
$PSQL \
  -c "INSERT INTO gyms (name, slug, description, owner_user_id, status)
    SELECT 'GymTest', 'gymtest', 'Gym de desarrollo y pruebas', id, 'ACTIVE'
    FROM users WHERE email = 'owner@sgg.com'
    ON CONFLICT (slug) DO NOTHING;"

echo "→ Insertando membresías..."
$PSQL \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'ADMIN', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'superadmin@sgg.com'
    ON CONFLICT DO NOTHING;" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'ADMIN', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'owner@sgg.com'
    ON CONFLICT DO NOTHING;" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'COACH', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'coach@sgg.com'
    ON CONFLICT DO NOTHING;" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'member@sgg.com'
    ON CONFLICT DO NOTHING;" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'solpolisiani@gmail.com'
    ON CONFLICT DO NOTHING;"

echo "→ Insertando plantillas y asignaciones..."
$PSQL -v ON_ERROR_STOP=1 <<'SQL'
DO $seed$
DECLARE
    v_gym_id    BIGINT;
    v_coach_id  BIGINT;
    v_member_id BIGINT;
    v_sol_id    BIGINT;
    v_owner_id  BIGINT;

    -- Plantilla Elian
    t_elian     BIGINT;
    b_pull1 BIGINT; b_push1 BIGINT; b_pull2 BIGINT; b_push2 BIGINT;
    ex_jalon  BIGINT; ex_remo_ap BIGINT; ex_pmr1 BIGINT; ex_curl_i1 BIGINT; ex_curl_f1 BIGINT;
    ex_sent1  BIGINT; ex_prensa1 BIGINT; ex_press_i1 BIGINT; ex_press_h BIGINT; ex_tri1 BIGINT; ex_gem1 BIGINT;
    ex_jalon2 BIGINT; ex_remo2 BIGINT; ex_pmr2 BIGINT; ex_curl_i2 BIGINT; ex_curl_f2 BIGINT;
    ex_sent2  BIGINT; ex_prensa2 BIGINT; ex_press_i2 BIGINT; ex_press_p BIGINT; ex_tri2 BIGINT; ex_gem2 BIGINT;

    -- Plantilla Mujer 3 dias
    t_mujer     BIGINT;
    b_m1 BIGINT; b_m2 BIGINT; b_m3 BIGINT;

    v_assign_member BIGINT;
    v_assign_owner  BIGINT;
    v_assign_sol    BIGINT;
BEGIN
    SELECT id INTO v_gym_id   FROM gyms  WHERE slug  = 'gymtest';
    SELECT id INTO v_coach_id FROM users WHERE email = 'coach@sgg.com';
    SELECT id INTO v_member_id FROM users WHERE email = 'member@sgg.com';
    SELECT id INTO v_sol_id   FROM users WHERE email = 'solpolisiani@gmail.com';
    SELECT id INTO v_owner_id FROM users WHERE email = 'owner@sgg.com';

    -- ═══ PLANTILLA ELIAN ═══
    IF NOT EXISTS (SELECT 1 FROM routine_templates WHERE gym_id = v_gym_id AND name = 'Elian') THEN

        INSERT INTO routine_templates (gym_id, name, description, created_by)
        VALUES (v_gym_id, 'Elian', 'Rutina Push/Pull 4 días', v_owner_id)
        RETURNING id INTO t_elian;

        -- Día 1 – Pull
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_elian, 'Día 1 – Pull', 1, 1) RETURNING id INTO b_pull1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull1, 'Jalón al pecho o dominadas asistidas', 4, '8-12', 1) RETURNING id INTO ex_jalon;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull1, 'Remo con apoyo', 4, '8-10', 2) RETURNING id INTO ex_remo_ap;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull1, 'Peso muerto rumano', 3, '8-10', 3) RETURNING id INTO ex_pmr1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull1, 'Curl inclinado', 3, '10-12', 4) RETURNING id INTO ex_curl_i1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull1, 'Curl femoral', 3, '10-12', 5) RETURNING id INTO ex_curl_f1;

        -- Día 2 – Push
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_elian, 'Día 2 – Push', 2, 2) RETURNING id INTO b_push1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Sentadilla', 4, '8-10', 1) RETURNING id INTO ex_sent1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Prensa o zancadas', 3, '10-15', 2) RETURNING id INTO ex_prensa1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Press inclinado', 4, '8-10', 3) RETURNING id INTO ex_press_i1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Press hombros', 3, '8-10', 4) RETURNING id INTO ex_press_h;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Tríceps', 3, '10-12', 5) RETURNING id INTO ex_tri1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push1, 'Gemelos', 4, '12-15', 6) RETURNING id INTO ex_gem1;

        -- Día 3 – Pull volumen
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_elian, 'Día 3 – Pull (volumen)', 3, 3) RETURNING id INTO b_pull2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull2, 'Jalón', 4, '10-12', 1) RETURNING id INTO ex_jalon2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull2, 'Remo', 4, '10-12', 2) RETURNING id INTO ex_remo2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull2, 'Peso muerto rumano (más liviano)', 3, '10-12', 3) RETURNING id INTO ex_pmr2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull2, 'Curl inclinado', 3, '12', 4) RETURNING id INTO ex_curl_i2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_pull2, 'Curl femoral', 3, '12-15', 5) RETURNING id INTO ex_curl_f2;

        -- Día 4 – Push volumen
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_elian, 'Día 4 – Push (volumen)', 4, 4) RETURNING id INTO b_push2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Sentadilla', 3, '10', 1) RETURNING id INTO ex_sent2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Prensa', 3, '12-15', 2) RETURNING id INTO ex_prensa2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Press inclinado', 4, '10-12', 3) RETURNING id INTO ex_press_i2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Press plano o máquina', 3, '10-12', 4) RETURNING id INTO ex_press_p;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Tríceps', 3, '12-15', 5) RETURNING id INTO ex_tri2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_push2, 'Gemelos', 4, '15-20', 6) RETURNING id INTO ex_gem2;

        -- Asignaciones Elian
        INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
        VALUES (v_gym_id, t_elian, v_owner_id, v_owner_id, '2026-04-30', '2026-07-30')
        RETURNING id INTO v_assign_owner;

        INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
        VALUES (v_gym_id, t_elian, v_member_id, v_coach_id, '2026-04-30', '2026-07-30')
        RETURNING id INTO v_assign_member;

        -- Completions member@sgg.com (historial real de sesiones)
        INSERT INTO exercise_completions (gym_id, assignment_id, exercise_id, user_id, session_date, is_completed, weight_kg, completed_at) VALUES
        (v_gym_id, v_assign_member, ex_remo_ap, v_member_id, '2026-04-30', false, NULL,   '2026-04-30 18:06:00'),
        (v_gym_id, v_assign_member, ex_curl_i1, v_member_id, '2026-04-30', false, NULL,   '2026-04-30 18:40:15'),
        (v_gym_id, v_assign_member, ex_curl_f1, v_member_id, '2026-04-30', false, NULL,   '2026-04-30 18:40:17'),
        (v_gym_id, v_assign_member, ex_sent1,   v_member_id, '2026-05-01', true,  100.00, '2026-05-01 01:45:50'),
        (v_gym_id, v_assign_member, ex_prensa1, v_member_id, '2026-05-01', true,  120.00, '2026-05-01 01:46:25'),
        (v_gym_id, v_assign_member, ex_press_i1,v_member_id, '2026-05-01', true,  50.00,  '2026-05-01 01:47:41'),
        (v_gym_id, v_assign_member, ex_press_h, v_member_id, '2026-05-01', true,  60.00,  '2026-05-01 01:47:44'),
        (v_gym_id, v_assign_member, ex_tri1,    v_member_id, '2026-05-01', true,  50.00,  '2026-05-01 01:47:48'),
        (v_gym_id, v_assign_member, ex_gem1,    v_member_id, '2026-05-01', true,  NULL,   '2026-05-01 01:47:50'),
        (v_gym_id, v_assign_member, ex_jalon2,  v_member_id, '2026-05-02', true,  60.00,  '2026-05-02 16:13:18'),
        (v_gym_id, v_assign_member, ex_remo2,   v_member_id, '2026-05-02', true,  60.00,  '2026-05-02 16:29:51'),
        (v_gym_id, v_assign_member, ex_pmr2,    v_member_id, '2026-05-02', true,  60.00,  '2026-05-02 16:39:21'),
        (v_gym_id, v_assign_member, ex_curl_i2, v_member_id, '2026-05-03', false, NULL,   '2026-05-03 03:36:55'),
        (v_gym_id, v_assign_member, ex_curl_f2, v_member_id, '2026-05-03', true,  5.00,   '2026-05-03 03:37:47'),
        (v_gym_id, v_assign_member, ex_sent1,   v_member_id, '2026-05-04', false, 2.00,   '2026-05-04 13:31:53'),
        (v_gym_id, v_assign_member, ex_jalon,   v_member_id, '2026-05-08', false, 60.00,  '2026-05-08 15:21:10');

        RAISE NOTICE 'Plantilla Elian creada.';
    ELSE
        RAISE NOTICE 'Plantilla Elian ya existe, saltando.';
    END IF;

    -- ═══ PLANTILLA MUJER 3 DIAS ═══
    IF NOT EXISTS (SELECT 1 FROM routine_templates WHERE gym_id = v_gym_id AND name = 'Mujer 3 dias') THEN

        INSERT INTO routine_templates (gym_id, name, description, created_by)
        VALUES (v_gym_id, 'Mujer 3 dias', 'Rutina femenina 3 días fullbody/split', v_coach_id)
        RETURNING id INTO t_mujer;

        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_mujer, 'Día 1', 1, 1) RETURNING id INTO b_m1;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_m1, 'Sentadilla goblet', 3, '12-15', 1),
        (b_m1, 'Hip thrust', 4, '12', 2),
        (b_m1, 'Prensa',     3, '12-15', 3);

        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_mujer, 'Día 2', 2, 2) RETURNING id INTO b_m2;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_m2, 'Press mancuernas', 3, '10-12', 1),
        (b_m2, 'Remo polea',       3, '10-12', 2),
        (b_m2, 'Elevaciones laterales', 3, '12-15', 3);

        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_mujer, 'Día 3', 3, 3) RETURNING id INTO b_m3;
        INSERT INTO template_exercises (block_id, name, sets, reps, sort_order) VALUES
        (b_m3, 'Peso muerto', 3, '8-10', 1),
        (b_m3, 'Curl femoral máquina', 3, '12', 2),
        (b_m3, 'Abductores',  3, '15', 3);

        -- Asignación Sol
        INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
        VALUES (v_gym_id, t_mujer, v_sol_id, v_coach_id, '2026-05-01', '2026-07-01')
        RETURNING id INTO v_assign_sol;

        RAISE NOTICE 'Plantilla Mujer 3 dias creada.';
    ELSE
        RAISE NOTICE 'Plantilla Mujer 3 dias ya existe, saltando.';
    END IF;

END
$seed$;
SQL

echo ""
echo "✓ Seed completado. Resumen:"
echo ""
$PSQL -c "
SELECT 'users'                as tabla, COUNT(*) as total FROM users
UNION ALL SELECT 'gyms',               COUNT(*) FROM gyms
UNION ALL SELECT 'gym_members',        COUNT(*) FROM gym_members
UNION ALL SELECT 'routine_templates',  COUNT(*) FROM routine_templates
UNION ALL SELECT 'routine_assignments',COUNT(*) FROM routine_assignments
UNION ALL SELECT 'exercise_completions',COUNT(*) FROM exercise_completions;
"
echo ""
echo "Credenciales (contraseña: p1qwas?):"
echo "  superadmin@sgg.com      → SUPERADMIN + ADMIN en GymTest"
echo "  owner@sgg.com           → ADMIN en GymTest  (tiene rutina Elian asignada)"
echo "  coach@sgg.com           → COACH en GymTest"
echo "  member@sgg.com          → MEMBER (16 completions en 5 fechas distintas)"
echo "  solpolisiani@gmail.com  → MEMBER (rutina Mujer 3 dias)"
echo ""
echo "Abrí http://localhost:3000"
