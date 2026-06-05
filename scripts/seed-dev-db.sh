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
    AND NOT EXISTS (SELECT 1 FROM gym_members WHERE gym_id=g.id AND user_id=u.id);" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'ADMIN', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'owner@sgg.com'
    AND NOT EXISTS (SELECT 1 FROM gym_members WHERE gym_id=g.id AND user_id=u.id);" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'COACH', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'coach@sgg.com'
    AND NOT EXISTS (SELECT 1 FROM gym_members WHERE gym_id=g.id AND user_id=u.id);" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'member@sgg.com'
    AND NOT EXISTS (SELECT 1 FROM gym_members WHERE gym_id=g.id AND user_id=u.id);" \
  -c "INSERT INTO gym_members (gym_id, user_id, role, status)
    SELECT g.id, u.id, 'MEMBER', 'ACTIVE'
    FROM gyms g, users u WHERE g.slug = 'gymtest' AND u.email = 'solpolisiani@gmail.com'
    AND NOT EXISTS (SELECT 1 FROM gym_members WHERE gym_id=g.id AND user_id=u.id);"

echo "→ Insertando plantillas y asignaciones..."
cat <<'SQL' | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
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

    -- Plantilla Rutina Sol
    t_sol       BIGINT;
    b_s1 BIGINT; b_s2 BIGINT; b_s3 BIGINT;

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

    -- ═══ PLANTILLA RUTINA SOL – 3 DÍAS ═══
    IF NOT EXISTS (SELECT 1 FROM routine_templates WHERE gym_id = v_gym_id AND name = 'Rutina Sol') THEN

        INSERT INTO routine_templates (gym_id, name, description, created_by)
        VALUES (v_gym_id, 'Rutina Sol', 'Glúteos, cuádriceps y tren superior – 3 días', v_coach_id)
        RETURNING id INTO t_sol;

        -- Día 1 – Glúteos + Cuádriceps (Pesado)
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_sol, 'Día 1 – Glúteos + Cuádriceps (Pesado)', 1, 1) RETURNING id INTO b_s1;
        INSERT INTO template_exercises (block_id, name, sets, reps, notes, sort_order) VALUES
        (b_s1, 'Hip Thrust',                      4, '6-8',         'Pesado. Pausa 1 seg arriba. Descanso 2-3 min',              1),
        (b_s1, 'Hacka (sentadilla hack)',           4, '6-8',         'Espalda bien apoyada. Talones firmes',                      2),
        (b_s1, 'Prensa inclinada',                 3, '10-12',       'Pies medios/altos (activa más glúteo)',                     3),
        (b_s1, 'Estocada estática',                3, '10-12 c/p',   'Paso largo. Bajar vertical. Mano en cadera si hace falta',  4),
        (b_s1, 'Abductora',                        3, '15-20',       'Control total, nada de impulso',                            5),
        (b_s1, 'Crunch en polea',                  3, '15',          NULL,                                                        6),
        (b_s1, 'Plancha',                          3, '40-60 seg',   NULL,                                                        7);

        -- Día 2 – Tren Superior + Abdomen (Estético)
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_sol, 'Día 2 – Tren Superior + Abdomen (Estético)', 2, 2) RETURNING id INTO b_s2;
        INSERT INTO template_exercises (block_id, name, sets, reps, notes, sort_order) VALUES
        (b_s2, 'Jalón al pecho',                   4, '8-10',        'Agarre abierto',                                            1),
        (b_s2, 'Remo sentado',                     3, '10',          'Escápulas al final',                                        2),
        (b_s2, 'Press militar con mancuernas',     3, '10',          'No arquear lumbar',                                         3),
        (b_s2, 'Elevaciones laterales',            3, '15',          'Livianas, puras',                                           4),
        (b_s2, 'Curl de bíceps',                   3, '12',          'Barra o mancuerna',                                         5),
        (b_s2, 'Tríceps en polea',                 3, '12',          'Codo fijo',                                                 6),
        (b_s2, 'Elevación de piernas',             3, '12-15',       'Colgado o en suelo',                                        7),
        (b_s2, 'Russian twists o woodchopper',     3, '15 c/lado',   NULL,                                                        8);

        -- Día 3 – Glúteos + Femorales (Pesado)
        INSERT INTO template_blocks (template_id, name, day_number, sort_order)
        VALUES (t_sol, 'Día 3 – Glúteos + Femorales (Pesado)', 3, 3) RETURNING id INTO b_s3;
        INSERT INTO template_exercises (block_id, name, sets, reps, notes, sort_order) VALUES
        (b_s3, 'Peso muerto rumano',               4, '8',           'Espalda recta. Rodilla suave',                              1),
        (b_s3, 'Hip Thrust pausado',               3, '10',          'Pausa de 2 segundos arriba',                                2),
        (b_s3, 'Curl femoral',                     4, '10-12',       'Control en excéntrica',                                     3),
        (b_s3, 'Sentadilla sumo con mancuerna',    3, '10-12',       'Abierto de piernas. Torso recto',                           4),
        (b_s3, 'Patada de glúteo en polea',        3, '15-20',       'Sin balanceo',                                              5),
        (b_s3, 'Abductora inclinada hacia adelante', 3, '20',        'Torso levemente inclinado',                                 6);

        -- Asignación a Sol
        INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
        VALUES (v_gym_id, t_sol, v_sol_id, v_coach_id, '2026-05-28', '2026-08-28');

        RAISE NOTICE 'Plantilla Rutina Sol creada.';
    ELSE
        RAISE NOTICE 'Plantilla Rutina Sol ya existe, saltando.';
    END IF;

