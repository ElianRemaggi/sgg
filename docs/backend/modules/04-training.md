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

### GET /api/gyms/{gymId}/coach/templates
**Auth:** COACH | ADMIN_COACH | SUPERADMIN
**Descripción:** Listar plantillas creadas en este gym. El coach ve todas las del gym (no solo las propias).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Rutina Fuerza 4 días",
      "description": "...",
      "blocksCount": 4,
      "createdBy": { "id": 5, "fullName": "Carlos López" },
      "createdAt": "2026-01-01T00:00:00"
    }
  ]
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
**Auth:** MEMBER (el propio member)
**Descripción:** La rutina activa del member autenticado.

**Response 200:**
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
        "exercises": [
          {
            "id": 1,
            "name": "Press de Banca",
            "sets": 4,
            "reps": "8-10",
            "restSeconds": 90,
            "notes": "Bajar controlado",
            "isCompleted": false   ← viene del módulo tracking
          }
        ]
      }
    ]
  }
}
```

**Nota:** El campo `isCompleted` por ejercicio se obtiene haciendo join con `exercise_completions` para el día actual. Si no hay registro = false.

**Response 404:** si no tiene rutina activa (retornar mensaje amigable, no error duro).

---

### GET /api/gyms/{gymId}/member/routine/history
**Auth:** MEMBER
**Response 200:** Lista de asignaciones pasadas con nombre de plantilla y fechas.

---

## DTOs Clave

```java
// Template completo (con bloques y ejercicios)
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

// Para la vista del member (incluye estado de completion)
public record MemberExerciseDto(
    Long id,
    String name,
    Integer sets,
    String reps,
    Integer restSeconds,
    String notes,
    Boolean isCompleted   // null si no hay tracking aún
) {}
```

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
✅ Todos los endpoints: MEMBER intenta acceder: 403
✅ Todos los endpoints: sin JWT: 401
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

---

## Notas de Implementación

- La creación de template (POST) debe hacerse en una sola `@Transactional`: si falla al guardar un ejercicio, debe hacer rollback de todo.
- Al obtener `/member/routine`, hacer el join con `exercise_completions` filtrando por `completed_at` del día actual (o del bloque activo según el ciclo del gym).
- El `sort_order` en blocks y exercises permite reordenar sin renumerar todo. Usar múltiplos de 10 (0, 10, 20...) para facilitar inserciones entre elementos.
- `reps` es String porque los entrenadores usan notaciones variadas: "10", "8-12", "AMRAP", "Al fallo", "30 seg". No intentar parsearlo a número.
