# Módulo: Tracking
**Package:** `com.sgg.tracking`
**Responsabilidad:** Registro de ejercicios completados (con datos de peso/reps/notas). Progreso del member en su rutina activa. Historial de rutinas y progresión de ejercicios a lo largo del tiempo.

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
    session_date    DATE NOT NULL DEFAULT CURRENT_DATE,    -- V16: fecha de la sesión
    is_completed    BOOLEAN NOT NULL DEFAULT TRUE,
    weight_kg       NUMERIC(6,2),                          -- opcional
    actual_reps     INTEGER,                               -- opcional
    notes           TEXT,                                  -- opcional, max 500 chars
    completed_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 1 completion por ejercicio por día por asignación (V16)
CREATE UNIQUE INDEX idx_exercise_completions_unique
    ON exercise_completions(assignment_id, exercise_id, user_id, session_date);

CREATE INDEX idx_exercise_completions_assignment ON exercise_completions(assignment_id);
CREATE INDEX idx_exercise_completions_gym        ON exercise_completions(gym_id);
CREATE INDEX idx_exercise_completions_user_date  ON exercise_completions(user_id, completed_at);
CREATE INDEX idx_exercise_completions_exercise_progress
    ON exercise_completions(user_id, exercise_id, assignment_id, session_date);
```

**Diseño clave:** El constraint UNIQUE es `(assignment_id, exercise_id, user_id, session_date)` — un member puede registrar el mismo ejercicio en días distintos dentro de la misma asignación, lo que permite trackear la progresión de peso a lo largo del tiempo.

---

## Endpoints — Tracking (TrackingController)

### POST /api/gyms/{gymId}/member/tracking/complete
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Registrar (o actualizar) la completion de un ejercicio para hoy.

**Request body:**
```json
{
  "assignmentId": 3,
  "exerciseId": 7,
  "weightKg": 80.5,
  "actualReps": 10,
  "notes": "Buen día, subí peso"
}
```

**Validaciones:**
- `assignmentId`: `@NotNull`
- `exerciseId`: `@NotNull`
- `weightKg`: `@DecimalMin("0.0")` (opcional)
- `actualReps`: `@Min(0)` (opcional)
- `notes`: `@Size(max=500)` (opcional)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "exerciseId": 7,
    "isCompleted": true,
    "weightKg": 80.5,
    "actualReps": 10,
    "notes": "Buen día, subí peso",
    "completedAt": "2026-05-31T10:30:00"
  }
}
```

**Lógica:**
1. Verificar que el member tiene una asignación activa en el gym
2. Verificar que el `assignmentId` del request corresponde a esa asignación activa
3. Verificar que `exerciseId` pertenece a la plantilla de la asignación
4. Buscar completion de hoy (`session_date = TODAY`): si existe, actualizar; si no, crear
5. Setear `is_completed = true`, guardar peso/reps/notas

---

### POST /api/gyms/{gymId}/member/tracking/undo
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Desmarcar un ejercicio completado hoy.

**Request body:**
```json
{ "assignmentId": 3, "exerciseId": 7 }
```

**Response 200:** `ApiResponse<Void>`

**Lógica:** Buscar completion de hoy → setear `is_completed = false`. Si no existe, no hacer nada (idempotente).

---

### GET /api/gyms/{gymId}/member/tracking/progress
**Auth:** MEMBER | SUPERADMIN
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
    "progressPercent": 25,
    "lastActivityAt": "2026-05-31T10:30:00",
    "completions": [
      {
        "exerciseId": 7,
        "isCompleted": true,
        "weightKg": 80.5,
        "actualReps": 10,
        "notes": "Buen día",
        "completedAt": "2026-05-31T10:30:00"
      }
    ],
    "previousNotesByExerciseId": {
      "5": "Serie pesada ayer",
      "9": "Sentí el hombro"
    }
  }
}
```

**Nota sobre `progressPercent`:** se calcula como `completedToday / totalExercises * 100` (completados HOY sobre el total de ejercicios de la plantilla).

**`completions`:** solo las completions de HOY con `is_completed = true`, para el día actual del member.

**`previousNotesByExerciseId`:** mapa de `exerciseId → notes` de la última sesión anterior de cada ejercicio (para mostrar notas previas como placeholder). Solo incluye ejercicios que tienen notas históricas.

---

### GET /api/gyms/{gymId}/coach/tracking/{memberId}
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** El coach ve el progreso de un member específico.
**Response 200:** igual a `/member/tracking/progress`

---

## Endpoints — Historial (MemberHistoryController)

### GET /api/gyms/{gymId}/member/history/assignments
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Lista todas las asignaciones (activas y pasadas) del member, con estadísticas agregadas. Paginado.
**Query params:** `?page=0&size=20`

**Response 200:** `PageResponse<AssignmentHistorySummaryDto>`
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 3,
        "templateName": "Fuerza 5x5",
        "startsAt": "2026-01-01T00:00:00",
        "endsAt": "2026-01-31T23:59:59",
        "isActive": false,
        "totalSessionDays": 12,
        "totalCompletions": 180,
        "lastActivityAt": "2026-01-28T09:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1,
    "last": true
  }
}
```

