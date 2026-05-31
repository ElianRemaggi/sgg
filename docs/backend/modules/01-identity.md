# Módulo: Identity
**Package:** `com.sgg.identity`
**Responsabilidad:** Gestión de usuarios del sistema. Sincronización con Supabase Auth. Auth nativa email/contraseña. Perfil de usuario. Soft delete de cuentas.

---

## Entidades

### User

```sql
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(30)  NOT NULL UNIQUE,            -- V15: login por username
    avatar_url      VARCHAR(500),
    supabase_uid    VARCHAR(100),            -- nullable (auth nativa no tiene Supabase UID)
    password_hash   VARCHAR(255),            -- nullable; solo usuarios nativos (BCrypt)
    platform_role   VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP NULL           -- V17: soft delete
);

-- Índices parciales activos (deleted_at IS NULL):
CREATE UNIQUE INDEX idx_users_email_active     ON users(email)        WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_active  ON users(username)     WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_supabase_uid_active ON users(supabase_uid) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_platform_role ON users(platform_role);
```

**platform_role valores:** `USER` | `SUPERADMIN`

**Invariantes de autenticación:**
- Usuario nativo: tiene `password_hash`, `supabase_uid` es null
- Usuario OAuth (Google): tiene `supabase_uid`, `password_hash` es null
- Al crear por OAuth (`syncUser`): el `username` se genera automáticamente desde el email via `UsernameGenerator`

**Soft delete:** el registro nunca se borra físicamente. Al eliminar una cuenta, se anonymizan email, username, se nullea password y supabase_uid, y se setea `deleted_at`.

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

### POST /api/public/auth/register
**Auth:** Público
**Descripción:** Registro nativo con username, email y contraseña. No requiere Supabase.

**Request body:**
```json
{
  "username": "juanperez",
  "fullName": "Juan Pérez",
  "email": "juan@email.com",
  "password": "contraseña123"
}
```

**Validaciones:**
- `username`: `@NotBlank`, `@Pattern(regexp = "^[a-z0-9_]{3,30}$")` — solo minúsculas, números y `_`
- `fullName`: `@NotBlank`, `@Size(min=2, max=200)`
- `email`: `@NotBlank`, `@Email`
- `password`: `@NotBlank`, `@Size(min=6, max=100)`

**Response 201:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": 1, "username": "juanperez", "fullName": "Juan Pérez", "email": "...", "avatarUrl": null, "platformRole": "USER" }
  }
}
```

**Lógica:**
1. Verificar email único (entre no-eliminados)
2. Verificar username único (entre no-eliminados)
3. Hashear contraseña (BCrypt)
4. Crear `User`
5. Emitir JWT HS384 firmado con `APP_JWT_SECRET`

**Errores:**
- 409: "Ya existe una cuenta con ese email" | "Ya existe una cuenta con ese username"

---

### POST /api/public/auth/login
**Auth:** Público
**Descripción:** Login nativo. El campo `identifier` acepta email o username.

**Request body:**
```json
{
  "identifier": "juanperez",
  "password": "contraseña123"
}
```
> También acepta `"identifier": "juan@email.com"`

**Validaciones:**
- `identifier`: `@NotBlank`
- `password`: `@NotBlank`

**Response 200:** igual que register (token + user)

**Lógica:**
- Si `identifier` contiene `@`: busca por email
- Si no: busca por username
- Verificar `password_hash` con BCrypt
- Si el user no tiene `password_hash` (es OAuth): error "Esta cuenta usa Google para ingresar"
- Emitir JWT HS384

**Errores:**
- 400: "Usuario o contraseña incorrectos" (mismo mensaje para no revelar si existe el usuario)
- 400: "Esta cuenta usa Google para ingresar"

---

### POST /api/auth/sync
**Auth:** Bearer JWT (cualquier usuario autenticado)
**Descripción:** Se llama después del primer OAuth con Google. Crea el usuario en BD si no existe, o actualiza nombre y avatar si ya existe.

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
    "username": "juanperez",
    "fullName": "Juan Pérez",
    "email": "usuario@email.com",
    "avatarUrl": "https://...",
    "platformRole": "USER"
  }
}
```

