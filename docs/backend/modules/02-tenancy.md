# Módulo: Tenancy
**Package:** `com.sgg.tenancy`
**Responsabilidad:** Gestión de gimnasios y membresías. Alta de gyms, solicitudes de adhesión, roles de miembros, gyms personales (self-service).

---

## Entidades

### Gym

```sql
CREATE TABLE gyms (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(200) NOT NULL,
    slug                  VARCHAR(100) NOT NULL UNIQUE,
    description           TEXT,
    logo_url              VARCHAR(500),
    routine_cycle         VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',  -- 'WEEKLY' | 'MONTHLY' (String, sin enum)
    owner_user_id         BIGINT NOT NULL REFERENCES users(id),
    auto_accept_members   BOOLEAN NOT NULL DEFAULT false,   -- V11
    type                  VARCHAR(20) NOT NULL DEFAULT 'STANDARD',  -- V20, ver GymType
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',    -- ver GymStatus
    deleted_at            TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT gyms_type_check   CHECK (type IN ('STANDARD', 'PERSONAL')),      -- V20
    CONSTRAINT gyms_status_check CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))  -- V21
);

CREATE UNIQUE INDEX idx_gyms_slug ON gyms(slug);
CREATE INDEX idx_gyms_owner ON gyms(owner_user_id);
CREATE INDEX idx_gyms_status ON gyms(status);
CREATE INDEX idx_gyms_personal_owner ON gyms(owner_user_id) WHERE type = 'PERSONAL';
```

En la entidad JPA, `type` y `status` son enums Java (`GymType`, `GymStatus` en `com.sgg.tenancy.entity`) con `@Enumerated(EnumType.STRING)` — no strings sueltos. Jackson los serializa igual (`enum.name()`), así que el JSON no cambia.

**auto_accept_members:** si es `true`, las solicitudes de membresía se aprueban automáticamente al crearse (no quedan en PENDING).

**type (`GymType`):** `STANDARD` (gym normal, visible en búsqueda pública) | `PERSONAL` (gym auto-creado para un usuario que entrena por su cuenta — ver `POST /api/users/me/personal-gym` más abajo). Los gyms `PERSONAL` nunca aparecen en `/api/gyms/search` ni `/api/gyms/search/by-name`.

**status (`GymStatus`):** `ACTIVE` | `SUSPENDED` | `DELETED` (soft delete vía `PlatformGymService.deleteGym`, no vía `deleted_at` — `status = DELETED` es el estado terminal, `deleted_at` se setea igual para el patrón general de soft delete).

### GymMember

```sql
CREATE TABLE gym_members (
    id                      BIGSERIAL PRIMARY KEY,
    gym_id                  BIGINT NOT NULL REFERENCES gyms(id),
    user_id                 BIGINT NOT NULL REFERENCES users(id),
    role                    VARCHAR(20) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    membership_expires_at   TIMESTAMP,
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT gym_members_role_check   CHECK (role IN ('MEMBER', 'COACH', 'ADMIN', 'ADMIN_COACH')),           -- V21
    CONSTRAINT gym_members_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED', 'INACTIVE'))  -- V21
);

CREATE INDEX idx_gym_members_gym_id ON gym_members(gym_id);
CREATE INDEX idx_gym_members_user_gym ON gym_members(user_id, gym_id);
CREATE UNIQUE INDEX idx_unique_pending_membership
    ON gym_members(user_id, gym_id) WHERE status = 'PENDING';
```

`role` (`GymMemberRole`): `MEMBER | COACH | ADMIN | ADMIN_COACH`.
`status` (`GymMemberStatus`): `PENDING | ACTIVE | REJECTED | BLOCKED | INACTIVE` — `INACTIVE` se setea en batch cuando el usuario elimina su cuenta (`UserServiceImpl.deleteCurrentUser`), no es un estado alcanzable desde los endpoints de este módulo.

---

## Endpoints

### GET /api/gyms/search?slug={slug}
**Auth:** Público
**Descripción:** Buscar un gym por slug exacto para que un member lo encuentre antes de solicitar membresía.

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

### GET /api/gyms/search/by-name?q={query}
**Auth:** Público
**Descripción:** Buscar gyms por nombre (búsqueda parcial, case-insensitive). Útil para mostrar resultados mientras el usuario escribe.

