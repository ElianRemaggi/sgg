# Módulo: Tenancy
**Package:** `com.sgg.tenancy`
**Responsabilidad:** Gestión de gimnasios y membresías. Alta de gyms, solicitudes de adhesión, roles de miembros.

---

## Entidades

### Gym

```sql
CREATE TABLE gyms (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    logo_url        VARCHAR(500),
    routine_cycle   VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',  -- 'WEEKLY' | 'MONTHLY'
    owner_user_id   BIGINT NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE' | 'SUSPENDED' | 'DELETED'
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_gyms_slug ON gyms(slug);
CREATE INDEX idx_gyms_owner ON gyms(owner_user_id);
CREATE INDEX idx_gyms_status ON gyms(status);
```

### GymMember

```sql
CREATE TABLE gym_members (
    id                      BIGSERIAL PRIMARY KEY,
    gym_id                  BIGINT NOT NULL REFERENCES gyms(id),
    user_id                 BIGINT NOT NULL REFERENCES users(id),
    role                    VARCHAR(20) NOT NULL,   -- 'MEMBER' | 'COACH' | 'ADMIN' | 'ADMIN_COACH'
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED' | 'REMOVED' | 'EXPIRED'
    membership_expires_at   TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX idx_gym_members_user_gym ON gym_members(user_id, gym_id);
CREATE UNIQUE INDEX idx_unique_pending_membership
    ON gym_members(user_id, gym_id) WHERE status = 'PENDING';
```

---

## Endpoints

### GET /api/gyms/search?slug={slug}
**Auth:** Público
**Descripción:** Buscar un gym por slug para que un member lo encuentre antes de solicitar membresía.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "CrossFit Norte",
    "slug": "crossfit-norte",
    "description": "El mejor gym del norte",
    "logoUrl": "https://..."
  }
}
```
**Response 404:** gym no encontrado o status != ACTIVE

---

### GET /api/gyms/{gymId}/info
**Auth:** Bearer JWT (cualquier rol en el gym)
**Descripción:** Info pública del gym para mostrar en la app.

---

### POST /api/gyms/{gymId}/join-request
**Auth:** Bearer JWT
**Descripción:** El usuario solicita unirse al gym. Crea una entrada en `gym_members` con `status = PENDING`.

**Request body:** vacío (el usuario viene del JWT, el gym del path)

**Validaciones:**
- El gym existe y está ACTIVE
- El usuario no tiene ya una membresía PENDING o ACTIVE en este gym (constraint único)

**Response 201:**
```json
{
  "success": true,
  "data": {
    "membershipId": 5,
    "status": "PENDING",
    "gymName": "CrossFit Norte"
  }
}
```

---

### GET /api/gyms/{gymId}/admin/members
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Descripción:** Listar todos los miembros del gym con filtros opcionales.

**Query params:** `?status=ACTIVE&role=COACH&page=0&size=20`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "memberId": 5,
        "userId": 12,
        "fullName": "María García",
        "email": "maria@email.com",
        "avatarUrl": "https://...",
        "role": "MEMBER",
        "status": "ACTIVE",
        "membershipExpiresAt": "2026-12-31T00:00:00",
        "joinedAt": "2026-01-15T00:00:00"
      }
    ],
    "totalElements": 45,
    "totalPages": 3,
    "page": 0,
    "size": 20
  }
}
```

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/approve
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Lógica:** Cambia `status = ACTIVE`. Opcionalmente setea `role` (default MEMBER).

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/reject
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Lógica:** Cambia `status = REJECTED`. Solo si estaba PENDING.

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/block
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Lógica:** Cambia `status = BLOCKED`. No se puede bloquear al owner.

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/expiry
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Request body:**
```json
{ "expiresAt": "2026-12-31T23:59:59" }
```

---

### PATCH /api/gyms/{gymId}/admin/members/{memberId}/role
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN
**Request body:**
```json
{ "role": "COACH" }
```

**Validaciones:**
1. El target no es el owner del gym (`gyms.owner_user_id != memberId`)
2. El solicitante no es el mismo usuario que el target
3. Si degrada COACH → MEMBER: verificar que no tenga `coach_assignments` activas. Si tiene → 409 con lista de asignaciones.
4. El nuevo rol es un valor válido del enum.

---

## DTOs

```java
public record GymDto(Long id, String name, String slug, String description, String logoUrl, String routineCycle) {}
public record GymPublicDto(Long id, String name, String slug, String description, String logoUrl) {}

public record GymMemberDto(
    Long memberId, Long userId, String fullName, String email, String avatarUrl,
    String role, String status, LocalDateTime membershipExpiresAt, LocalDateTime joinedAt
) {}

public record JoinRequestResponse(Long membershipId, String status, String gymName) {}

public record UpdateMemberRoleRequest(
    @NotBlank
    @Pattern(regexp = "MEMBER|COACH|ADMIN|ADMIN_COACH", message = "Rol inválido")
    String role
) {}

public record SetExpiryRequest(
    @NotNull(message = "La fecha de vencimiento es obligatoria")
    @Future(message = "La fecha debe ser futura")
    LocalDateTime expiresAt
) {}
```

---

## Tests de Integración

### GymSearchControllerTest
```
✅ GET /api/gyms/search?slug=x — gym existe y activo: retorna 200 con datos
✅ GET /api/gyms/search?slug=x — gym no existe: retorna 404
✅ GET /api/gyms/search?slug=x — gym suspendido: retorna 404 (no exponer gyms suspendidos)
```

### JoinRequestControllerTest
```
✅ POST join-request — usuario nuevo: crea membership PENDING, retorna 201
✅ POST join-request — usuario ya tiene membresía PENDING: retorna 409
✅ POST join-request — usuario ya tiene membresía ACTIVE: retorna 409
✅ POST join-request — gym no existe: retorna 404
✅ POST join-request — sin JWT: retorna 401
```

### AdminMembersControllerTest
```
✅ GET members — ADMIN puede listar miembros de su gym
✅ GET members — ADMIN no puede ver miembros de otro gym (tenant isolation)
✅ GET members — COACH no puede acceder: retorna 403
✅ GET members — sin JWT: retorna 401
✅ GET members — paginación funciona correctamente
✅ GET members?status=PENDING — filtra correctamente
✅ PUT approve — cambia status a ACTIVE
✅ PUT reject — cambia status a REJECTED, solo si era PENDING
✅ PUT block — cambia status a BLOCKED
✅ PUT block — no puede bloquear al owner: retorna 403
✅ PATCH role — cambia rol correctamente
✅ PATCH role — no puede cambiar rol del owner: retorna 403
✅ PATCH role — no puede cambiarse a sí mismo: retorna 403
✅ PATCH role — degradar COACH con asignaciones activas: retorna 409
✅ PATCH role — rol inválido en body: retorna 400
```

---

## Notas de Implementación

- Al crear un gym (desde el panel superadmin), siempre crear una entrada en `gym_members` para el `owner_user_id` con `role = ADMIN` y `status = ACTIVE`.
- El `TenantInterceptor` verifica que el user autenticado tiene `gym_members` con `status = ACTIVE` para el `gymId` del path, antes de setear el `TenantContext`. Excepciones: SUPERADMIN bypasea, y los endpoints públicos `/info` y `/join-request` tienen lógica especial.
- `gym_members.status = EXPIRED` se puede settear batch cuando `membership_expires_at < NOW()`. Para el MVP, verificarlo on-the-fly en el interceptor es suficiente.