**Lógica:**
1. Buscar user por `supabase_uid`
2. Si no existe: crear `User` con username generado por `UsernameGenerator.generateFromEmail(email)` + crear `AuthIdentity`
3. Si existe: actualizar `full_name` y `avatar_url` si cambiaron
4. Si `AuthIdentity` ya existe (`provider + providerUid`): no duplicar

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
    "username": "juanperez",
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

**Response 200:** igual a GET /api/users/me

---

### DELETE /api/users/me
**Auth:** Bearer JWT
**Descripción:** Eliminar la cuenta del usuario autenticado (soft delete + anonimización).

**Response 200:** `ApiResponse<Void>`

**Lógica:**
1. Marcar todas las membresías ACTIVE/PENDING como INACTIVE
2. Eliminar todos los `AuthIdentity` del usuario
3. Anonymizar datos del User: email → `deleted_{id}_{epochMillis}@deleted.sgg`, username → `deleted_{id}_{epochMillis}`, fullName → "Cuenta eliminada", avatarUrl → null, supabaseUid → null, passwordHash → null
4. Setear `deleted_at = now()`

> El registro de `users` nunca se borra físicamente para preservar integridad referencial (completions, asignaciones, etc.).

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
      "membershipId": 5,
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

---

## DTOs

```java
// Response usuario
public record UserDto(
    Long id,
    String username,     // incluido desde V15
    String fullName,
    String email,
    String avatarUrl,
    String platformRole
) {}

// Response auth nativa (register y login)
public record AuthResponse(
    String token,   // JWT HS384
    UserDto user
) {}

// Request registro nativo
public record RegisterRequest(
    @NotBlank @Pattern(regexp = "^[a-z0-9_]{3,30}$") String username,
    @NotBlank @Email String email,
    @NotBlank @Size(min=2, max=200) String fullName,
    @NotBlank @Size(min=6, max=100) String password
) {}

// Request login nativo
public record LoginRequest(
    @NotBlank String identifier,   // email O username
    @NotBlank String password
) {}

// Request sync Supabase
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
public record MembershipDto(
    Long membershipId,
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

## UsernameGenerator

Genera usernames únicos a partir del email para usuarios OAuth. Normaliza el prefijo del email (minúsculas, reemplaza caracteres inválidos con `_`, rellena hasta mín. 3 chars, trunca a 30). Si el candidate ya existe, agrega sufijo numérico (`base2`, `base3`, ...).

---

## Tests de Integración

### NativeAuthControllerTest

```
✅ POST /register — registro exitoso: 201 con token y user (incluye username)
✅ POST /register — email duplicado: 409
✅ POST /register — username duplicado: 409
✅ POST /register — username con caracteres inválidos (ej: "Juan P"): 400
✅ POST /register — password muy corta: 400
✅ POST /register — email inválido: 400
✅ POST /login — login por email: 200 con token
✅ POST /login — login por username: 200 con token
✅ POST /login — contraseña incorrecta: 400
✅ POST /login — usuario OAuth intenta login nativo: 400 "Esta cuenta usa Google para ingresar"
✅ POST /login — body inválido: 400
```

### UserControllerTest

```
✅ GET /api/users/me — retorna perfil con username
✅ GET /api/users/me — sin JWT: 401
✅ PUT /api/users/me — actualiza fullName y avatarUrl
✅ PUT /api/users/me — fullName en blanco: 400
✅ DELETE /api/users/me — anonimiza cuenta y retorna 200
✅ GET /api/users/me/memberships — retorna lista de gyms con roles
✅ GET /api/users/me/memberships — usuario sin gyms: lista vacía
```

---

## Dependencias del Módulo

- **Depende de:** ninguno (es la base)
- **Es usado por:** `tenancy`, `tracking`, `platform`

---

## Notas de Implementación

- **Auth Supabase:** el `sub` del JWT es el `supabase_uid`. `CustomJwtAuthenticationConverter` busca el user por `supabase_uid`.
- **Auth nativa:** el `sub` del JWT HS384 es el `id` del User (Long como string). `DualJwtDecoder` intenta primero HS384, si falla prueba JWKS de Supabase.
- `SecurityUtils.getCurrentUserId()` funciona con ambos tipos de JWT.
- `platform_role = SUPERADMIN` solo se setea via `/api/platform/admins/promote` — nunca en register ni sync.
- Queries de unicidad siempre filtran `deleted_at IS NULL` para no colisionar con cuentas eliminadas.
