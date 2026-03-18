# Módulo: Identity
**Package:** `com.sgg.identity`
**Responsabilidad:** Gestión de usuarios del sistema. Sincronización con Supabase Auth. Perfil de usuario.

---

## Entidades

### User

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    avatar_url      VARCHAR(500),
    supabase_uid    VARCHAR(100) NOT NULL UNIQUE,
    platform_role   VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_users_supabase_uid ON users(supabase_uid);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform_role ON users(platform_role);
```

**platform_role valores:** `USER` | `SUPERADMIN`

### AuthIdentity

```sql
CREATE TABLE auth_identities (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id),
    provider     VARCHAR(50) NOT NULL,    -- 'google', 'email'
    provider_uid VARCHAR(200) NOT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_uid)
);

CREATE INDEX idx_auth_identities_user_id ON auth_identities(user_id);
```

---

## Endpoints

### POST /api/auth/sync
**Auth:** Bearer JWT (cualquier usuario autenticado)
**Descripción:** Se llama en el primer login. Crea el usuario en la BD si no existe, o actualiza sus datos si ya existe.

**Request body:**
```json
{
  "supabaseUid": "uuid-de-supabase",
  "email": "usuario@email.com",
  "fullName": "Juan Pérez",
  "avatarUrl": "https://...",
  "provider": "google",
  "providerUid": "google-uid-123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "usuario@email.com",
    "avatarUrl": "https://...",
    "platformRole": "USER",
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

**Lógica:**
1. Buscar user por `supabase_uid`
2. Si no existe: crear nuevo `User` + `AuthIdentity`
3. Si existe: actualizar `full_name` y `avatar_url` si cambiaron
4. Retornar el `UserDto`

---

### GET /api/users/me
**Auth:** Bearer JWT
**Descripción:** Perfil del usuario autenticado.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Juan Pérez",
    "email": "usuario@email.com",
    "avatarUrl": "https://...",
    "platformRole": "USER"
  }
}
```

---

### PUT /api/users/me
**Auth:** Bearer JWT
**Descripción:** Actualizar perfil propio. Solo `fullName` y `avatarUrl`.

**Request body:**
```json
{
  "fullName": "Juan Carlos Pérez",
  "avatarUrl": "https://nueva-url..."
}
```

**Validaciones:**
- `fullName`: `@NotBlank`, `@Size(min=2, max=200)`
- `avatarUrl`: `@URL` si presente, `@Size(max=500)`

**Response 200:** igual a GET /api/users/me

---

### GET /api/users/me/memberships
**Auth:** Bearer JWT
**Descripción:** Lista todos los gimnasios a los que pertenece el usuario con su rol en cada uno.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "gymId": 1,
      "gymName": "CrossFit Norte",
      "gymSlug": "crossfit-norte",
      "gymLogoUrl": "https://...",
      "role": "MEMBER",
      "status": "ACTIVE",
      "membershipExpiresAt": "2026-12-31T00:00:00"
    }
  ]
}
```

**Nota:** Este endpoint lo implementa el módulo `identity` pero consulta la tabla `gym_members` del módulo `tenancy`. Se resuelve via una query en `UserService` que hace join con `gym_members` y `gyms`.

---

## DTOs

```java
// Response
public record UserDto(
    Long id,
    String fullName,
    String email,
    String avatarUrl,
    String platformRole
) {}

// Request sync
public record SyncUserRequest(
    @NotBlank String supabaseUid,
    @NotBlank @Email String email,
    @NotBlank @Size(max=200) String fullName,
    @Size(max=500) String avatarUrl,
    @NotBlank String provider,
    @NotBlank String providerUid
) {}

// Request update profile
public record UpdateProfileRequest(
    @NotBlank @Size(min=2, max=200) String fullName,
    @URL @Size(max=500) String avatarUrl
) {}

// Membership summary (para /me/memberships)
public record UserMembershipDto(
    Long gymId,
    String gymName,
    String gymSlug,
    String gymLogoUrl,
    String role,
    String status,
    LocalDateTime membershipExpiresAt
) {}
```

---

## Tests de Integración

### AuthSyncControllerTest

```
✅ POST /api/auth/sync — usuario nuevo: crea user + auth_identity, retorna 200
✅ POST /api/auth/sync — usuario existente: actualiza nombre y avatar, no duplica
✅ POST /api/auth/sync — sin JWT: retorna 401
✅ POST /api/auth/sync — body inválido (email faltante): retorna 400 con errores
✅ POST /api/auth/sync — mismo provider+providerUid dos veces: no duplica auth_identity
```

### UserControllerTest

```
✅ GET /api/users/me — retorna perfil del usuario autenticado
✅ GET /api/users/me — sin JWT: retorna 401
✅ PUT /api/users/me — actualiza fullName y avatarUrl correctamente
✅ PUT /api/users/me — fullName en blanco: retorna 400
✅ PUT /api/users/me — avatarUrl inválida (no es URL): retorna 400
✅ GET /api/users/me/memberships — retorna lista correcta de gyms con roles
✅ GET /api/users/me/memberships — usuario sin gyms: retorna lista vacía
```

---

## Dependencias del Módulo

- **Depende de:** ninguno (es la base)
- **Es usado por:** `tenancy` (para obtener datos del usuario), `platform` (para gestionar superadmins)

---

## Notas de Implementación

- El `supabase_uid` es el `sub` del JWT de Supabase. Usarlo siempre para identificar al usuario en requests.
- `SecurityUtils.getCurrentUserId()` debe hacer un lookup en BD por `supabase_uid` extraído del JWT. Cachear el resultado en el request actual.
- El email viene de Supabase y es de confianza — no re-verificar.
- `platform_role = SUPERADMIN` nunca se setea en `/auth/sync` — solo via `/api/platform/admins/promote`.
