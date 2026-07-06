# Módulo: Platform
**Package:** `com.sgg.platform`
**Responsabilidad:** Operaciones de plataforma exclusivas para SUPERADMIN. ABM global de gyms y gestión de otros superadmins.

---

## Entidades

La mayor parte del módulo opera directamente sobre entidades de otros módulos (`Gym`/`GymMember`
de `tenancy`, `User` de `identity`) sin tablas propias ni Hibernate Filter (no está scoped a
un tenant). La excepción es `GymRequest` (feature "solicitar acceso" de la landing, V19):

### GymRequest

```sql
CREATE TABLE gym_requests (
    id            BIGSERIAL PRIMARY KEY,
    gym_name      VARCHAR(200) NOT NULL,
    contact_name  VARCHAR(200) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    phone         VARCHAR(50),
    message       TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING','CONTACTED','APPROVED','REJECTED')),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gym_requests_status     ON gym_requests(status);
CREATE INDEX idx_gym_requests_created_at ON gym_requests(created_at DESC);
```

`status` es `String` (sin enum Java, a diferencia de `GymMember`/`Gym` — ver
`docs/DEUDA.md` DT-01, que dejó este campo explícitamente fuera de alcance).

---

## Endpoints — Gestión de Gyms

Todos requieren `ROLE_SUPERADMIN`. **No pasan por el TenantInterceptor.**

### GET /api/platform/gyms
**Query params:** `?status=ACTIVE&search=crossfit&page=0&size=20`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "CrossFit Norte",
        "slug": "crossfit-norte",
        "status": "ACTIVE",
        "membersCount": 45,
        "ownerName": "Juan Pérez",
        "ownerEmail": "juan@email.com",
        "createdAt": "2026-01-01T00:00:00"
      }
    ],
    "totalElements": 12,
    "totalPages": 1,
    "page": 0,
    "size": 20
  }
}
```

---

### POST /api/platform/gyms
**Descripción:** Crea un gym y lo asigna a un owner existente.

**Request body:**
```json
{
  "name": "CrossFit Norte",
  "slug": "crossfit-norte",
  "description": "El mejor gym del norte",
  "logoUrl": "https://...",
  "routineCycle": "WEEKLY",
  "ownerUserId": 5
}
```

**Validaciones:**
- `name`: `@NotBlank`, `@Size(max=200)`
- `slug`: `@NotBlank`, `@Pattern(regexp="^[a-z0-9-]+$", message="Solo letras minúsculas, números y guiones")`, `@Size(max=100)`, único
- `routineCycle`: `@Pattern(regexp="WEEKLY|MONTHLY")`
- `ownerUserId`: debe existir en `users`

**Lógica (en una transacción):**
1. Crear registro en `gyms` con `status = ACTIVE`
2. Crear registro en `gym_members` para el owner: `role = ADMIN`, `status = ACTIVE`
3. Retornar `GymDetailDto`

**Response 201:** GymDetailDto

---

### GET /api/platform/gyms/{gymId}
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "CrossFit Norte",
    "slug": "crossfit-norte",
    "description": "...",
    "logoUrl": "https://...",
    "routineCycle": "WEEKLY",
    "status": "ACTIVE",
    "owner": { "id": 5, "fullName": "Juan Pérez", "email": "juan@email.com" },
    "stats": {
      "activeMembers": 45,
      "coaches": 3,
      "templates": 12
    },
    "createdAt": "2026-01-01T00:00:00"
  }
}
```

---

### PUT /api/platform/gyms/{gymId}
**Request body:** igual que POST pero sin `ownerUserId`
**Validaciones:** igual que POST (slug único excluyendo el gym actual)

---

### PATCH /api/platform/gyms/{gymId}/status
**Request body:**
```json
{
  "status": "SUSPENDED",
  "reason": "Pago pendiente"
}
```

**Validaciones:**
- `status`: solo `ACTIVE` o `SUSPENDED` (no `DELETED` por este endpoint)
- No se puede "suspender" un gym ya suspendido (409)
- No se puede "activar" un gym ya activo (409)

**Efecto colateral:** Al suspender, los usuarios del gym reciben 403 en el próximo request (el TenantInterceptor verifica `gym.status == ACTIVE`). El SUPERADMIN sigue teniendo acceso.

---

### DELETE /api/platform/gyms/{gymId}
**Lógica:** Soft delete: `status = DELETED`, `deleted_at = NOW()`

**Validación:**
- Si el gym tiene miembros con `status = ACTIVE`: retornar 409 con conteo
- Query param `?force=true` permite eliminar igualmente (para casos de soporte)

---

## Endpoints — Búsqueda de Usuarios

