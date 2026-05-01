# Arquitectura Backend — Spring Boot Monolito Modular

## Stack

- Java 21
- Spring Boot 3.x
- Spring Security (OAuth2 Resource Server)
- Spring Data JPA + Hibernate
- Flyway (migraciones)
- PostgreSQL 16
- Testcontainers (tests de integración)
- MapStruct (mapeo DTO ↔ Entity)
- Lombok

---

## Estructura de Packages

```
com.sgg
├── SggApplication.java
│
├── common/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── NativeJwtConfig.java         # carga APP_JWT_SECRET, expone clave HS384
│   │   ├── PasswordEncoderConfig.java   # BCrypt para auth nativa
│   │   ├── CorsConfig.java
│   │   └── WebMvcConfig.java            # registra TenantInterceptor
│   ├── security/
│   │   ├── DualJwtDecoder.java          # intenta HS384 nativo, fallback a Supabase JWKS
│   │   ├── CustomJwtAuthenticationConverter.java
│   │   ├── GymAccessChecker.java        # usado en @PreAuthorize
│   │   └── SecurityUtils.java           # helper: getCurrentUserId()
│   ├── multitenancy/
│   │   ├── TenantContext.java           # ThreadLocal<Long> gymId
│   │   └── TenantInterceptor.java       # extrae y valida gymId del path
│   ├── exception/
│   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│   │   ├── BusinessException.java       # base para excepciones de negocio
│   │   ├── ResourceNotFoundException.java
│   │   ├── AccessDeniedException.java
│   │   └── TenantViolationException.java
│   └── dto/
│       ├── ApiResponse.java             # wrapper genérico de response
│       └── PageResponse.java            # wrapper paginación
│
├── identity/        # ver docs/backend/modules/01-identity.md
├── tenancy/         # ver docs/backend/modules/02-tenancy.md
├── training/        # ver docs/backend/modules/04-training.md
├── tracking/        # ver docs/backend/modules/05-tracking.md
├── schedule/        # ver docs/backend/modules/06-schedule.md
└── platform/        # ver docs/backend/modules/07-platform.md
```

---

## Multi-Tenancy — Implementación

### TenantContext

```java
public class TenantContext {
    private static final ThreadLocal<Long> currentGymId = new ThreadLocal<>();
    public static void setGymId(Long gymId) { currentGymId.set(gymId); }
    public static Long getGymId() { return currentGymId.get(); }
    public static void clear() { currentGymId.remove(); }
}
```

### TenantInterceptor

Extrae `{gymId}` del path URI. Verifica que el usuario autenticado tiene membresía activa en ese gym (salvo SUPERADMIN que bypasea). Setea `TenantContext`. Limpia en `afterCompletion`.

```java
// Path pattern registrado en WebMvcConfig:
// /api/gyms/{gymId}/**
```

### Hibernate Filter

Cada entidad de negocio tiene el filtro declarado:

```java
@FilterDef(name = "tenantFilter",
           parameters = @ParamDef(name = "gymId", type = Long.class))
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Entity
public class RoutineTemplate { ... }
```

El filtro se activa en `TenantInterceptor` via `EntityManager`:

```java
Session session = entityManager.unwrap(Session.class);
session.enableFilter("tenantFilter").setParameter("gymId", gymId);
```

---

## Seguridad

### SecurityConfig — Estructura

```java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers(HttpMethod.GET, "/api/gyms/search", "/api/gyms/search/by-name").permitAll()
    .requestMatchers("/api/platform/**").hasRole("SUPERADMIN")
    .anyRequest().authenticated()
)
```

> **Nota:** Los roles por gym (ADMIN, COACH, etc.) NO se validan en SecurityConfig.
> Se validan con `@PreAuthorize("@gymAccessChecker.isAdmin(#gymId)")` a nivel de método.
> El `TenantInterceptor` verifica membresía activa antes de ejecutar el controller.

### GymAccessChecker

Bean usado en `@PreAuthorize` para validaciones más finas:

```java
@PreAuthorize("@gymAccessChecker.isCoachOf(#gymId, #memberId)")
@PreAuthorize("@gymAccessChecker.hasRole(#gymId, 'ADMIN')")
@PreAuthorize("@gymAccessChecker.isSelfOrAdmin(#gymId, #userId)")
```

### DualJwtDecoder

El sistema soporta dos tipos de JWT:
- **JWT Supabase**: firmado con RS256, validado contra JWKS URI (`SUPABASE_JWKS_URI`)
- **JWT nativo**: firmado con HS384 usando `APP_JWT_SECRET` (emitido por `NativeAuthService`)

`DualJwtDecoder` intenta decodificar con el decoder nativo (HS384) primero. Si falla, prueba con el decoder de Supabase (JWKS). El primero en tener éxito gana.

```java
@Override
public Jwt decode(String token) throws JwtException {
    try {
        return nativeDecoder.decode(token);  // HS384
    } catch (JwtException e) {
        // no es nativo, intentar con Supabase
    }
    return supabaseDecoder.decode(token);  // RS256 via JWKS
}
```

### CustomJwtAuthenticationConverter

