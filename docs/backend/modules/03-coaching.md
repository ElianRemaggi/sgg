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
    unassigned_at   TIMESTAMP
);

CREATE INDEX idx_coach_assignments_gym    ON coach_assignments(gym_id);
CREATE INDEX idx_coach_assignments_coach  ON coach_assignments(coach_user_id, gym_id);
CREATE INDEX idx_coach_assignments_member ON coach_assignments(member_user_id, gym_id);

-- Solo una asignación activa por par coach-member-gym
CREATE UNIQUE INDEX idx_coach_assignments_active_unique
    ON coach_assignments(gym_id, coach_user_id, member_user_id)
    WHERE unassigned_at IS NULL;
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
- `coachUserId` tiene rol COACH o ADMIN_COACH, con membresía ACTIVE en este gym
- `memberUserId` tiene rol MEMBER, con membresía ACTIVE en este gym
- El member no tiene ya un coach activo en este gym (`existsByGymIdAndMemberUserIdAndUnassignedAtIsNull`) — un member solo puede tener **un** coach activo por gym, no uno por cada coach

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

- **Auto-desasignación por evento, no por bloqueo.** Cuando `tenancy` degrada a un usuario de COACH → MEMBER/ADMIN (`GymMemberServiceImpl.changeRole`) o lo bloquea (`blockMember`), publica un `CoachDeactivatedEvent(gymId, userId)`. `com.sgg.coaching.listener.CoachEventListener` escucha ese evento y desasigna (`unassigned_at = NOW()`) todas las `coach_assignments` activas donde ese usuario era coach. Esto invierte la dependencia: `tenancy` no importa nada de `coaching`, solo publica un evento genérico de Spring (`ApplicationEventPublisher`) que `coaching` consume.
- `CoachAssignmentService.hasActiveAssignmentsAsCoach(gymId, userId)` existe como consulta de solo lectura, pero no tiene ningún caller en el código actual (ni bloquea el cambio de rol ni la alimenta ningún controller) — queda como utilidad expuesta para uso futuro.
- Un member puede tener múltiples coaches en distintos gyms, pero solo uno activo por gym (ver constraint de servicio arriba).
