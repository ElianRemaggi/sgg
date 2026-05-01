# Convenciones Backend — Spring Boot SGG

## Nombrado

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Package | lowercase, singular | `com.sgg.training` |
| Entity | PascalCase, singular | `RoutineTemplate` |
| Repository | `{Entity}Repository` | `RoutineTemplateRepository` |
| Service interfaz | `{Entity}Service` | `RoutineTemplateService` |
| Service impl | `{Entity}ServiceImpl` | `RoutineTemplateServiceImpl` |
| Controller | `{Entity}Controller` | `RoutineTemplateController` |
| DTO request | `Create{Entity}Request`, `Update{Entity}Request` | `CreateRoutineTemplateRequest` |
| DTO response | `{Entity}Dto` | `RoutineTemplateDto` |
| Mapper | `{Entity}Mapper` | `RoutineTemplateMapper` (MapStruct) |
| Test | `{Class}Test` | `RoutineTemplateControllerTest` |

---

## Estructura de Archivos por Módulo

```
com.sgg.training/
├── controller/
│   ├── RoutineTemplateController.java
│   └── RoutineAssignmentController.java
├── service/
│   ├── RoutineTemplateService.java          ← interfaz
│   ├── RoutineTemplateServiceImpl.java      ← implementación
│   ├── RoutineAssignmentService.java
│   └── RoutineAssignmentServiceImpl.java
├── repository/
│   ├── RoutineTemplateRepository.java
│   ├── TemplateBlockRepository.java
│   ├── TemplateExerciseRepository.java
│   └── RoutineAssignmentRepository.java
├── entity/
│   ├── RoutineTemplate.java
│   ├── TemplateBlock.java
│   ├── TemplateExercise.java
│   └── RoutineAssignment.java
└── dto/
    ├── RoutineTemplateDto.java
    ├── CreateRoutineTemplateRequest.java
    ├── UpdateRoutineTemplateRequest.java
    ├── RoutineAssignmentDto.java
    └── AssignRoutineRequest.java
```

---

## Inyección de Dependencias

**SIEMPRE constructor injection. NUNCA `@Autowired` en campos.**

```java
// ✅ Correcto
@Service
@RequiredArgsConstructor  // Lombok genera el constructor
public class RoutineTemplateServiceImpl implements RoutineTemplateService {
    private final RoutineTemplateRepository templateRepository;
    private final RoutineTemplateMapper mapper;
}

// ❌ Incorrecto
@Service
public class RoutineTemplateServiceImpl {
    @Autowired
    private RoutineTemplateRepository templateRepository;
}
```

---

## Transacciones

```java
// Service impl: @Transactional a nivel de clase (escrituras)
@Transactional
public class RoutineTemplateServiceImpl {

    // Lecturas: sobreescribir con readOnly
    @Transactional(readOnly = true)
    public List<RoutineTemplateDto> findAll() { ... }

    // Escrituras: hereda @Transactional de la clase
    public RoutineTemplateDto create(...) { ... }
}
```

---

## ApiResponse — Wrapper Estándar

Todas las respuestas de la API usan este wrapper:

```java
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    List<String> errors
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null);
    }
    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, data, "Creado exitosamente", null);
    }
    public static ApiResponse<Void> noContent() {
        return new ApiResponse<>(true, null, null, null);
    }
}
```

**HTTP Status codes:**
- `GET` exitoso → 200
- `POST` exitoso → 201
- `PUT/PATCH` exitoso → 200
- `DELETE` exitoso → 204
- Validación fallida → 400
- Sin auth → 401
- Sin permiso → 403
- No encontrado → 404
- Conflicto → 409

---

## Migraciones Flyway

Nomenclatura: `V{n}__{descripcion_con_guiones_bajos}.sql`

```
V1__create_users.sql
V2__create_auth_identities.sql
V3__create_gyms.sql
V4__create_gym_members.sql
V5__create_routine_templates.sql
V6__create_template_blocks.sql
V7__create_template_exercises.sql
V8__create_routine_assignments.sql
V9__add_cascade_deletes.sql
V10__native_auth_support.sql
V11__gym_auto_accept_members.sql
V12__create_exercise_completions.sql
V13__create_schedule_activities.sql   ← última migración aplicada
V14__...                              ← próxima nueva migración
```