**Response 200:** Lista de `GymPublicDto` con los gyms activos que coinciden.

---

### GET /api/gyms/{gymId}/info
**Auth:** Bearer JWT (cualquier rol en el gym)
**Descripción:** Info pública del gym para mostrar en la app.

---

### PATCH /api/gyms/{gymId}/settings/auto-accept
**Controller:** `GymSettingsController`
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN (`@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')`)
**Descripción:** Activa o desactiva la aprobación automática de solicitudes de membresía.

**Request body:** `UpdateAutoAcceptRequest`
```json
{ "autoAccept": true }
```

**Response 200:** `ApiResponse<Void>`

---

### POST /api/users/me/personal-gym
**Controller:** `UserPersonalGymController`
**Auth:** Bearer JWT
**Descripción:** Crea (o devuelve, si ya existe) un gym `PERSONAL` para el usuario autenticado, con una membresía `MEMBER`/`ACTIVE` automática. Idempotente — llamadas repetidas devuelven siempre el mismo gym. Habilita el flujo de "empezar a entrenar por tu cuenta" sin necesidad de que un admin lo dé de alta.

**Response 200:**
```json
{
  "success": true,
  "data": { "gymId": 42 }
}
```

**Lógica (`PersonalGymService.ensurePersonalGym`):**
1. Busca un gym `type = PERSONAL` con `owner_user_id = userId`. Si existe, lo devuelve.
2. Si no existe: crea el `Gym` (`type = PERSONAL`, `status = ACTIVE`, slug `personal-{userId}`) y un `GymMember` (`role = MEMBER`, `status = ACTIVE`) para el mismo usuario.

En el gym personal, el owner puede crear/editar plantillas y auto-asignarse rutinas aunque su membresía sea `MEMBER` — ver el caso especial de `GymAccessChecker.isCoach()` en `docs/backend/ARCHITECTURE.md`.

---

### GET /api/users/me/memberships
**Controller:** `MembershipController`
**Auth:** Bearer JWT
**Descripción:** Lista todos los gimnasios a los que pertenece el usuario con su rol en cada uno (solo membresías `ACTIVE` o `PENDING`).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "membershipId": 5,
      "gymId": 1,
      "gymName": "CrossFit Norte",
      "gymSlug": "crossfit-norte",
      "gymLogoUrl": "https://...",
      "gymType": "STANDARD",
      "role": "MEMBER",
      "status": "ACTIVE",
      "membershipExpiresAt": "2026-12-31T00:00:00"
    }
  ]
}
```

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
**Auth:** ADMIN | ADMIN_COACH | COACH | SUPERADMIN
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
**Auth:** ADMIN | ADMIN_COACH | COACH | SUPERADMIN
**Lógica:** Cambia `status = ACTIVE`. Opcionalmente setea `role` (default MEMBER).

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/reject
**Auth:** ADMIN | ADMIN_COACH | COACH | SUPERADMIN
**Lógica:** Cambia `status = REJECTED`. Solo si estaba PENDING.

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/block
**Auth:** ADMIN | ADMIN_COACH | COACH | SUPERADMIN
**Lógica:** Cambia `status = BLOCKED`. No se puede bloquear al owner. Si el miembro bloqueado era `COACH`/`ADMIN_COACH`, publica `CoachDeactivatedEvent(gymId, userId)` — ver Notas de Implementación.

---

### PUT /api/gyms/{gymId}/admin/members/{memberId}/expiry
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN  *(el COACH no puede cambiar vencimientos)*
**Request body:**
```json
{ "expiresAt": "2026-12-31T23:59:59" }
```

---

### PATCH /api/gyms/{gymId}/admin/members/{memberId}/role
**Auth:** ADMIN | ADMIN_COACH | SUPERADMIN  *(el COACH no puede cambiar roles)*
**Request body:**
```json
{ "role": "COACH" }
```

**Validaciones:**
1. El target no es el owner del gym (`gyms.owner_user_id != memberId`)
2. El solicitante no es el mismo usuario que el target
3. El nuevo rol es un valor válido del enum (`@Pattern` en `UpdateMemberRoleRequest`).

Si el miembro deja de ser `COACH`/`ADMIN_COACH` (downgrade a `MEMBER`/`ADMIN`), publica `CoachDeactivatedEvent(gymId, userId)` — **no** bloquea el cambio con 409. Ver Notas de Implementación.

---

## DTOs

```java
public record GymDto(Long id, String name, String slug, String description, String logoUrl, String routineCycle, Boolean autoAcceptMembers) {}
public record GymPublicDto(Long id, String name, String slug, String description, String logoUrl) {}

