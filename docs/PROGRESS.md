# SGG — Estado del Proyecto

Actualizar este archivo al completar cada tarea. Claude Code lo lee para saber dónde estamos.

---

## Estado General

**Fase actual:** 4 — Training (completada)
**Última actualización:** 2026-03-23

---

## Fases

### Fase 1 — Foundation (semanas 1-2)
- [x] Inicializar proyecto Spring Boot (`sgg-api/`)
- [x] Configurar `pom.xml` con todas las dependencias
- [x] Configurar `application.yml` (dev y prod profiles)
- [x] Implementar módulo `common/` (SecurityConfig, CorsConfig, GlobalExceptionHandler, TenantContext, ApiResponse)
- [x] Implementar módulo `identity/` (User, AuthIdentity, /auth/sync, /users/me)
- [x] Configurar Flyway + migraciones V1-V2
- [x] Tests de integración: AuthSyncControllerTest (5/5), UserControllerTest (5/5)
- [x] Inicializar proyecto Next.js (`sgg-web/`)
- [x] Configurar Supabase SSR en Next.js
- [x] Implementar login page
- [x] Docker Compose funcional (postgres + api + web)
- [x] Cloudflared tunnel configurado en servidor

### Fase 2 — Tenancy Core (semanas 3-4)
- [x] Flyway V3 (gyms) + V4 (gym_members)
- [x] Entidades: Gym, GymMember (con @FilterDef/@Filter para tenant isolation)
- [x] Repositories: GymRepository, GymMemberRepository (con JPQL constructor expression para GymMemberDto)
- [x] DTOs: GymDto, GymPublicDto, GymMemberDto, JoinRequestResponse, MembershipDto, UpdateMemberRoleRequest, SetExpiryRequest
- [x] GymMapper (MapStruct)
- [x] Services: GymService (searchBySlug, getGymInfo), GymMemberService (requestJoin, listMembers, approve/reject/block, setExpiry, changeRole, getUserMemberships)
- [x] TenantInterceptor: extrae gymId del path, valida gym existe, setea TenantContext, habilita Hibernate filter, skip membership check para /join-request y /info, SUPERADMIN bypass
- [x] GymAccessChecker: isAdmin(gymId) verifica rol ADMIN o ADMIN_COACH del usuario actual
- [x] SecurityConfig: agregado permitAll para GET /api/gyms/search
- [x] GlobalExceptionHandler: agregado handler para AuthorizationDeniedException (Spring Security 6.3)
- [x] Controllers: GymSearchController, JoinRequestController, AdminMembersController, MembershipController
- [x] Tests: GymSearchControllerTest (3/3), JoinRequestControllerTest (5/5), AdminMembersControllerTest (14/14), MembershipControllerTest (2/2)
- [x] Frontend: dependencias (react-hook-form, zod, class-variance-authority, clsx, tailwind-merge, lucide-react, date-fns, tailwindcss-animate)
- [x] Frontend: shadcn/ui setup (components.json, tailwind config, CSS variables, componentes: button, badge, card, input, select, dialog, dropdown-menu, table, toast)
- [x] Frontend: API client (lib/api/client.ts con ApiError) + types (lib/api/types.ts)
- [x] Frontend: dashboard layout con sidebar
- [x] Frontend: /select-gym (lista membresías, auto-redirect si solo una)
- [x] Frontend: /gym/[gymId]/admin/members (tabla con filtros, acciones, paginación)
- [x] Frontend: Server Actions (approve, reject, block, changeRole, setExpiry)
- [x] Frontend: Modales (ChangeRoleDialog, SetExpiryDialog)
- [x] Frontend: PendingRequestsBanner, MemberActions dropdown