END
$seed$;
SQL

echo "→ Generando historial de 6 meses para member@sgg.com..."
cat <<'SQL' | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
DO $history$
DECLARE
    v_gym_id      BIGINT;
    v_member_id   BIGINT;
    v_coach_id    BIGINT;
    t_elian       BIGINT;
    v_assign_hist BIGINT;

    -- Ejercicios Día 1 (Pull fuerza)
    ex_d1_jalon   BIGINT; ex_d1_remo  BIGINT; ex_d1_pmr   BIGINT;
    ex_d1_curl_i  BIGINT; ex_d1_curl_f BIGINT;
    -- Ejercicios Día 2 (Push fuerza)
    ex_d2_sent    BIGINT; ex_d2_prensa BIGINT; ex_d2_press_i BIGINT;
    ex_d2_press_h BIGINT; ex_d2_tri    BIGINT; ex_d2_gem     BIGINT;
    -- Ejercicios Día 3 (Pull volumen)
    ex_d3_jalon   BIGINT; ex_d3_remo   BIGINT; ex_d3_pmr    BIGINT;
    ex_d3_curl_i  BIGINT; ex_d3_curl_f  BIGINT;
    -- Ejercicios Día 4 (Push volumen)
    ex_d4_sent    BIGINT; ex_d4_prensa BIGINT; ex_d4_press_i BIGINT;
    ex_d4_press_p BIGINT; ex_d4_tri    BIGINT; ex_d4_gem     BIGINT;

    -- Calendario: ~65 sesiones Nov 2025 – Abr 2026, ~3/semana
    sessions DATE[] := ARRAY[
        '2025-11-10'::DATE,'2025-11-12','2025-11-14',
        '2025-11-17','2025-11-19','2025-11-21',
        '2025-11-24','2025-11-26',
        '2025-12-01','2025-12-03','2025-12-05',
        '2025-12-08','2025-12-10','2025-12-12',
        '2025-12-15','2025-12-17','2025-12-19',
        '2025-12-22','2025-12-29',
        '2026-01-05','2026-01-07','2026-01-09',
        '2026-01-12','2026-01-14','2026-01-16',
        '2026-01-19','2026-01-21','2026-01-23',
        '2026-01-26','2026-01-28','2026-01-30',
        '2026-02-02','2026-02-04','2026-02-06',
        '2026-02-09','2026-02-11','2026-02-13',
        '2026-02-16','2026-02-18',
        '2026-02-23','2026-02-25','2026-02-27',
        '2026-03-02','2026-03-04','2026-03-06',
        '2026-03-09','2026-03-11','2026-03-13',
        '2026-03-16','2026-03-18','2026-03-20',
        '2026-03-23','2026-03-25','2026-03-27',
        '2026-04-01','2026-04-03',
        '2026-04-06','2026-04-08','2026-04-10',
        '2026-04-13','2026-04-15','2026-04-17',
        '2026-04-22','2026-04-24','2026-04-28'
    ];

    v_total INT; v_idx INT; v_sess DATE;
    v_prog  NUMERIC; -- 0..1
    v_noise NUMERIC; -- fluctuación: deloads + PRs
    v_day   INT;     -- 1..4 ciclo de días
    v_hour  INT;     -- 7 mañana / 19 tarde

    -- Pesos calculados por sesión
    w_jalon NUMERIC; w_remo    NUMERIC; w_pmr     NUMERIC;
    w_curl_i NUMERIC; w_curl_f NUMERIC;
    w_sent  NUMERIC; w_prensa  NUMERIC; w_press_i NUMERIC;
    w_press_h NUMERIC; w_tri   NUMERIC; w_press_p NUMERIC;
