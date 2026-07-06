# Módulo: Training
**Package:** `com.sgg.training`
**Responsabilidad:** Plantillas de rutinas, bloques, ejercicios y asignación de rutinas a miembros. Es el módulo más complejo del sistema.

---

## Entidades

### RoutineTemplate

```sql
CREATE TABLE routine_templates (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    created_by      BIGINT NOT NULL REFERENCES users(id),
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routine_templates_gym ON routine_templates(gym_id);
CREATE INDEX idx_routine_templates_created_by ON routine_templates(created_by, gym_id);
```

### TemplateBlock (ej: "Día 1", "Día 2")

```sql
CREATE TABLE template_blocks (
    id              BIGSERIAL PRIMARY KEY,
    template_id     BIGINT NOT NULL REFERENCES routine_templates(id),
    name            VARCHAR(100) NOT NULL,
    day_number      INTEGER NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_blocks_template ON template_blocks(template_id);
```

### TemplateExercise

```sql
CREATE TABLE template_exercises (
    id              BIGSERIAL PRIMARY KEY,
    block_id        BIGINT NOT NULL REFERENCES template_blocks(id),
    name            VARCHAR(200) NOT NULL,
    sets            INTEGER,
    reps            VARCHAR(50),     -- "10", "8-12", "Al fallo"
    rest_seconds    INTEGER,
    notes           TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_template_exercises_block ON template_exercises(block_id);
```

**Nota:** `reps` es VARCHAR porque puede ser "10", "8-12", "AMRAP", "Al fallo".

### RoutineAssignment

```sql
CREATE TABLE routine_assignments (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    template_id     BIGINT NOT NULL REFERENCES routine_templates(id),
    member_user_id  BIGINT NOT NULL REFERENCES users(id),
    assigned_by     BIGINT NOT NULL REFERENCES users(id),
    starts_at       TIMESTAMP NOT NULL,
    ends_at         TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routine_assignments_member ON routine_assignments(member_user_id, gym_id);
CREATE INDEX idx_routine_assignments_gym ON routine_assignments(gym_id);
CREATE INDEX idx_routine_assignments_active ON routine_assignments(member_user_id, gym_id)
    WHERE ends_at IS NULL OR ends_at >= NOW();
```

---

## Endpoints

Todos los endpoints de `coach/templates` y `coach/assignments` usan
`@PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")` — recordar que
`isCoach()` también es `true` para el owner de un gym `PERSONAL` (ver `docs/backend/modules/02-tenancy.md`).

### GET /api/gyms/{gymId}/coach/templates
**Auth:** COACH | ADMIN_COACH | SUPERADMIN | owner de gym personal
**Descripción:** Listar plantillas creadas en este gym, paginado. El coach ve todas las del gym (no solo las propias).
**Query params:** `?page=0&size=20`

**Response 200:** `PageResponse<RoutineTemplateSummaryDto>` (mismo wrapper que `admin/members` — ver `docs/backend/modules/02-tenancy.md`)
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Rutina Fuerza 4 días",
        "description": "...",
        "blocksCount": 4,
        "createdBy": { "id": 5, "fullName": "Carlos López" },
        "createdAt": "2026-01-01T00:00:00"
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

---

### POST /api/gyms/{gymId}/coach/templates
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Request body:**
```json
{
  "name": "Rutina Fuerza 4 días",
  "description": "Descripción opcional",
  "blocks": [
    {
      "name": "Día 1 - Pecho y Tríceps",
      "dayNumber": 1,
      "sortOrder": 0,
      "exercises": [
        {
          "name": "Press de Banca",
          "sets": 4,
          "reps": "8-10",
          "restSeconds": 90,
          "notes": "Bajar controlado",
          "sortOrder": 0
        }
      ]
    }
  ]
}
```

**Validaciones:**
- `name`: `@NotBlank`, `@Size(max=200)`
- `blocks`: `@NotEmpty` (debe tener al menos 1 bloque)
- Cada bloque: `name @NotBlank`, `dayNumber @NotNull @Min(1) @Max(31)`
- Cada exercise: `name @NotBlank`, `sets @Min(1)` si presente

**Response 201:** RoutineTemplateDetailDto completo con todos los bloques y ejercicios.

**Lógica:** Crear template + todos los bloques + todos los ejercicios en una sola transacción.

---

### GET /api/gyms/{gymId}/coach/templates/{templateId}
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Response 200:** RoutineTemplateDetailDto completo (template + blocks + exercises)

---