### Fase 3 — Superadmin (semana 5)
- [x] Módulo `platform/`: DTOs (GymSummaryDto, GymDetailDto, GymStatsDto, CreateGymRequest, UpdateGymRequest, ChangeGymStatusRequest, SuperAdminDto, UserSearchDto, UserSummaryDto)
- [x] CustomJwtAuthenticationConverter: ya existía desde Fase 1, agrega ROLE_SUPERADMIN si platform_role = SUPERADMIN
- [x] Sin migraciones nuevas: platform_role, status y deleted_at ya existían desde V1/V3
- [x] Queries: GymRepository.findAllWithFilters (paginado con búsqueda), GymMemberRepository.countByGymIdAndStatus/Role, UserRepository.searchByNameOrEmail/findByPlatformRole/countByPlatformRole
- [x] Services: PlatformGymService (list, detail, create, update, changeStatus, delete), PlatformAdminService (listSuperAdmins, promote, demote, searchUsers)
- [x] Controllers: PlatformGymController, PlatformAdminController, PlatformUserController
- [x] WebMvcConfig: excludePathPatterns("/api/platform/**") del TenantInterceptor
- [x] Tests: PlatformGymControllerTest (19/19), PlatformAdminControllerTest (8/8)
- [x] Frontend: PlatformSidebar (Gimnasios, Superadmins)
- [x] Frontend: /platform layout (verifica platformRole SUPERADMIN)
- [x] Frontend: /platform/gyms (lista con filtros status/búsqueda, acciones suspender/reactivar/eliminar)
- [x] Frontend: /platform/gyms/new (crear gym con auto-slug, búsqueda de owner)
- [x] Frontend: /platform/gyms/[gymId] (detalle con stats, zona de peligro)
- [x] Frontend: /platform/admins (lista superadmins, promover/degradar, búsqueda de usuarios)
- [x] Frontend: DeleteGymDialog (confirmación con slug)

### Fase 4 — Training (semanas 6-7)
- [x] Flyway V5 (routine_templates) + V6 (template_blocks) + V7 (template_exercises) + V8 (routine_assignments)
- [x] Entidades: RoutineTemplate, TemplateBlock, TemplateExercise, RoutineAssignment (con @FilterDef/@Filter en gym_id entities)
- [x] Repositories: RoutineTemplateRepository, TemplateBlockRepository, TemplateExerciseRepository, RoutineAssignmentRepository
- [x] DTOs: RoutineTemplateSummaryDto, RoutineTemplateDetailDto, TemplateBlockDto, TemplateExerciseDto, CreateRoutineTemplateRequest (con bloques/ejercicios anidados y @Valid cascading), AssignRoutineRequest, RoutineAssignmentDto, MemberRoutineDto
- [x] RoutineTemplateMapper (MapStruct)
- [x] GymAccessChecker: agregados isCoach(gymId) y isMember(gymId)
- [x] Services: RoutineTemplateService (findByGym, findById, create con cascada blocks+exercises, update con replace, soft delete con validación de asignaciones activas), RoutineAssignmentService (assign con validaciones, getActiveRoutine, getHistory)
- [x] Controllers: RoutineTemplateController (/api/gyms/{gymId}/coach/templates CRUD), RoutineAssignmentController (POST /coach/assignments, GET /member/routine, GET /member/routine/history)
- [x] Tests: RoutineTemplateControllerTest (13/13), RoutineAssignmentControllerTest (7/7)
- [x] Frontend: tipos TS para training (RoutineTemplateSummaryDto, RoutineTemplateDetailDto, TemplateBlockDto, TemplateExerciseDto, RoutineAssignmentDto, MemberRoutineDto)
- [x] Frontend: Sidebar actualizado con link "Asignar Rutina"
- [x] Frontend: /gym/[gymId]/coach/templates (lista con cards, crear, eliminar con confirmación)
- [x] Frontend: /gym/[gymId]/coach/templates/new (editor completo de plantilla con bloques y ejercicios dinámicos)
- [x] Frontend: /gym/[gymId]/coach/templates/[templateId]/edit (editor pre-cargado con PUT)
- [x] Frontend: /gym/[gymId]/coach/assign (formulario de asignación con selects de miembro/plantilla, fechas, preview)
- [x] Frontend: Server Actions (createTemplate, updateTemplate, deleteTemplate, assignRoutine)

### Fase 5 — App Móvil Core (semanas 8-10)
- [ ] Inicializar proyecto Expo (`sgg-app/`)
- [ ] Configurar Supabase Auth + SecureStore
- [ ] Pantalla de login (email + Google OAuth)
- [ ] Hook useAuth + GymStore (Zustand)
- [ ] Pantalla selección de gym
- [ ] Flujo solicitud de membresía
- [ ] Tab: Mi Rutina (vista de rutina activa)

### Fase 6 — Tracking + Coaching (semanas 11-12)
- [ ] Implementar módulo `tracking/`
- [ ] Flyway V9+
- [ ] Tests: TrackingControllerTest
- [ ] App: toggle completar/deshacer ejercicios
- [ ] App: vista de progreso
- [ ] Implementar módulo `coaching/`
- [ ] Flyway V10+
- [ ] Tests: CoachAssignmentControllerTest
- [ ] Panel coach: gestión de asignaciones
- [ ] Panel coach: vista de progreso de members