Flujo:
1. Recibe el JWT ya validado por `DualJwtDecoder`
2. Extrae `sub`:
   - JWT Supabase: `sub` = supabase_uid → busca user por `supabase_uid`
   - JWT nativo: `sub` = user id (Long como string) → busca user por `id`
3. Si `platform_role = SUPERADMIN` → agrega `ROLE_SUPERADMIN`
4. Los roles por gym se resuelven en `TenantInterceptor` (dependen del path)

---

## Patrones de Código

### Controller

```java
@RestController
@RequestMapping("/api/gyms/{gymId}/coach/templates")
@RequiredArgsConstructor
public class RoutineTemplateController {

    private final RoutineTemplateService templateService;

    @GetMapping
    @PreAuthorize("@gymAccessChecker.hasRole(#gymId, 'COACH')")
    public ApiResponse<List<RoutineTemplateDto>> getTemplates(
            @PathVariable Long gymId) {
        return ApiResponse.ok(templateService.findByGym(gymId));
    }

    @PostMapping
    @PreAuthorize("@gymAccessChecker.hasRole(#gymId, 'COACH')")
    public ApiResponse<RoutineTemplateDto> create(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateRoutineTemplateRequest request) {
        return ApiResponse.created(templateService.create(gymId, request));
    }
}
```

### Service

```java
public interface RoutineTemplateService {
    List<RoutineTemplateDto> findByGym(Long gymId);
    RoutineTemplateDto create(Long gymId, CreateRoutineTemplateRequest request);
    RoutineTemplateDto update(Long gymId, Long templateId, UpdateRoutineTemplateRequest request);
    void delete(Long gymId, Long templateId);
}

@Service
@RequiredArgsConstructor
@Transactional
public class RoutineTemplateServiceImpl implements RoutineTemplateService {

    private static final Logger log = LoggerFactory.getLogger(RoutineTemplateServiceImpl.class);

    private final RoutineTemplateRepository templateRepository;
    private final RoutineTemplateMapper mapper;
    private final SecurityUtils securityUtils;

    @Override
    @Transactional(readOnly = true)
    public List<RoutineTemplateDto> findByGym(Long gymId) {
        // Hibernate Filter ya filtra por gymId automáticamente
        return templateRepository.findAll().stream()
            .map(mapper::toDto)
            .toList();
    }
}
```

### Repository

```java
@Repository
public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {
    // El filtro de Hibernate se aplica automáticamente
    // Solo agregar queries específicas que necesiten lógica extra
    Optional<RoutineTemplate> findByIdAndDeletedAtIsNull(Long id);
    List<RoutineTemplate> findByCreatedByAndDeletedAtIsNull(Long userId);
}
```

### Entity

```java
@Entity
@Table(name = "routine_templates")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "gymId", type = Long.class))
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
@Getter @Setter
@NoArgsConstructor
public class RoutineTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

### DTOs con Validación

```java
public record CreateRoutineTemplateRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    String name,

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    String description
) {}
```

### GlobalExceptionHandler

Maneja y formatea todas las excepciones en respuestas consistentes:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    // 400 → MethodArgumentNotValidException (Bean Validation)
    // 403 → AccessDeniedException (custom, de com.sgg.common.exception)
    // 403 → AuthorizationDeniedException (Spring Security @PreAuthorize)
    // 403 → TenantViolationException (acceso a gym sin membresía)
    // 404 → ResourceNotFoundException
    // 409 → BusinessException con conflicto
    // 500 → Exception genérica
}
```

---

## Tests de Integración — Estructura Base

Todos los test classes extienden `BaseIntegrationTest` (en `com.sgg.common`), que maneja el contenedor de PostgreSQL y la configuración de Testcontainers. No replicar esta configuración en cada test.

```java
// com.sgg.common.BaseIntegrationTest
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class BaseIntegrationTest {

    static final PostgreSQLContainer<?> postgres;

    static {
        postgres = new PostgreSQLContainer<>("postgres:16-alpine");
        postgres.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired protected MockMvc mockMvc;
    @Autowired protected ObjectMapper objectMapper;
}

// Cada test class extiende la base:
class RoutineTemplateControllerTest extends BaseIntegrationTest {

    // Cada test verifica:
    // 1. Happy path
    // 2. Validaciones fallidas (400)
    // 3. Sin autenticación (401)
    // 4. Rol incorrecto (403)
    // 5. Aislamiento de tenant (datos de otro gym no visibles)
}
```

---

## Plan de Fases

| Fase | Semanas | Módulos |
|------|---------|---------|
| 1 — Foundation | 1-2 | common, identity, Docker, Flyway base |
| 2 — Tenancy Core | 3-4 | tenancy, panel admin básico |
| 3 — Superadmin | 5 | platform, panel /platform |
| 4 — Training | 6-7 | training, panel coach |
| 5 — App Móvil Core | 8-10 | sgg-app: auth, gym selection, rutina |
| 6 — Tracking + Schedule | 11-12 | tracking, schedule, progreso |
| 7 — Schedule + Polish | 13-14 | schedule, horarios, testing final |