### PUT /api/gyms/{gymId}/coach/templates/{templateId}
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** Reemplaza completamente la plantilla (incluye bloques y ejercicios).
**Lógica:** Eliminar blocks+exercises existentes, insertar los nuevos. Todo en una transacción.
**Restricción:** No se puede editar una plantilla que tiene asignaciones activas (retornar 409 con mensaje claro).

---

### DELETE /api/gyms/{gymId}/coach/templates/{templateId}
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Lógica:** Soft delete (`deleted_at = NOW()`).
**Restricción:** No se puede eliminar si tiene asignaciones activas.

---

### GET /api/gyms/{gymId}/coach/templates/{templateId}/export?format=xlsx|csv
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** Exporta la plantilla completa (bloques + ejercicios) a un archivo descargable. `format` default `xlsx`; también acepta `csv`. Cualquier otro valor → `BusinessException` → 409.
**Servicio:** `RoutineExportService` (`RoutineExportServiceImpl`, usa Apache POI para xlsx).
**Response 200:** `byte[]` con `Content-Type` y `Content-Disposition: attachment` según el formato — no pasa por `ApiResponse`.

---

### POST /api/gyms/{gymId}/coach/assignments
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** Asignar una plantilla de rutina a un miembro.

**Request body:**
```json
{
  "templateId": 1,
  "memberUserId": 12,
  "startsAt": "2026-02-01T00:00:00",
  "endsAt": "2026-02-28T23:59:59"
}
```

**Validaciones:**
- El coach es el coach asignado del member (o es ADMIN/ADMIN_COACH)
- El `memberUserId` es MEMBER activo en este gym
- El `templateId` pertenece a este gym
- `startsAt` no puede ser en el pasado (warn, no error)
- `endsAt` si presente, debe ser posterior a `startsAt`

---

### GET /api/gyms/{gymId}/member/routine
**Auth:** MEMBER | SUPERADMIN (`isMember(#gymId)`)
**Descripción:** La rutina activa del member autenticado.

**Response 200:** `MemberRoutineDto` — bloques con sus ejercicios (`TemplateBlockDto`/`TemplateExerciseDto`), sin campo `isCompleted` propio: el estado de completado por ejercicio lo agrega el frontend/`tracking` combinando esta respuesta con `GET .../member/tracking/progress` (ver `docs/backend/modules/05-tracking.md`), no viene embebido acá.
```json
{
  "success": true,
  "data": {
    "assignmentId": 3,
    "templateName": "Rutina Fuerza 4 días",
    "startsAt": "2026-02-01T00:00:00",
    "endsAt": "2026-02-28T23:59:59",
    "blocks": [
      {
        "id": 1,
        "name": "Día 1 - Pecho y Tríceps",
        "dayNumber": 1,
        "sortOrder": 0,
        "exercises": [
          { "id": 1, "name": "Press de Banca", "sets": 4, "reps": "8-10", "restSeconds": 90, "notes": "Bajar controlado", "sortOrder": 0 }
        ]
      }
    ]
  }
}
```

**Response 404:** si no tiene rutina activa (retornar mensaje amigable, no error duro).

---

### GET /api/gyms/{gymId}/member/routine/history
**Auth:** MEMBER | SUPERADMIN
**Response 200:** Lista de `RoutineAssignmentDto` (asignaciones del member en este gym, incluye la activa) con nombre de plantilla y fechas. Para historial con progresión de peso y stats, ver `MemberHistoryController` en `docs/backend/modules/05-tracking.md`.

---

### POST /api/gyms/{gymId}/member/routine/finish
**Auth:** MEMBER | SUPERADMIN
**Descripción:** Finaliza (marca `ends_at = NOW()`) la rutina activa del member autenticado, para poder empezar/asignar otra sin conflicto. 404 si no tiene ninguna activa.
**Response 200:** `ApiResponse<Void>`

---

## DTOs Clave