### GET /api/platform/users?search={query}
**Auth:** SUPERADMIN
**Descripción:** Buscar usuarios por nombre o email. Usado principalmente al seleccionar el owner al crear un gym.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 5, "fullName": "Juan Pérez", "email": "juan@email.com" }
  ]
}
```

---

## Endpoints — Gestión de Superadmins

### GET /api/platform/admins
**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fullName": "Juan Pérez",
      "email": "juan@email.com",
      "promotedAt": "2026-01-01T00:00:00"
    }
  ]
}
```

**Nota:** `promotedAt` requiere un campo `platform_role_updated_at` en `users`, o se puede omitir para el MVP mostrando `created_at`.

---

### POST /api/platform/admins/{userId}/promote
**Lógica:** Setea `users.platform_role = 'SUPERADMIN'`
**Validación:** El userId existe en la BD

**Response 200:**
```json
{ "success": true, "data": { "id": 5, "fullName": "...", "platformRole": "SUPERADMIN" } }
```

---

### POST /api/platform/admins/{userId}/demote
**Lógica:** Setea `users.platform_role = 'USER'`

**Validaciones (en orden):**
1. El userId existe
2. El userId tiene actualmente `platform_role = 'SUPERADMIN'` (si no, 400)
3. El userId NO es el mismo que el usuario autenticado (403 — no puede auto-degradarse)
4. Después del demote quedaría al menos 1 SUPERADMIN (COUNT de SUPERADMINs > 1, si no 409)

---

## Endpoints — Gym Requests ("solicitar acceso")

### POST /api/public/gym-requests
**Controller:** `PublicGymRequestController`
**Auth:** Público (bajo `/api/public/**`)
**Descripción:** Formulario de la landing page para que alguien sin cuenta pida que se le dé de alta un gym. No crea ningún `Gym` — solo registra la solicitud para que un superadmin la gestione manualmente.

**Request body:** `GymRequestSubmission`
```json
{
  "gymName": "CrossFit Sur",
  "contactName": "Ana Gómez",
  "email": "ana@email.com",
  "phone": "+54 9 11 1234-5678",
  "message": "Nos interesa migrar desde una planilla de Excel"
}
```

**Response 201:** `GymRequestDto` con `status: "PENDING"`.

---

### GET /api/platform/gym-requests
**Controller:** `PlatformGymRequestController`
**Auth:** SUPERADMIN (bajo `/api/platform/**`, sin `@PreAuthorize` propio — lo cubre el matcher de `SecurityConfig`)
**Query params:** `?status=PENDING&page=0&size=20` (`status` es opcional; sin filtro trae todas)

**Response 200:** `PageResponse<GymRequestDto>`, orden `created_at DESC`.

---

### PATCH /api/platform/gym-requests/{id}/status
**Auth:** SUPERADMIN
**Request body:** `UpdateGymRequestStatusRequest`
```json
{ "status": "CONTACTED" }
```
**Validación:** `status` debe ser uno de `PENDING|CONTACTED|APPROVED|REJECTED` (`@Pattern`). No hay transición de estados restringida — cualquier valor válido es aceptado desde cualquier estado actual. `APPROVED` **no** crea automáticamente un `Gym`; sigue siendo un paso manual (`POST /api/platform/gyms`) hecho por el superadmin.

---

## DTOs

```java
// Lista de gyms
public record GymSummaryDto(
    Long id, String name, String slug, GymStatus status,
    Integer membersCount, String ownerName, String ownerEmail,
    LocalDateTime createdAt
) {}

// Detalle de gym
public record GymDetailDto(
    Long id, String name, String slug, String description,
    String logoUrl, String routineCycle, GymStatus status,
    UserSummaryDto owner, GymStatsDto stats, LocalDateTime createdAt
) {}

// stats.templates SIEMPRE es 0 hoy — placeholder que quedó desactualizado
// (el comentario en PlatformGymServiceImpl dice "will be real when training module
// exists", pero training ya existe; el conteo real nunca se conectó)
public record GymStatsDto(Integer activeMembers, Integer coaches, Integer templates) {}

// Gym requests ("solicitar acceso" desde la landing)
public record GymRequestDto(
    Long id, String gymName, String contactName, String email,
    String phone, String message, String status, LocalDateTime createdAt
) {}

public record GymRequestSubmission(
    @NotBlank @Size(max = 200) String gymName,
    @NotBlank @Size(max = 200) String contactName,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(max = 50) String phone,
    @Size(max = 2000) String message
) {}

public record UpdateGymRequestStatusRequest(
    @NotBlank @Pattern(regexp = "PENDING|CONTACTED|APPROVED|REJECTED") String status
) {}

// Crear gym
public record CreateGymRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Pattern(regexp = "^[a-z0-9-]+$") @Size(max = 100) String slug,
    @Size(max = 1000) String description,
    @URL @Size(max = 500) String logoUrl,
    @NotBlank @Pattern(regexp = "WEEKLY|MONTHLY") String routineCycle,
    @NotNull Long ownerUserId
) {}

// Cambiar status
public record ChangeGymStatusRequest(
    @NotBlank @Pattern(regexp = "ACTIVE|SUSPENDED") String status,
    @Size(max = 500) String reason
) {}

// Superadmin en lista
public record SuperAdminDto(Long id, String fullName, String email) {}
```

