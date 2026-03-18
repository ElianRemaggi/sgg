# Módulo: Coaching
**Package:** `com.sgg.coaching`
**Responsabilidad:** Asignación de coaches a members dentro de un gym.

---

## Entidades

### CoachAssignment

```sql
CREATE TABLE coach_assignments (
    id              BIGSERIAL PRIMARY KEY,
    gym_id          BIGINT NOT NULL REFERENCES gyms(id),
    coach_user_id   BIGINT NOT NULL REFERENCES users(id),
    member_user_id  BIGINT NOT NULL REFERENCES users(id),
    assigned_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    unassigned_at   TIMESTAMP,
    UNIQUE(gym_id, coach_user_id, member_user_id)
);

CREATE INDEX idx_coach_assignments_gym ON coach_assignments(gym_id);
CREATE INDEX idx_coach_assignments_coach ON coach_assignments(coach_user_id, gym_id);
CREATE INDEX idx_coach_assignments_member ON coach_assignments(member_user_id, gym_id);
```

**Activa:** `unassigned_at IS NULL`

---

## Endpoints

### GET /api/gyms/{gymId}/admin/coaches
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Descripción:** Listar todos los usuarios con rol COACH en el gym, con cuántos miembros tienen asignados.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 5,
      "fullName": "Carlos López",
      "email": "carlos@email.com",
      "assignedMembersCount": 8
    }
  ]
}
```

---

### POST /api/gyms/{gymId}/admin/assign-coach
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Request body:**
```json
{ "coachUserId": 5, "memberUserId": 12 }
```
**Validaciones:**
- `coachUserId` tiene rol COACH o ADMIN_COACH en este gym
- `memberUserId` tiene rol MEMBER en este gym
- No existe ya una asignación activa entre este coach y este member (constraint único + `unassigned_at IS NULL`)

---

### DELETE /api/gyms/{gymId}/admin/assign-coach/{assignmentId}
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Lógica:** Setea `unassigned_at = NOW()`. No delete físico.

---

### GET /api/gyms/{gymId}/coach/my-members
**Auth:** COACH | ADMIN_COACH
**Descripción:** El coach ve sus miembros asignados activos.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 12,
      "fullName": "María García",
      "avatarUrl": "https://...",
      "assignmentId": 3,
      "assignedAt": "2026-01-10T00:00:00",
      "hasActiveRoutine": true
    }
  ]
}
```

---

## Tests de Integración

```
✅ GET /admin/coaches — lista coaches con conteo de asignados
✅ GET /admin/coaches — MEMBER no puede acceder: 403
✅ POST /admin/assign-coach — asignación exitosa: 201
✅ POST /admin/assign-coach — coachUserId no es coach en este gym: 400
✅ POST /admin/assign-coach — asignación duplicada activa: 409
✅ DELETE /admin/assign-coach/{id} — desasigna (setea unassigned_at)
✅ GET /coach/my-members — coach ve solo sus asignados
✅ GET /coach/my-members — MEMBER no puede acceder: 403
✅ Aislamiento: coach de gym A no ve nada de gym B
```

---

## Notas de Implementación

- Cuando se cambia el rol de un usuario de COACH → MEMBER (módulo tenancy), el módulo coaching debe verificar las asignaciones activas. La validación vive en `CoachAssignmentService.hasActiveAssignmentsAsCoach(gymId, userId)`.
- Un member puede tener múltiples coaches en distintos gyms, pero solo uno por gym.