### Fase 7 — Schedule + Polish (semanas 13-14)
- [ ] Implementar módulo `schedule/`
- [ ] Flyway V11
- [ ] Tests: ScheduleControllerTest
- [ ] Panel admin: CRUD de horarios
- [ ] App: tab Mi Gym (info + horarios)
- [ ] App: tab Perfil (editar perfil + cambiar gym + logout)
- [ ] Testing integral end-to-end
- [ ] Deploy final en servidor

---

## Tests

### Cobertura por Módulo

| Módulo | Tests escritos | Pasando | Cobertura |
|--------|---------------|---------|-----------|
| identity | 10 | 10 | AuthSyncControllerTest (5), UserControllerTest (5) |
| tenancy | 24 | 24 | GymSearchControllerTest (3), JoinRequestControllerTest (5), AdminMembersControllerTest (14), MembershipControllerTest (2) |
| coaching | 0 | 0 | - |
| training | 20 | 20 | RoutineTemplateControllerTest (13), RoutineAssignmentControllerTest (7) |
| tracking | 0 | 0 | - |
| schedule | 0 | 0 | - |
| platform | 27 | 27 | PlatformGymControllerTest (19), PlatformAdminControllerTest (8) |

**Total: 81 tests, 81 pasando**

---

## Notas y Decisiones en Progreso

- **SecurityConfig: `/api/auth/**` requiere autenticación.** A diferencia del template original en ARCHITECTURE.md que listaba `/api/auth/**` como `permitAll()`, se decidió requerir JWT para `/api/auth/sync` para evitar que usuarios no autenticados puedan crear registros arbitrarios en la BD. El endpoint recibe datos en el body pero la autenticación via JWT garantiza que solo usuarios válidos de Supabase puedan llamarlo.

- **Testcontainers: singleton container pattern.** Se usa un container PostgreSQL estático compartido entre todas las clases de test (en `BaseIntegrationTest`) en lugar de `@Container` + `@Testcontainers`, para evitar problemas de lifecycle y reutilizar el Spring context entre tests.

- **Google OAuth configurado.** Google Cloud Console OAuth 2.0 Client ID creado y habilitado en Supabase Authentication → Providers → Google. Login con Google funcional.

- **CORS fix en SecurityConfig.** Se agregó `.cors(cors -> {})` al SecurityFilterChain para que Spring Security procese los preflight OPTIONS antes del filtro de autenticación. Sin esto, el browser no podía hacer fetch al backend desde el frontend.

- **Maven Wrapper:** se agregó `mvnw` / `mvnw.cmd` al proyecto para no depender de Maven instalado globalmente.

- **docker-compose.override.yml:** se removió el volume `/app/.next` del servicio web porque causaba conflicto con Next.js dev mode (el anonymous volume quedaba vacío y bloqueaba la generación del build manifest).

- **AuthorizationDeniedException handler (Fase 2).** Spring Security 6.3 lanza `AuthorizationDeniedException` en vez del clásico `AccessDeniedException` cuando `@PreAuthorize` deniega acceso. Se agregó handler explícito en `GlobalExceptionHandler` que retorna 403.

- **GymMemberDto via JPQL constructor expression (Fase 2).** En vez de cargar GymMember + lazy load User (N+1), se usa un `@Query` con `JOIN` y `SELECT new GymMemberDto(...)` para obtener todo en una sola query.

- **MembershipController ubicado en tenancy (Fase 2).** El endpoint `/api/users/me/memberships` vive en el package `tenancy` para evitar dependencia inversa identity→tenancy, aun cuando el path empiece con `/api/users/`.

- **No se necesitaron migraciones para Fase 3.** Los campos `platform_role` (V1), `status` y `deleted_at` (V3) ya existían en las tablas `users` y `gyms` respectivamente.

- **JPQL CAST para búsqueda con LIKE (Fase 3).** PostgreSQL con Hibernate 6 requiere `CAST(field AS String)` cuando se usa `LOWER(CONCAT('%', :param, '%'))` con parámetros nullable, porque Hibernate infiere el tipo como `bytea` en vez de `text`.

- **MockMvc JWT authorities en tests de platform (Fase 3).** `SecurityMockMvcRequestPostProcessors.jwt()` bypasea el `CustomJwtAuthenticationConverter`, por lo que hay que agregar `.authorities(new SimpleGrantedAuthority("ROLE_SUPERADMIN"))` manualmente en los tests que requieran acceso a `/api/platform/**`.

- **PlatformUserController separado (Fase 3).** El endpoint `GET /api/platform/users?search=` para búsqueda de usuarios vive en un controller aparte porque es un recurso diferente a `/api/platform/admins`.