```java
// Lista de templates del gym
public record RoutineTemplateSummaryDto(
    Long id,
    String name,
    String description,
    Integer blocksCount,
    CreatorDto createdBy,   // record anidado: (Long id, String fullName)
    LocalDateTime createdAt
) {}

// Template completo (con bloques y ejercicios) — GET/POST/PUT por id
public record RoutineTemplateDetailDto(
    Long id,
    String name,
    String description,
    List<TemplateBlockDto> blocks,
    UserSummaryDto createdBy,
    LocalDateTime createdAt
) {}

public record TemplateBlockDto(
    Long id,
    String name,
    Integer dayNumber,
    Integer sortOrder,
    List<TemplateExerciseDto> exercises
) {}

public record TemplateExerciseDto(
    Long id,
    String name,
    Integer sets,
    String reps,
    Integer restSeconds,
    String notes,
    Integer sortOrder
) {}

// Rutina activa del member (GET /member/routine)
public record MemberRoutineDto(
    Long assignmentId,
    String templateName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    List<TemplateBlockDto> blocks
) {}

// Historial de asignaciones (GET /member/routine/history)
public record RoutineAssignmentDto(
    Long id,
    String templateName,
    String memberName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    LocalDateTime createdAt
) {}
```

### RoutineQueryService — facade de solo lectura para `tracking`

`com.sgg.training.service.RoutineQueryService` expone consultas de training (asignaciones,
bloques, ejercicios) devolviendo DTOs de solo-lectura (`AssignmentInfo`, `BlockWithExercisesInfo`,
`ExerciseInfo`, `ExerciseWithBlockInfo`) — nunca entidades ni repositorios. Existe para que
`tracking` no dependa de los repositorios internos de `training` (resuelto como parte de la
deuda técnica DT-05, ver `docs/DEUDA.md`). No lo usan los controllers de este propio módulo.

---

## Tests de Integración

### RoutineTemplateControllerTest
```
✅ POST /coach/templates — crea template con bloques y ejercicios: 201
✅ POST /coach/templates — nombre en blanco: 400
✅ POST /coach/templates — sin bloques: 400
✅ GET /coach/templates — lista solo los del gym actual (tenant isolation)
✅ GET /coach/templates/{id} — retorna detalle completo
✅ GET /coach/templates/{id} — template de otro gym: 404
✅ PUT /coach/templates/{id} — reemplaza bloques y ejercicios
✅ PUT /coach/templates/{id} — con asignaciones activas: 409
✅ DELETE /coach/templates/{id} — soft delete
✅ DELETE /coach/templates/{id} — con asignaciones activas: 409
✅ DELETE /coach/templates/{id} — ya eliminado: 404
✅ Todos los endpoints: MEMBER intenta acceder: 403 (owner de gym personal sí puede)
✅ Todos los endpoints: sin JWT: 401
```

### RoutineTemplateExportControllerTest
```
✅ GET /{id}/export?format=xlsx — 200, Content-Type xlsx
✅ GET /{id}/export — sin format: default xlsx, 200
✅ GET /{id}/export?format=csv — 200, Content-Type csv + Content-Disposition
✅ GET /{id}/export?format=invalido — 409
✅ GET /{id}/export — MEMBER: 403
✅ GET /{id}/export — sin JWT: 401
✅ GET /{id}/export — template no existe: 404
```

### RoutineAssignmentControllerTest
```
✅ POST /coach/assignments — asignación exitosa: 201
✅ POST /coach/assignments — template de otro gym: 404
✅ POST /coach/assignments — member no está en este gym: 400
✅ GET /member/routine — member tiene rutina activa: 200 con ejercicios
✅ GET /member/routine — member sin rutina activa: 404 con mensaje amigable
✅ GET /member/routine/history — lista asignaciones pasadas
✅ GET /member/routine — COACH intenta acceder su propia ruta /member: 403
```

> `POST /member/routine/finish` no tiene test class propia — se cubre indirectamente en
> `PersonalGymControllerTest` (`finishActiveRoutine_thenCanStartAnother`,
> `finishActiveRoutine_noActiveRoutine_returns404`), dentro del flujo de gym personal.

---

## Notas de Implementación

- La creación de template (POST) debe hacerse en una sola `@Transactional`: si falla al guardar un ejercicio, debe hacer rollback de todo.
- `GET /member/routine` **no** incluye el estado de completado por ejercicio (`isCompleted`) — ese dato lo agrega el módulo `tracking` (`GET .../member/tracking/progress`), el frontend combina ambas respuestas. No hay join con `exercise_completions` en este módulo.
- El `sort_order` en blocks y exercises permite reordenar sin renumerar todo. Usar múltiplos de 10 (0, 10, 20...) para facilitar inserciones entre elementos.
- `reps` es String porque los entrenadores usan notaciones variadas: "10", "8-12", "AMRAP", "Al fallo", "30 seg". No intentar parsearlo a número.
- Exportar a xlsx usa Apache POI (`org.apache.poi:poi-ooxml`); a csv es texto plano generado a mano (sin librería extra).