BEGIN
    SELECT id INTO v_gym_id    FROM gyms  WHERE slug  = 'gymtest';
    SELECT id INTO v_member_id FROM users WHERE email = 'member@sgg.com';
    SELECT id INTO v_coach_id  FROM users WHERE email = 'coach@sgg.com';
    SELECT id INTO t_elian     FROM routine_templates
                                WHERE gym_id = v_gym_id AND name = 'Elian';

    IF t_elian IS NULL THEN
        RAISE EXCEPTION 'Plantilla Elian no encontrada — ejecutá el seed principal primero.';
    END IF;

    -- Lookup por sort_order para independencia de nombres
    SELECT te.id INTO ex_d1_jalon   FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=1 AND te.sort_order=1;
    SELECT te.id INTO ex_d1_remo    FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=1 AND te.sort_order=2;
    SELECT te.id INTO ex_d1_pmr     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=1 AND te.sort_order=3;
    SELECT te.id INTO ex_d1_curl_i  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=1 AND te.sort_order=4;
    SELECT te.id INTO ex_d1_curl_f  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=1 AND te.sort_order=5;

    SELECT te.id INTO ex_d2_sent    FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=1;
    SELECT te.id INTO ex_d2_prensa  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=2;
    SELECT te.id INTO ex_d2_press_i FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=3;
    SELECT te.id INTO ex_d2_press_h FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=4;
    SELECT te.id INTO ex_d2_tri     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=5;
    SELECT te.id INTO ex_d2_gem     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=2 AND te.sort_order=6;

    SELECT te.id INTO ex_d3_jalon   FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=3 AND te.sort_order=1;
    SELECT te.id INTO ex_d3_remo    FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=3 AND te.sort_order=2;
    SELECT te.id INTO ex_d3_pmr     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=3 AND te.sort_order=3;
    SELECT te.id INTO ex_d3_curl_i  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=3 AND te.sort_order=4;
    SELECT te.id INTO ex_d3_curl_f  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=3 AND te.sort_order=5;

    SELECT te.id INTO ex_d4_sent    FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=1;
    SELECT te.id INTO ex_d4_prensa  FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=2;
    SELECT te.id INTO ex_d4_press_i FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=3;
    SELECT te.id INTO ex_d4_press_p FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=4;
    SELECT te.id INTO ex_d4_tri     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=5;
    SELECT te.id INTO ex_d4_gem     FROM template_exercises te JOIN template_blocks tb ON te.block_id=tb.id WHERE tb.template_id=t_elian AND tb.day_number=4 AND te.sort_order=6;

    IF EXISTS (
        SELECT 1 FROM routine_assignments
        WHERE gym_id = v_gym_id AND member_user_id = v_member_id
          AND starts_at::DATE = '2025-11-10'
    ) THEN
        RAISE NOTICE 'Historial ya existe, saltando.';
        RETURN;
    END IF;

    INSERT INTO routine_assignments (gym_id, template_id, member_user_id, assigned_by, starts_at, ends_at)
    VALUES (v_gym_id, t_elian, v_member_id, v_coach_id,
            '2025-11-10 00:00:00', '2026-04-29 23:59:59')
    RETURNING id INTO v_assign_hist;

    v_total := array_length(sessions, 1);

    FOR v_idx IN 1..v_total LOOP
        v_sess := sessions[v_idx];
        v_prog := (v_idx - 1.0) / (v_total - 1.0);  -- 0 en sesión 1, 1 en la última
        v_day  := ((v_idx - 1) % 4) + 1;

        -- Semanas de deload (sesiones 10-12, 22-24, 34-36, 46-48, 58-60): -5%
        -- PRs ocasionales (múltiplos de 11): +4%
        v_noise := CASE
            WHEN v_idx IN (10,11,12, 22,23,24, 34,35,36, 46,47,48, 58,59,60) THEN -0.05
            WHEN v_idx % 11 = 0 THEN  0.04
            ELSE 0.0
        END;

        -- Turno: mañana cada 3 sesiones, tarde el resto
        v_hour := CASE WHEN v_idx % 3 = 0 THEN 7 ELSE 19 END;

        -- ── Pesos: base → tope en 6 meses, redondeados a incremento de gym ──
        -- Jalón/Remo:   40→65 kg  (+25), step 2.5
        -- PMR:          50→80 kg  (+30), step 5
        -- Curl incl.:    6→12 kg  (+6),  step 2
        -- Curl fem.:     8→16 kg  (+8),  step 2
        -- Sentadilla:   60→95 kg  (+35), step 5
        -- Prensa:       80→120 kg (+40), step 5
        -- Press incl.:  30→50 kg  (+20), step 2.5
        -- Press hombros:30→45 kg  (+15), step 2.5
        -- Tríceps:      20→35 kg  (+15), step 2.5
        -- Press plano:  30→50 kg  (+20), step 2.5
        w_jalon   := GREATEST(40,  ROUND((40  + v_prog*25) * (1+v_noise) / 2.5) * 2.5);
        w_remo    := GREATEST(40,  ROUND((40  + v_prog*25) * (1+v_noise) / 2.5) * 2.5);
        w_pmr     := GREATEST(50,  ROUND((50  + v_prog*30) * (1+v_noise) / 5)   * 5);
        w_curl_i  := GREATEST(6,   ROUND((6   + v_prog*6)  * (1+v_noise) / 2)   * 2);
        w_curl_f  := GREATEST(8,   ROUND((8   + v_prog*8)  * (1+v_noise) / 2)   * 2);
        w_sent    := GREATEST(60,  ROUND((60  + v_prog*35) * (1+v_noise) / 5)   * 5);
        w_prensa  := GREATEST(80,  ROUND((80  + v_prog*40) * (1+v_noise) / 5)   * 5);
        w_press_i := GREATEST(30,  ROUND((30  + v_prog*20) * (1+v_noise) / 2.5) * 2.5);
        w_press_h := GREATEST(30,  ROUND((30  + v_prog*15) * (1+v_noise) / 2.5) * 2.5);
        w_tri     := GREATEST(20,  ROUND((20  + v_prog*15) * (1+v_noise) / 2.5) * 2.5);
        w_press_p := GREATEST(30,  ROUND((30  + v_prog*20) * (1+v_noise) / 2.5) * 2.5);

        -- completed_at: fecha + hora de turno + offset por ejercicio (5→65 min) + variación
        -- Días de volumen usan base de peso ~85% del día principal (base más liviana)

        IF v_day = 1 THEN  -- ── Pull fuerza ────────────────────────────────
            INSERT INTO exercise_completions
                (gym_id, assignment_id, exercise_id, user_id, session_date, is_completed, weight_kg, completed_at)
            VALUES
                (v_gym_id, v_assign_hist, ex_d1_jalon,   v_member_id, v_sess, true, w_jalon,   v_sess::TIMESTAMP + (v_hour*60 +  5 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d1_remo,    v_member_id, v_sess, true, w_remo,    v_sess::TIMESTAMP + (v_hour*60 + 20 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d1_pmr,     v_member_id, v_sess, true, w_pmr,     v_sess::TIMESTAMP + (v_hour*60 + 35 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d1_curl_i,  v_member_id, v_sess, true, w_curl_i,  v_sess::TIMESTAMP + (v_hour*60 + 50 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d1_curl_f,  v_member_id, v_sess, true, w_curl_f,  v_sess::TIMESTAMP + (v_hour*60 + 65 + v_idx%8) * INTERVAL '1 minute');

        ELSIF v_day = 2 THEN  -- ── Push fuerza ──────────────────────────────
            INSERT INTO exercise_completions
                (gym_id, assignment_id, exercise_id, user_id, session_date, is_completed, weight_kg, completed_at)
            VALUES
                (v_gym_id, v_assign_hist, ex_d2_sent,    v_member_id, v_sess, true, w_sent,    v_sess::TIMESTAMP + (v_hour*60 +  5 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d2_prensa,  v_member_id, v_sess, true, w_prensa,  v_sess::TIMESTAMP + (v_hour*60 + 20 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d2_press_i, v_member_id, v_sess, true, w_press_i, v_sess::TIMESTAMP + (v_hour*60 + 35 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d2_press_h, v_member_id, v_sess, true, w_press_h, v_sess::TIMESTAMP + (v_hour*60 + 50 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d2_tri,     v_member_id, v_sess, true, w_tri,     v_sess::TIMESTAMP + (v_hour*60 + 65 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d2_gem,     v_member_id, v_sess, true, NULL,      v_sess::TIMESTAMP + (v_hour*60 + 78 + v_idx%8) * INTERVAL '1 minute');

        ELSIF v_day = 3 THEN  -- ── Pull volumen (base más liviana) ──────────
            INSERT INTO exercise_completions
                (gym_id, assignment_id, exercise_id, user_id, session_date, is_completed, weight_kg, completed_at)
            VALUES
                (v_gym_id, v_assign_hist, ex_d3_jalon,   v_member_id, v_sess, true,
                    GREATEST(35, ROUND((35 + v_prog*25) * (1+v_noise) / 2.5) * 2.5),
                    v_sess::TIMESTAMP + (v_hour*60 +  5 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d3_remo,    v_member_id, v_sess, true,
                    GREATEST(35, ROUND((35 + v_prog*25) * (1+v_noise) / 2.5) * 2.5),
                    v_sess::TIMESTAMP + (v_hour*60 + 20 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d3_pmr,     v_member_id, v_sess, true,
                    GREATEST(40, ROUND((40 + v_prog*30) * (1+v_noise) / 5) * 5),
                    v_sess::TIMESTAMP + (v_hour*60 + 35 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d3_curl_i,  v_member_id, v_sess, true, w_curl_i,
                    v_sess::TIMESTAMP + (v_hour*60 + 50 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d3_curl_f,  v_member_id, v_sess, true, w_curl_f,
                    v_sess::TIMESTAMP + (v_hour*60 + 65 + v_idx%8) * INTERVAL '1 minute');

        ELSIF v_day = 4 THEN  -- ── Push volumen (base más liviana) ──────────
            INSERT INTO exercise_completions
                (gym_id, assignment_id, exercise_id, user_id, session_date, is_completed, weight_kg, completed_at)
            VALUES
                (v_gym_id, v_assign_hist, ex_d4_sent,    v_member_id, v_sess, true,
                    GREATEST(50, ROUND((50 + v_prog*30) * (1+v_noise) / 5) * 5),
                    v_sess::TIMESTAMP + (v_hour*60 +  5 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d4_prensa,  v_member_id, v_sess, true,
                    GREATEST(70, ROUND((70 + v_prog*40) * (1+v_noise) / 5) * 5),
                    v_sess::TIMESTAMP + (v_hour*60 + 20 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d4_press_i, v_member_id, v_sess, true,
                    GREATEST(25, ROUND((25 + v_prog*20) * (1+v_noise) / 2.5) * 2.5),
                    v_sess::TIMESTAMP + (v_hour*60 + 35 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d4_press_p, v_member_id, v_sess, true, w_press_p,
                    v_sess::TIMESTAMP + (v_hour*60 + 50 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d4_tri,     v_member_id, v_sess, true,
                    GREATEST(18, ROUND((18 + v_prog*12) * (1+v_noise) / 2.5) * 2.5),
                    v_sess::TIMESTAMP + (v_hour*60 + 65 + v_idx%8) * INTERVAL '1 minute'),
                (v_gym_id, v_assign_hist, ex_d4_gem,     v_member_id, v_sess, true, NULL,
                    v_sess::TIMESTAMP + (v_hour*60 + 78 + v_idx%8) * INTERVAL '1 minute');
        END IF;
    END LOOP;

    RAISE NOTICE 'Historial generado: % sesiones, ~% completions.',
        v_total, v_total * 5;
END
$history$;
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
echo "Credenciales (contraseña: p1qwas):"
echo "  superadmin@sgg.com      → SUPERADMIN + ADMIN en GymTest"
echo "  owner@sgg.com           → ADMIN en GymTest  (tiene rutina Elian asignada)"
echo "  coach@sgg.com           → COACH en GymTest"
echo "  member@sgg.com          → MEMBER (historial 6 meses: 65 sesiones, ~330 completions)"
echo "  solpolisiani@gmail.com  → MEMBER (rutinas: Mujer 3 dias + Rutina Sol)"
echo ""
echo "Abrí http://localhost:3000"