- **Migraciones V5-V8 en vez de V6-V9 (Fase 4).** La última migración existente era V4, así que las migraciones de training arrancan en V5. El PROGRESS.md original decía V6-V9 pero fue un error de numeración.

- **GymAccessChecker.isCoach() y isMember() (Fase 4).** Se agregaron dos métodos al GymAccessChecker: `isCoach(gymId)` que valida COACH o ADMIN_COACH, y `isMember(gymId)` que valida cualquier miembro ACTIVE. Se usan en `@PreAuthorize` de los endpoints de coach y member respectivamente.

- **CreateRoutineTemplateRequest reutilizado para update (Fase 4).** El PUT /coach/templates/{id} usa el mismo DTO que el POST porque la semántica es "reemplazar toda la plantilla" (bloques y ejercicios se eliminan y recrean). No se justificaba un DTO separado.

- **Página de asignación consume endpoint de admin/members (Fase 4).** La página /coach/assign necesita listar miembros activos del gym. Se amplió el `@PreAuthorize` del GET `/admin/members` para permitir acceso a coaches (`isCoach`), no solo admins. Así los coaches puros pueden listar miembros para asignar rutinas.

- **Hibernate 6.5: @FilterDef solo en una entidad (Fase 4).** Hibernate 6.5 no permite múltiples `@FilterDef` con el mismo nombre en distintas entidades. Se mantiene `@FilterDef` solo en GymMember y las demás entidades (RoutineTemplate, RoutineAssignment) usan solo `@Filter`. La definición global es compartida.

- **Partial index sin NOW() (Fase 4).** PostgreSQL no permite `NOW()` en predicados de índices parciales porque no es IMMUTABLE. El índice `idx_routine_assignments_active` se cambió a filtrar solo `WHERE ends_at IS NULL` en vez de `ends_at IS NULL OR ends_at >= NOW()`.

- **isMember() verifica rol MEMBER explícitamente (Fase 4).** `GymAccessChecker.isMember(gymId)` verifica que el usuario tenga rol "MEMBER" (no COACH ni ADMIN). Esto es intencional: los endpoints `/member/routine` son solo para miembros, no para coaches. Un COACH con membresía ACTIVE pero rol COACH no puede acceder a las rutas de member.

### Bug fixes post-Fase 4

- **BUG-01:** Removido método derivado roto `findByMemberUserIdAndGymIdAndEndsAtIsNullOrEndsAtAfterOrderByStartsAtDesc` de RoutineAssignmentRepository (Spring Data no parsea OR en derived queries con múltiples condiciones).

- **BUG-02/03: N+1 queries corregidas.** `RoutineTemplateServiceImpl.findByGym()` ahora hace batch fetch de bloques y usuarios creadores en 2 queries extra en vez de N. `RoutineAssignmentServiceImpl.getHistory()` hace batch fetch de templates y una sola query para el usuario.

- **BUG-04: Tenant bypass corregido.** `findOrThrow()` y `getActiveRoutine()` ahora usan `findByIdAndGymIdAndDeletedAtIsNull()` en vez de `findByIdAndDeletedAtIsNull()` + filtro Java. Esto previene acceso cross-tenant a plantillas.

- **BUG-05: Prevención de asignaciones duplicadas.** `assign()` ahora verifica con `hasActiveAssignmentForMember()` que el miembro no tenga ya una rutina activa en el gym antes de crear una nueva.

- **BUG-06: Batch inserts.** `saveBlocksAndExercises()` usa `saveAll()` para bloques y ejercicios en vez de `save()` por iteración.

- **BUG-08: SUPERADMIN bypass en endpoints de member.** Se agregó `or hasRole('SUPERADMIN')` a `@PreAuthorize` de GET `/member/routine` y GET `/member/routine/history`.

- **BUG-09: Validación de rol MEMBER en assign.** `assign()` ahora verifica que el usuario destino tenga rol "MEMBER" (no COACH/ADMIN). Solo se asignan rutinas a miembros.

- **BUG-12: Coaches pueden listar miembros.** Se amplió el `@PreAuthorize` de GET `/admin/members` para incluir `isCoach()`. Así la página de asignación funciona para coaches puros (no solo ADMIN_COACH).

- **BUG-13: Fix timezone en fechas de asignación (frontend).** Se cambió de `new Date(startsAt).toISOString()` a template literal `${startsAt}T00:00:00` para evitar que la conversión a UTC desplace la fecha un día.

- **BUG-17: ON DELETE CASCADE.** Migración V9 agrega `ON DELETE CASCADE` a las FKs de `template_blocks.template_id` y `template_exercises.block_id`.
