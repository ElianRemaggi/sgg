# Módulo: Tracking
**Package:** `com.sgg.tracking`
**Responsabilidad:** Registro de ejercicios completados. Toggle simple true/false por ejercicio.

---

## Entidades

### ExerciseCompletion

```sql
CREATE TABLE exercise_completions (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    assignment_id   BIGINT NOT NULL REFERENCES routine_assignments(id),
    exercise_id     BIGINT NOT NULL REFERENCES template_exercises(id),
    user_id         BIGINT NOT NULL REFERENCES users(id),
    is_completed    BOOLEAN NOT NULL DEFAULT TRUE,
    completed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, exercise_id, user_id)
);

CREATE INDEX idx_exercise_completions_assignment ON exercise_completions(assignment_id);
CREATE INDEX idx_exercise_completions_gym ON exercise_completions(gym_id);
CREATE INDEX idx_exercise_completions_user_date ON exercise_completions(user_id, completed_at);
```

---

## Endpoints

### POST /api/gyms/{gymId}/member/tracking/complete
**Auth:** MEMBER
**Request body:**
```json
{ "assignmentId": 3, "exerciseId": 7 }
```
**Lógica:** Upsert en `exercise_completions` con `is_completed = true`. Si ya existe, actualiza `updated_at`.

---

### POST /api/gyms/{gymId}/member/tracking/undo
**Auth:** MEMBER
**Request body:**
```json
{ "assignmentId": 3, "exerciseId": 7 }
```
**Lógica:** Setea `is_completed = false` en el registro existente. Si no existe, no hacer nada (idempotente).

---

### GET /api/gyms/{gymId}/member/tracking/progress
**Auth:** MEMBER
**Descripción:** Progreso actual del member en su rutina activa.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "assignmentId": 3,
    "totalExercises": 24,
    "completedToday": 6,
    "completedTotal": 18,
    "progressPercent": 75,
    "lastActivityAt": "2026-02-10T10:30:00"
  }
}
```

---

### GET /api/gyms/{gymId}/coach/tracking/{memberId}
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** El coach ve el progreso de uno de sus miembros asignados.
**Validación:** El coach está asignado a ese member (o es ADMIN).

---

## Tests de Integración
```
✅ POST /complete — marca ejercicio como completado: 200
✅ POST /complete — doble complete (idempotente): 200, no duplica
✅ POST /complete — exerciseId no pertenece a la asignación: 400
✅ POST /undo — desmarca: 200
✅ POST /undo — undo sin registro previo (idempotente): 200
✅ GET /progress — retorna métricas correctas
✅ GET /coach/tracking/{memberId} — coach ve progreso de su asignado
✅ GET /coach/tracking/{memberId} — coach ve a member no asignado: 403
✅ Tenant isolation: member no puede hacer tracking en gym ajeno
```

---

## Notas de Implementación

- El constraint UNIQUE en `(assignment_id, exercise_id, user_id)` garantiza no duplicar. Usar `INSERT ... ON CONFLICT DO UPDATE`.
- `is_completed = false` es el "undo" — se mantiene el registro para historial pero con flag en false.
- El módulo `training` usa `exercise_completions` para enriquecer la vista de rutina del member (`isCompleted`). Esto se puede resolver con una query JOIN o un servicio de tracking que exponga un método `getCompletedExerciseIds(assignmentId, userId)`.