`CoachHistoryController.getMemberHistory` (`GET .../coach/history/{memberId}/assignments`) usa el mismo `PageResponse<AssignmentHistorySummaryDto>` y los mismos query params.

**`isActive`:** `startsAt < now AND (endsAt IS NULL OR endsAt > now)`
**`totalSessionDays`:** cantidad de días distintos en que completó al menos un ejercicio
**`totalCompletions`:** total de completions con `is_completed = true` en esa asignación

---

### GET /api/gyms/{gymId}/member/history/assignments/{assignmentId}
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Detalle de una asignación: bloques, ejercicios y resumen por ejercicio.

**Validación:** El `assignmentId` debe pertenecer al member autenticado y al gym del path.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "templateName": "Fuerza 5x5",
    "startsAt": "2026-01-01T00:00:00",
    "endsAt": "2026-01-31T23:59:59",
    "isActive": false,
    "blocks": [
      {
        "id": 10,
        "name": "Pecho y Tríceps",
        "dayNumber": 1,
        "exercises": [
          {
            "exerciseId": 7,
            "name": "Press de banca",
            "sessionsCount": 12,
            "bestWeightKg": 100.00,
            "avgWeightKg": 90.50,
            "lastWeightKg": 95.00
          }
        ]
      }
    ],
    "stats": {
      "totalDistinctDays": 12,
      "totalCompletions": 180,
      "firstActivityAt": "2026-01-03T09:00:00",
      "lastActivityAt": "2026-01-28T09:00:00"
    }
  }
}
```

**`sessionsCount`:** número de días distintos en que completó el ejercicio
**`bestWeightKg/avgWeightKg/lastWeightKg`:** solo sobre sesiones completadas con peso registrado; `null` si no hay peso

---

### GET /api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Progresión histórica de un ejercicio específico en una asignación.

**Validaciones:**
- El `assignmentId` pertenece al member y al gym
- El `exerciseId` pertenece a la plantilla de esa asignación

**Response 200:**
```json
{
  "success": true,
  "data": {
    "exerciseId": 7,
    "exerciseName": "Press de banca",
    "blockName": "Pecho y Tríceps",
    "dayNumber": 1,
    "sessions": [
      {
        "sessionDate": "2026-01-03",
        "weightKg": 80.00,
        "actualReps": 5,
        "notes": null,
        "isCompleted": true,
        "completedAt": "2026-01-03T09:15:00"
      }
    ],
    "stats": {
      "sessionsCount": 12,
      "bestWeightKg": 100.00,
      "avgWeightKg": 90.50,
      "firstWeightKg": 80.00,
      "lastWeightKg": 95.00,
      "deltaPercent": 18.75
    }
  }
}
```

**`sessions`:** ordenadas por `session_date ASC`, incluye tanto completadas como no completadas
**`deltaPercent`:** `(lastWeight - firstWeight) / firstWeight * 100`. Null si no hay datos de peso o si `firstWeight == 0`

---

## Endpoints — Historial Coach (CoachHistoryController)

Los mismos 3 endpoints pero accesibles al coach, con el `memberId` como path variable:

```
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}/exercises/{exerciseId}
```

**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** Misma lógica que los endpoints de member, pero el `userId` que se usa es `memberId` (no el autenticado). El coach puede ver el historial de cualquier member de su gym.

---

## DTOs

```java
// Request
public record CompleteExerciseRequest(
    @NotNull Long assignmentId,
    @NotNull Long exerciseId,
    @DecimalMin("0.0") BigDecimal weightKg,   // opcional
    @Min(0) Integer actualReps,               // opcional
    @Size(max=500) String notes               // opcional
) {}

public record UndoExerciseRequest(
    @NotNull Long assignmentId,
    @NotNull Long exerciseId
) {}

// Response tracking diario
public record ExerciseCompletionDto(
    Long exerciseId,
    boolean isCompleted,
    BigDecimal weightKg,
    Integer actualReps,
    String notes,
    LocalDateTime completedAt
) {}

public record TrackingProgressDto(
    Long assignmentId,
    long totalExercises,
    long completedToday,
    long completedTotal,
    int progressPercent,
    LocalDateTime lastActivityAt,
    List<ExerciseCompletionDto> completions,
    Map<Long, String> previousNotesByExerciseId
) {}