public record GymMemberDto(
    Long memberId, Long userId, String fullName, String email, String avatarUrl,
    GymMemberRole role, GymMemberStatus status, LocalDateTime membershipExpiresAt, LocalDateTime joinedAt
) {}

public record MembershipDto(
    Long membershipId, Long gymId, String gymName, String gymSlug, String gymLogoUrl,
    GymType gymType, GymMemberRole role, GymMemberStatus status, LocalDateTime membershipExpiresAt
) {}

public record JoinRequestResponse(Long membershipId, GymMemberStatus status, String gymName) {}

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
✅ GET members — ADMIN no puede ver miembros de otro gym (tenant isolation): 403
✅ GET members — COACH también puede listar (isAdmin OR isCoach OR SUPERADMIN): 200
✅ GET members — sin JWT: retorna 401
✅ GET members — paginación funciona correctamente
✅ GET members?status=PENDING — filtra correctamente
✅ PUT approve/reject/block — ADMIN y COACH pueden ejecutarlas: 200
✅ PUT approve/reject/block — MEMBER no puede: retorna 403
✅ PUT reject — cambia status a REJECTED, solo si era PENDING
✅ PUT block — cambia status a BLOCKED
✅ PUT block — no puede bloquear al owner: retorna 403
✅ PATCH role — cambia rol correctamente (solo ADMIN/SUPERADMIN, no COACH)
✅ PATCH role — no puede cambiar rol del owner: retorna 403
✅ PATCH role — no puede cambiarse a sí mismo: retorna 403
✅ PATCH role — rol inválido en body: retorna 400
```

### MembershipControllerTest
```
✅ GET /api/users/me/memberships — retorna lista de gyms con roles (solo ACTIVE/PENDING)
✅ GET /api/users/me/memberships — usuario sin gyms: lista vacía
```

### PersonalGymControllerTest
```
✅ POST /personal-gym — primera llamada: crea Gym (PERSONAL) + GymMember (MEMBER/ACTIVE)
✅ POST /personal-gym — llamada repetida: idempotente, no duplica
✅ POST /personal-gym — sin JWT: retorna 401
✅ Owner de gym personal puede crear plantillas (aunque su rol sea MEMBER)
✅ Member de un gym STANDARD (no personal) no puede crear plantillas: 403
✅ Owner de gym personal puede auto-asignarse una rutina
✅ Finalizar rutina activa y asignar otra sin conflicto (BUG-05)
```

---

## Notas de Implementación

- Al crear un gym (desde el panel superadmin o self-service), siempre crear una entrada en `gym_members` para el `owner_user_id` con `role = ADMIN` (gym STANDARD) o `role = MEMBER` (gym PERSONAL) y `status = ACTIVE`.
- El `TenantInterceptor` verifica que el user autenticado tiene `gym_members` con `status = ACTIVE` para el `gymId` del path, antes de setear el `TenantContext`. Excepciones: SUPERADMIN bypasea, y los endpoints públicos `/info` y `/join-request` tienen lógica especial.
- **Degradar o bloquear un coach no bloquea la operación con 409.** `GymMemberServiceImpl.changeRole`/`blockMember` publican `CoachDeactivatedEvent(gymId, userId)` (un `ApplicationEvent` de Spring) cuando el miembro deja de ser `COACH`/`ADMIN_COACH`. El módulo `coaching` escucha ese evento (`CoachEventListener`) y auto-desasigna sus `coach_assignments` activas — `tenancy` no depende de `coaching` para esto (dependencia invertida vía evento). Ver `docs/backend/modules/03-coaching.md`.
- `gym_members.status = INACTIVE` no se alcanza desde ningún endpoint de este módulo — lo setea `UserServiceImpl.deleteCurrentUser` (módulo `identity`) al eliminar la cuenta.
- `gym_members.status = EXPIRED` se puede settear batch cuando `membership_expires_at < NOW()`. Para el MVP, verificarlo on-the-fly en el interceptor es suficiente.
