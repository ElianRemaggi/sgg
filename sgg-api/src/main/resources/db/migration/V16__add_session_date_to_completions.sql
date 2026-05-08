-- Agrega session_date a exercise_completions para permitir múltiples sesiones
-- del mismo ejercicio en la misma asignación (una por día).
-- Antes: UNIQUE(assignment_id, exercise_id, user_id) — upsert, solo 1 registro por ejercicio.
-- Ahora: UNIQUE(assignment_id, exercise_id, user_id, session_date) — 1 por ejercicio por día.

ALTER TABLE exercise_completions
    ADD COLUMN session_date DATE NOT NULL DEFAULT CURRENT_DATE;

UPDATE exercise_completions
SET session_date = DATE(completed_at);

DROP INDEX IF EXISTS idx_exercise_completions_unique;
CREATE UNIQUE INDEX idx_exercise_completions_unique
    ON exercise_completions(assignment_id, exercise_id, user_id, session_date);

CREATE INDEX idx_exercise_completions_exercise_progress
    ON exercise_completions(user_id, exercise_id, assignment_id, session_date);
