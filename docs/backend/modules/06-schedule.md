# Módulo: Schedule
**Package:** `com.sgg.schedule`
**Responsabilidad:** Actividades y horarios del gym (clases, turnos, eventos recurrentes por día de semana).

---

## Entidades

### ScheduleActivity

```sql
CREATE TABLE schedule_activities (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    day_of_week     INTEGER NOT NULL,   -- 1=Lunes ... 7=Domingo (ISO 8601)
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schedule_activities_gym ON schedule_activities(gym_id);
CREATE INDEX idx_schedule_activities_gym_day ON schedule_activities(gym_id, day_of_week);
```

---

## Endpoints

### GET /api/gyms/{gymId}/schedule
**Auth:** Cualquier member activo del gym (MEMBER | COACH | ADMIN | ADMIN_COACH)
**Descripción:** Listar horarios activos del gym, ordenados por día y hora.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "CrossFit Matutino",
      "description": "Clase de alta intensidad",
      "dayOfWeek": 1,
      "dayName": "Lunes",
      "startTime": "07:00",
      "endTime": "08:00",
      "isActive": true
    },
    {
      "id": 2,
      "name": "Yoga",
      "description": null,
      "dayOfWeek": 3,
      "dayName": "Miércoles",
      "startTime": "19:00",
      "endTime": "20:00",
      "isActive": true
    }
  ]
}
```

**Lógica:** Solo retorna `is_active = true`. Ordenado por `day_of_week ASC, start_time ASC`.

---

### POST /api/gyms/{gymId}/admin/schedule
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN

**Request body:**
```json
{
  "name": "CrossFit Matutino",
  "description": "Clase de alta intensidad",
  "dayOfWeek": 1,
  "startTime": "07:00",
  "endTime": "08:00"
}
```

**Validaciones:**
- `name`: `@NotBlank`, `@Size(max=200)`
- `dayOfWeek`: `@NotNull`, `@Min(1)`, `@Max(7)`
- `startTime`: `@NotNull`
- `endTime`: `@NotNull`
- `endTime` debe ser posterior a `startTime` (validación manual en service)

**Response 201:** ScheduleActivityDto

---

### PUT /api/gyms/{gymId}/admin/schedule/{activityId}
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Request body:** igual que POST
**Validaciones:** igual que POST + la actividad debe pertenecer al gym del path

---

### DELETE /api/gyms/{gymId}/admin/schedule/{activityId}
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Lógica:** Setea `is_active = false`. No delete físico. Idempotente.

---

## DTOs

```java
public record ScheduleActivityDto(
    Long id,
    String name,
    String description,
    Integer dayOfWeek,
    String dayName,          // calculado: "Lunes", "Martes"...
    String startTime,        // formato "HH:mm"
    String endTime,
    Boolean isActive
) {}

public record CreateScheduleActivityRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 500) String description,
    @NotNull @Min(1) @Max(7) Integer dayOfWeek,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime
) {}
```

---

## Tests de Integración

```
✅ GET /schedule — member ve horarios activos del gym, ordenados
✅ GET /schedule — solo muestra is_active = true
✅ GET /schedule — datos de otro gym no visibles (tenant isolation)
✅ GET /schedule — sin JWT: 401
✅ POST /admin/schedule — admin crea actividad: 201
✅ POST /admin/schedule — dayOfWeek = 0 (inválido): 400
✅ POST /admin/schedule — dayOfWeek = 8 (inválido): 400
✅ POST /admin/schedule — endTime anterior a startTime: 400
✅ POST /admin/schedule — sin nombre: 400
✅ PUT /admin/schedule/{id} — actualiza correctamente
✅ PUT /admin/schedule/{id} — actividad de otro gym: 404
✅ DELETE /admin/schedule/{id} — setea is_active = false
✅ DELETE /admin/schedule/{id} — ya estaba inactiva: 200 (idempotente)
✅ MEMBER intenta POST: 403
✅ COACH intenta POST: 403
```

---

## Dependencias del Módulo

- **Depende de:** `tenancy` (para verificar que el gym existe)
- **Es usado por:** nadie (leaf module)

---

## Notas de Implementación

- `dayName` en el DTO se calcula en el mapper con `DayOfWeek.of(dayOfWeek).getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es"))`.
- Para el MVP no hay manejo de excepciones de horario (solapamiento de actividades). Si dos clases se superponen, se permite.
- El DELETE es lógico (`is_active = false`) para mantener historial. Si en el futuro se quiere mostrar horarios pasados, el campo ya está.