---

## Configuración en WebMvcConfig

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final TenantInterceptor tenantInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(tenantInterceptor)
            .addPathPatterns("/api/gyms/**")     // Solo rutas de gym
            .excludePathPatterns("/api/platform/**")  // Platform NO pasa por tenant
            .excludePathPatterns("/api/auth/**")
            .excludePathPatterns("/api/users/**")
            .excludePathPatterns("/api/public/**");
    }
}
```

---

## Tests de Integración

```
✅ GET /platform/gyms — SUPERADMIN ve todos los gyms paginados
✅ GET /platform/gyms?status=SUSPENDED — filtra por status
✅ GET /platform/gyms — ADMIN de gym intenta acceder: 403
✅ GET /platform/gyms — MEMBER intenta acceder: 403
✅ GET /platform/gyms — sin JWT: 401
✅ POST /platform/gyms — crea gym exitosamente: 201
✅ POST /platform/gyms — al crear, crea gym_member para owner con rol ADMIN
✅ POST /platform/gyms — slug duplicado: 409
✅ POST /platform/gyms — slug con caracteres inválidos (mayúsculas, espacios): 400
✅ POST /platform/gyms — ownerUserId inexistente: 400
✅ GET /platform/gyms/{id} — retorna detalle con stats
✅ PUT /platform/gyms/{id} — actualiza nombre y descripción
✅ PUT /platform/gyms/{id} — slug duplicado de otro gym: 409
✅ PATCH /platform/gyms/{id}/status — suspende gym activo: 200
✅ PATCH /platform/gyms/{id}/status — suspende gym ya suspendido: 409
✅ PATCH /platform/gyms/{id}/status — activa gym suspendido: 200
✅ DELETE /platform/gyms/{id} — gym sin miembros activos: soft delete exitoso
✅ DELETE /platform/gyms/{id} — gym con miembros activos sin ?force: 409
✅ DELETE /platform/gyms/{id}?force=true — elimina aunque tenga miembros
✅ GET /platform/admins — lista superadmins activos
✅ POST /platform/admins/{id}/promote — promueve usuario
✅ POST /platform/admins/{id}/promote — usuario ya es SUPERADMIN: 400
✅ POST /platform/admins/{id}/demote — degrada exitosamente
✅ POST /platform/admins/{id}/demote — intenta auto-degradarse: 403
✅ POST /platform/admins/{id}/demote — es el último superadmin: 409
✅ POST /platform/admins/{id}/demote — usuario no es superadmin: 400
```

### GymRequestControllerTest
```
✅ POST /public/gym-requests — request válido: 201
✅ POST /public/gym-requests — sin message (opcional): 201
✅ POST /public/gym-requests — email inválido: 400
✅ POST /public/gym-requests — faltan campos requeridos: 400
✅ GET /platform/gym-requests — SUPERADMIN ve todas: 200
✅ GET /platform/gym-requests?status=X — filtra correctamente
✅ GET /platform/gym-requests — sin JWT: 401
✅ GET /platform/gym-requests — JWT sin rol SUPERADMIN: 403
✅ PATCH /platform/gym-requests/{id}/status — transición válida: 200
✅ PATCH /platform/gym-requests/{id}/status — status inválido: 400
✅ PATCH /platform/gym-requests/{id}/status — id no existe: 404
```

---

## Notas de Implementación

- El módulo `platform` importa directamente `GymRepository`, `GymMemberRepository` y `UserRepository` de los módulos `tenancy` e `identity` para el ABM de gyms/admins. La única entidad propia es `GymRequest` (con su propio `GymRequestRepository`), para la feature de gym requests.
- Los stats del gym (`membersCount`, `coaches`, `templates`) se calculan con queries `COUNT` al momento de la petición. Para el MVP, queries directas son suficientes — no cachear.
- El campo `reason` en el cambio de status se puede logear pero no hace falta persistirlo en el MVP. Si se quiere auditoría: crear tabla `gym_status_history` post-MVP.
- Al hacer soft delete de un gym, los datos de sus miembros, rutinas, etc. permanecen en la BD. Solo el gym queda marcado como `DELETED`. Para acceder, el SUPERADMIN puede usar los endpoints `/api/platform/gyms/{id}` que no filtran por status.