**Reglas:**
- Una migración por entidad o cambio lógico
- Siempre incluir los índices en la misma migración que crea la tabla
- Nunca usar `DROP TABLE` sin hablar antes
- Para agregar columna: nueva migración `Vn__add_{columna}_to_{tabla}.sql`

---

## Logging

```java
// Declaración (una por clase)
private static final Logger log = LoggerFactory.getLogger(RoutineTemplateServiceImpl.class);

// Niveles:
log.debug("Template encontrado: id={}", template.getId());           // desarrollo
log.info("Plantilla creada: gymId={}, templateId={}", gymId, id);    // eventos importantes
log.warn("Membresía próxima a vencer: memberId={}", memberId);       // alertas
log.error("Error al crear plantilla: gymId={}", gymId, ex);          // errores con excepción

// NUNCA
System.out.println("algo");
```

---

## Validaciones Bean Validation

```java
// En DTOs de request — SIEMPRE validar todo lo que llega de afuera
public record CreateRoutineTemplateRequest(

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    String name,

    @Size(max = 500, message = "La descripción no puede superar 500 caracteres")
    String description,   // nullable, sin @NotBlank

    @NotNull(message = "El número de días es obligatorio")
    @Min(value = 1, message = "Mínimo 1 día")
    @Max(value = 7, message = "Máximo 7 días")
    Integer days
) {}

// En el controller — @Valid activa las validaciones
@PostMapping
public ApiResponse<RoutineTemplateDto> create(
        @PathVariable Long gymId,
        @Valid @RequestBody CreateRoutineTemplateRequest request) { ... }
```

---

## Soft Delete

```java
// En entities con soft delete
@Column(name = "deleted_at")
private LocalDateTime deletedAt;

public boolean isDeleted() {
    return deletedAt != null;
}

// En repositories — excluir soft-deleted por defecto
Optional<RoutineTemplate> findByIdAndDeletedAtIsNull(Long id);
List<RoutineTemplate> findAllByDeletedAtIsNull();

// En services — al "eliminar"
template.setDeletedAt(LocalDateTime.now());
templateRepository.save(template);
```

---

## Manejo de Errores

```java
// En services — lanzar excepciones tipadas
public RoutineTemplateDto findById(Long gymId, Long templateId) {
    return templateRepository.findByIdAndDeletedAtIsNull(templateId)
        .filter(t -> t.getGymId().equals(gymId))   // doble check tenant
        .map(mapper::toDto)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Plantilla no encontrada: id=" + templateId));
}

// Verificar ownership antes de modificar
public void delete(Long gymId, Long templateId) {
    RoutineTemplate template = findOrThrow(gymId, templateId);
    Long currentUserId = securityUtils.getCurrentUserId();

    if (!template.getCreatedBy().equals(currentUserId)
            && !gymAccessChecker.hasRole(gymId, "ADMIN")) {
        throw new AccessDeniedException("Solo el creador o un admin puede eliminar esta plantilla");
    }
    template.setDeletedAt(LocalDateTime.now());
}
```

---

## MapStruct — Mapeos DTO ↔ Entity

```java
@Mapper(componentModel = "spring")
public interface RoutineTemplateMapper {
    RoutineTemplateDto toDto(RoutineTemplate entity);
    RoutineTemplate toEntity(CreateRoutineTemplateRequest request);

    // Si el nombre del campo difiere:
    @Mapping(source = "createdBy", target = "creatorId")
    RoutineTemplateDto toDtoWithCreator(RoutineTemplate entity);
}
```

---

## pom.xml — Dependencias Mínimas

```xml
<!-- Spring Boot Starters -->
<dependency>spring-boot-starter-web</dependency>
<dependency>spring-boot-starter-data-jpa</dependency>
<dependency>spring-boot-starter-security</dependency>
<dependency>spring-boot-starter-oauth2-resource-server</dependency>
<dependency>spring-boot-starter-validation</dependency>

<!-- BD -->
<dependency>org.postgresql:postgresql</dependency>
<dependency>org.flywaydb:flyway-core</dependency>
<dependency>org.flywaydb:flyway-database-postgresql</dependency>

<!-- Utilidades -->
<dependency>org.projectlombok:lombok</dependency>
<dependency>org.mapstruct:mapstruct</dependency>
<dependency>org.mapstruct:mapstruct-processor</dependency>

<!-- Tests -->
<dependency>spring-boot-starter-test</dependency>
<dependency>org.testcontainers:postgresql</dependency>
<dependency>org.testcontainers:junit-jupiter</dependency>
```