// Historial — lista
public record AssignmentHistorySummaryDto(
    Long id,
    String templateName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    boolean isActive,
    long totalSessionDays,
    long totalCompletions,
    LocalDateTime lastActivityAt
) {}

// Historial — detalle de asignación
public record AssignmentHistoryDetailDto(
    Long id,
    String templateName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    boolean isActive,
    List<HistoryBlockDto> blocks,
    HistoryStatsDto stats
) {}

public record HistoryBlockDto(
    Long id, String name, Integer dayNumber,
    List<HistoryExerciseSummaryDto> exercises
) {}

public record HistoryExerciseSummaryDto(
    Long exerciseId, String name,
    long sessionsCount,
    BigDecimal bestWeightKg, BigDecimal avgWeightKg, BigDecimal lastWeightKg
) {}

public record HistoryStatsDto(
    long totalDistinctDays,
    long totalCompletions,
    LocalDateTime firstActivityAt,
    LocalDateTime lastActivityAt
) {}

// Progresión de ejercicio
public record ExerciseProgressDto(
    Long exerciseId, String exerciseName,
    String blockName, Integer dayNumber,
    List<ExerciseSessionDto> sessions,
    ExerciseStatsDto stats
) {}

public record ExerciseSessionDto(
    LocalDate sessionDate,
    BigDecimal weightKg,
    Integer actualReps,
    String notes,
    boolean isCompleted,
    LocalDateTime completedAt
) {}

public record ExerciseStatsDto(
    long sessionsCount,
    BigDecimal bestWeightKg, BigDecimal avgWeightKg,
    BigDecimal firstWeightKg, BigDecimal lastWeightKg,
    Double deltaPercent
) {}
```

---

## Tests de Integración

### TrackingControllerTest
```
✅ POST /complete — marca ejercicio con peso/reps/notas: 200 con ExerciseCompletionDto
✅ POST /complete — segunda vez en el mismo día: actualiza (no duplica)
✅ POST /complete — segundo día distinto: crea nuevo registro
✅ POST /complete — exerciseId no pertenece a la asignación: 400
✅ POST /undo — desmarca: 200
✅ POST /undo — sin registro previo (idempotente): 200
✅ GET /progress — retorna completions de hoy + previousNotes
✅ GET /progress — progressPercent basado en completedToday/totalExercises
✅ GET /coach/tracking/{memberId} — coach ve progreso del member
✅ Tenant isolation: member no puede hacer tracking en gym ajeno
```

### MemberHistoryControllerTest
```
✅ GET /history/assignments — lista asignaciones con stats correctos
✅ GET /history/assignments — sin asignaciones: lista vacía
✅ GET /history/assignments/{id} — detalle con bloques y resumen por ejercicio
✅ GET /history/assignments/{id} — asignación de otro member: 404
✅ GET /history/assignments/{id}/exercises/{exId} — progresión con sessions y stats
✅ GET /history/assignments/{id}/exercises/{exId} — exercise no pertenece a asignación: 404
✅ deltaPercent calculado correctamente
```

### CoachHistoryControllerTest
```
✅ GET /coach/history/{memberId}/assignments — coach ve historial del member
✅ GET /coach/history/{memberId}/assignments/{id} — detalle correcto
✅ GET /coach/history/{memberId}/assignments/{id}/exercises/{exId} — progresión correcta
✅ MEMBER intentando acceder a /coach/history: 403
```

---

## Notas de Implementación

- **Una completion por día:** el constraint UNIQUE en `(assignment_id, exercise_id, user_id, session_date)` garantiza un registro por ejercicio por día. El servicio hace "buscar o crear" con la fecha de hoy.
- **`is_completed = false`** representa el "undo" — se conserva el registro para no perder datos históricos de días anteriores.
- **Aggregaciones batch:** `RoutineHistoryServiceImpl` usa `completionRepository.findStatsBatch` para evitar N+1 queries al listar el historial de asignaciones — el batch opera solo sobre los ids de la página actual (DT-08), no reintroduce el N+1 de DT-04.
- **Plantilla eliminada:** si la plantilla fue eliminada (soft delete o rediseño), `templateName` fallback es `"Plantilla eliminada"`.
- **Coach ve cualquier member del gym, no solo sus asignados:** aunque el módulo `coaching` (`coach_assignments`) ya existe, `CoachHistoryController`/`TrackingController.getMemberProgress` siguen usando solo `@gymAccessChecker.isCoach(#gymId)` — cualquier coach del gym puede ver el historial/tracking de cualquier member, sin cruzar contra `coach_assignments`. Restringir al subconjunto asignado (vía `CoachAssignmentService`) queda pendiente.
