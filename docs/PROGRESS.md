# SGG — Estado del Proyecto

Actualizar este archivo al completar cada tarea. Claude Code lo lee para saber dónde estamos.

---

## Estado General

**Fase actual:** 8 — Tests App Móvil
**Última actualización:** 2026-05-13

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

### Fase 5 — Web completa: Tracking + Schedule + Profile + PWA (semanas 8-10)

#### Sub-Fase 5.1 — Tracking Backend
- [x] Flyway V12 (`exercise_completions` con peso, reps, notas, UNIQUE por assignment+exercise+user)
- [x] Módulo `com.sgg.tracking`: ExerciseCompletion entity, repository, DTOs (Complete/UndoRequest, ExerciseCompletionDto, TrackingProgressDto), mapper MapStruct
- [x] TrackingService: `completeExercise` (upsert), `undoExercise` (idempotente), `getProgress`, `getMemberProgress`
- [x] TrackingController: POST /member/tracking/complete, POST /member/tracking/undo, GET /member/tracking/progress, GET /coach/tracking/{memberId}
- [x] Tests: TrackingControllerTest (10 tests — requieren Docker Desktop)

#### Sub-Fase 5.2 — Tracking Frontend
- [x] Tipos TS: `ExerciseCompletionDto`, `TrackingProgressDto` en `lib/api/types.ts`
- [x] Server actions: `completeExercise`, `undoExercise`
- [x] `exercise-row.tsx`: toggle expandir, inputs peso/reps/notas, botón Completar, badges en completado, botón Deshacer
- [x] `routine-tracking-view.tsx`: progress bar, stats (hoy/total/%), listado de bloques con ExerciseRow
- [x] `page.tsx` actualizado: fetch rutina + progreso en paralelo con `Promise.allSettled`

#### Sub-Fase 5.3 — Schedule Backend + Frontend
- [x] Flyway V13 (`schedule_activities` con day_of_week, start_time, end_time, is_active)
- [x] Módulo `com.sgg.schedule`: entity, repository, DTOs (ScheduleActivityDto, Create/UpdateRequest), mapper (días en español), service, controller
- [x] Endpoints: GET /schedule (autenticado), POST/PUT/DELETE /admin/schedule
- [x] Tests: ScheduleControllerTest (8 tests — requieren Docker Desktop)
- [x] Frontend Admin: `schedule-admin-view.tsx` (grilla semanal), `schedule-form-dialog.tsx` (crear/editar), `actions.ts`
- [x] Frontend Member: vista read-only agrupada por día

#### Sub-Fase 5.4 — Profile Frontend
- [x] `profile-view.tsx`: avatar, nombre editable (PUT /api/users/me), email read-only, info membresía, logout
- [x] `page.tsx`: fetch usuario + membresías en paralelo, pasa membresía del gym actual

#### Sub-Fase 5.5 — PWA + Sidebar
- [x] `public/manifest.json`: name SGG, display standalone, start_url /select-gym, theme_color
- [x] `public/sw.js`: service worker network-first con offline fallback para navegación
- [x] `public/offline.html`: página sin internet con botón reintentar
- [x] `public/icons/icon-192x192.png` + `icon-512x512.png`: íconos válidos
- [x] `sw-register.tsx`: registro del SW (client component)
- [x] `app/layout.tsx`: meta tags PWA, manifest link, ServiceWorkerRegister, lang="es"
- [x] `next.config.mjs`: headers Cache-Control y Service-Worker-Allowed para sw.js
- [x] Sidebar actualizado: member links = Mi Rutina + Horarios + Perfil

#### Sub-Fase 5.6 — Historial de Rutinas con Progresión de Peso
- [x] Flyway V16: agrega `session_date DATE` a `exercise_completions`; UNIQUE pasa a `(assignment_id, exercise_id, user_id, session_date)` para permitir múltiples sesiones por día
- [x] `ExerciseCompletion` entity: nuevo campo `sessionDate`
- [x] `ExerciseCompletionRepository`: upsert por `session_date`, queries de historial y progresión
- [x] `TrackingServiceImpl`: complete/undo usan fecha de hoy; `getProgress` filtra por sesión actual
- [x] `RoutineHistoryService` + Impl: `getMemberHistory`, `getAssignmentDetail`, `getExerciseProgress` con stats (mejor peso, promedio, delta%, días entrenados)
- [x] `MemberHistoryController`: GET `/member/history/assignments` y sub-rutas
- [x] `CoachHistoryController`: GET `/coach/history/{memberId}/assignments` y sub-rutas
- [x] 8 DTOs nuevos: `AssignmentHistorySummaryDto`, `AssignmentHistoryDetailDto`, `ExerciseProgressDto`, `ExerciseSessionDto`, `ExerciseStatsDto`, `HistoryBlockDto`, `HistoryExerciseSummaryDto`, `HistoryStatsDto`
- [x] Tests: `MemberHistoryControllerTest` (10), `CoachHistoryControllerTest` (7), +1 en `TrackingControllerTest` (session_date multi-sesión)
- [x] Frontend tipos TS para todos los DTOs de historial
- [x] Sidebar: ítem "Historial" para miembros con activación por sub-ruta
- [x] Componentes en `src/components/history/`: `HistoryListView` (tabs activa/pasadas), `AssignmentDetailView`, `ExerciseProgressView` (gráfico SVG nativo + stats cards)
- [x] Páginas member: `/member/history`, `/[assignmentId]`, `/exercises/[exerciseId]`
- [x] Páginas coach: `/coach/history/[memberId]`, `/[assignmentId]`, `/exercises/[exerciseId]`

#### Sub-Fase 5.7 — Username + Login Dual
- [x] Flyway V15: agrega columna `username` a `users` con backfill desde email (dominio removido, colisiones resueltas con sufijo numérico)
- [x] `UsernameGenerator`: genera username único a partir del email para usuarios Supabase
- [x] `RegisterRequest`: ahora requiere `username`
- [x] `LoginRequest`: acepta email o username como identificador (campo `identifier`)
- [x] `UserRepository`: `findByUsername`, `findByEmailOrUsername`
- [x] `UsernameGeneratorTest` (8 tests)
- [x] Tests extendidos: `NativeAuthControllerTest` (+4 → 12 total), `AdminMembersControllerTest` (+6 → 20 total), `GymSearchControllerTest` (+5 → 8 total)
- [x] Coach puede rechazar y bloquear miembros (antes solo admin)
- [x] Frontend: login form acepta email o username

#### Sub-Fase 5.8 — Landing Page Pública + Design System Aether
- [x] Landing page en `/landing` con GSAP, animaciones scroll, secciones hero/features/roles/steps/CTA
- [x] Middleware actualizado: `/` redirige a `/landing` sin requerir vars de Supabase
- [x] Design system Aether aplicado a todo el panel (tokens CSS, clases `bg-app-gradient`, `glow`, gradientes por sección)
- [x] Sidebar rediseñado: colores por sección (admin/coach/member) y gradiente
- [x] `CardGlow`: nueva variante de `Card` con glow effect
- [x] Páginas de auth rediseñadas con tokens Aether (bg-card, border-border, gradiente indigo→cyan en CTA)
- [x] Routine view: días como tabs deslizables (swipeable) en lugar de scroll vertical; se abre automáticamente en el día actual
- [x] Paleta landing rediseñada: violeta/cyan/verde; copy honesto (sin stats inventados)

#### Sub-Fase 5.9 — Infraestructura de Testing Frontend
- [x] Vitest + Testing Library para unit/integration tests
- [x] Playwright para E2E con fixtures y MSW handlers
- [x] GitHub Actions CI (`.github/workflows/web-tests.yml`): lint, typecheck y tests en push
- [x] `tsconfig.json`: archivos de test excluidos para evitar conflicto de tipos vite/vitest en build
- [x] Tests unitarios: `login-form.test.tsx`, `routine-tracking-view.test.tsx`, `api/auth/native/route.test.ts`, `history/` (3 archivos), `api/client.test.ts`, `middleware.test.ts`
- [x] Tests E2E: `auth.spec.ts`, `member-routine.spec.ts`, `member-history.spec.ts`, `coach-history.spec.ts`
- [x] Documentación: `docs/frontend/TESTING.md`

#### Bug Fixes y Polish Post-Fase 5
- [x] DualJwtDecoder: algoritmo HS384 especificado explícitamente (fix decode nativo)
- [x] Flyway V14 (`fix_schedule_day_of_week_type`) recuperada al repo (estaba aplicada en prod pero sin commitear)
- [x] `TrackingProgressDto`: campos opcionales faltantes agregados
- [x] `exercise-row.tsx`: markup simplificado, layout mobile mejorado, confirmación al deshacer
- [x] Platform/gyms/new: búsqueda de owner refactorizada a server action
- [x] `seed-dev-db.sh`: reescrito para reflejar datos actuales (usuarios con `password_hash`, `username`, rutinas Push/Pull)
- [ ] *(pendiente commit)* `select-gym/page.tsx`: auto-redirect role-aware para usuario con un solo gym activo (admin→members, coach→templates, member→routine)

### Fase 6 — App Móvil Core ✅
- [x] Inicializar proyecto Expo (`sgg-app/`) con NativeWind, React Query, Zustand, Expo Router
- [x] Configurar Supabase Auth + SecureStore (`lib/supabase.ts`)
- [x] API client con JWT automático (`lib/api.ts`); auth nativa (`lib/auth.ts`)
- [x] Pantalla de login (email/username + Google OAuth via expo-auth-session)
- [x] Pantalla de registro (nombre, email, username, contraseña)
- [x] Hook `useGymStore` (Zustand + SecureStore persist)
- [x] `app/_layout.tsx`: BootstrapGate — bootstrap de sesión y redirección automática
- [x] Pantalla `select-gym.tsx`: lista membresías + búsqueda por slug + solicitud de acceso
- [x] Tab Mi Rutina (`(routine)/index.tsx`): rutina activa, selector de día, progress bar, BlockSection + ExerciseRow con optimistic updates, peso/reps/notas
- [x] Tab Historial (`(routine)/history.tsx`): lista de asignaciones pasadas
- [x] Tab Progreso (`(progress)/index.tsx`): ProgressRing SVG animado, stats hoy/total/pendientes, link al historial
- [x] Tab Mi Gym (`(gym)/index.tsx`): info del gym + membresía + link a horarios
- [x] Tab Horarios (`(gym)/schedule.tsx`): actividades agrupadas por día, highlight del día actual
- [x] Tab Perfil (`(profile)/index.tsx`): editar nombre (modal), gym activo, cambiar gym, unirse a gym, cerrar sesión
- [x] Componentes UI: Button, Card, Badge, Input, Skeleton, EmptyState, ErrorScreen
- [x] Componentes de rutina: BlockSection, ExerciseRow, RoutineProgressBar, ProgressRing
- [x] Tipos TS completos en `types/api.ts` (todos los DTOs del backend)
- [x] Query keys centralizadas en `lib/queryKeys.ts`
- [x] Providers: QueryProvider, ToastProvider

### Fase 7 — App Móvil: Historial Detallado ✅
- [x] Stack layout en `(routine)/_layout.tsx` para navegación anidada dentro del tab
- [x] `history.tsx` actualizado: items tappables con ChevronRight → navegan al detalle
- [x] `history/[assignmentId]/index.tsx`: detalle de asignación (stats, bloques, ejercicios con mejor/último peso)
- [x] `history/[assignmentId]/exercise/[exerciseId].tsx`: progresión de ejercicio con gráfico SVG (react-native-svg), stats cards, lista de sesiones
- [x] Tipos TS: `AssignmentHistoryDetailDto`, `HistoryBlockDto`, `HistoryExerciseSummaryDto`, `HistoryStatsDto`, `ExerciseProgressDto`, `ExerciseSessionDto`, `ExerciseStatsDto`
- [x] Query keys: `assignmentDetail`, `exerciseProgress`

### Fase 8 — Tests App Móvil ✅
- [x] Infraestructura: `jest.config.js` (jest-expo preset, path aliases, transformIgnorePatterns), `jest.setup.ts` (mocks globales de expo-router, expo-secure-store, react-native-svg, lucide-react-native, supabase, expo-web-browser)
- [x] Mock manual de `react-native-reanimated` en `__mocks__/react-native-reanimated.js` (evita carga nativa de worklets en tests)
- [x] `tests/utils/render.tsx`: wrapper de tests con QueryClient (retry:false) + ToastProvider
- [x] `store/__tests__/gymStore.test.ts`: 4 tests unitarios del store Zustand (initial state, setGym, clearGym, múltiples llamadas)
- [x] `app/(auth)/__tests__/login.test.tsx`: 5 tests (render, validación, login exitoso, error API, error genérico)
- [x] `app/__tests__/select-gym.test.tsx`: 5 tests (render membresías, navegación, form de búsqueda, resultado de búsqueda)
- [x] `app/(main)/(routine)/__tests__/routine-index.test.tsx`: 4 tests (render, fecha, 404 empty state, error screen)
- [x] `app/(main)/(routine)/__tests__/routine-history.test.tsx`: 5 tests (render lista, badge activa, header, navegación, empty state)
- [x] **23 tests · 5 suites · 0 fallos**

---

## Tests

### Cobertura por Módulo

| Módulo | Tests escritos | Pasando | Cobertura |
|--------|---------------|---------|-----------|
| identity | 30 | 30 | NativeAuthControllerTest (12), AuthSyncControllerTest (5), UserControllerTest (5), UsernameGeneratorTest (8) |
| tenancy | 37 | 37 | GymSearchControllerTest (8), JoinRequestControllerTest (7), AdminMembersControllerTest (20), MembershipControllerTest (2) |
| training | 20 | 20 | RoutineTemplateControllerTest (13), RoutineAssignmentControllerTest (7) |
| tracking | 28 | 28* | TrackingControllerTest (11), MemberHistoryControllerTest (10), CoachHistoryControllerTest (7) |
| schedule | 7 | 7* | ScheduleControllerTest (7) |
| platform | 27 | 27 | PlatformGymControllerTest (18), PlatformAdminControllerTest (9) |

**Total: 149 tests** (\* tracking, history y schedule requieren Docker Desktop corriendo)

### Tests Frontend (Vitest + Playwright)

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `login-form.test.tsx` | unit | Login con email, username, errores |
| `routine-tracking-view.test.tsx` | unit | Tracking de ejercicios, progress bar |
| `api/auth/native/route.test.ts` | unit | API route de auth nativa |
| `history/assignment-detail-view.test.tsx` | unit | Vista de detalle de asignación |
| `history/exercise-progress-view.test.tsx` | unit | Gráfico de progresión |
| `history/history-list-view.test.tsx` | unit | Lista de historial con tabs |
| `api/client.test.ts` | unit | API client, manejo de errores |
| `middleware.test.ts` | unit | Redirecciones y protección de rutas |
| `auth.spec.ts` | E2E | Flujo de login/logout |
| `member-routine.spec.ts` | E2E | Tracking de rutina |
| `member-history.spec.ts` | E2E | Historial del miembro |
| `coach-history.spec.ts` | E2E | Historial desde perspectiva coach |

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

### Decisiones Fase 5

- **Web-first para members.** Se decidió implementar toda la experiencia del member en web (en vez de mobile-only) y convertir el web en PWA instalable. La app móvil queda para Fase 6 como segunda capa.

- **Tracking con upsert.** `completeExercise` hace upsert (find-or-create) para que sea idempotente. Completar el mismo ejercicio dos veces actualiza los datos en lugar de crear un registro duplicado.

- **`toast(message, type)` — NO `toast({ type, message })`.** El hook `useToast` del proyecto usa la firma `(message: string, type?: string)`, no un objeto. Error fácil de cometer al crear nuevos componentes.

- **Schedule: soft-delete via `is_active = false`.** En lugar de `deleted_at`, las actividades usan `is_active BOOLEAN`. Se diferencia de otras tablas porque aquí "desactivar" es una operación normal del flujo de admin (no una eliminación excepcional).

- **PWA icons generados con Node.js.** Se generaron PNGs válidos (24×24×27 solid color) programáticamente con Node.js ya que Python no estaba disponible en el entorno.

- **ESLint errors pre-existentes corregidos (Fase 5).** Se corrigieron errores de lint en archivos de fases anteriores que impedían el build: `unused vars` en login-form.tsx, member-actions.tsx, assign-view.tsx; `no-empty-object-type` en input.tsx y select.tsx.

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

### Decisiones Sub-Fases 5.6 — 5.9

- **session_date en exercise_completions (Sub-Fase 5.6).** El UNIQUE constraint pasó de `(assignment_id, exercise_id, user_id)` a `(assignment_id, exercise_id, user_id, session_date)`. Esto permite registrar el mismo ejercicio en días distintos (múltiples sesiones), que es el comportamiento real de un entrenamiento. `getProgress` filtra solo la sesión de hoy; el historial acumula todas.

- **RoutineHistoryService separado de TrackingService (Sub-Fase 5.6).** El historial y la progresión son consultas de lectura complejas con múltiples joins y cálculos (delta%, mejor peso). Se justificó un service separado para no sobrecargar `TrackingService` y mantener la coherencia con la regla de un servicio por responsabilidad.

- **Gráfico SVG nativo sin librería (Sub-Fase 5.6).** `ExerciseProgressView` usa SVG generado programáticamente en lugar de Recharts/Chart.js. Evita agregar una dependencia pesada para un solo componente; el gráfico de líneas es suficientemente simple para hacerlo manual.

- **Username con backfill desde email (Sub-Fase 5.7).** V15 hace backfill usando la misma lógica que `UsernameGenerator`: toma el segmento antes del `@`, remueve caracteres inválidos, y agrega sufijo numérico si hay colisión. El campo es `UNIQUE NOT NULL` con índice.

- **LoginRequest usa `identifier` (Sub-Fase 5.7).** En lugar de dos campos separados `email` y `username` en el request de login, se usa un único campo `identifier` que puede ser email o username. El service lo detecta por la presencia del `@`.

- **Landing page sin autenticación de Supabase (Sub-Fase 5.8).** El middleware fue actualizado para que `/` redirija a `/landing` directamente, sin necesidad de que las vars de Supabase estén configuradas. Esto permite que el sitio sea accesible públicamente incluso en entornos sin Supabase.

- **GSAP para animaciones de landing (Sub-Fase 5.8).** Se agregó `gsap` como dependencia. Las animaciones son scroll-triggered (ScrollTrigger plugin). Alternativa considerada: Framer Motion, descartada por ser más pesada y estar pensada para animaciones de componentes React, no de scroll narrativo.

- **tsconfig.json excluye tests en build (Sub-Fase 5.9).** Los archivos `*.test.ts(x)` y `*.spec.ts` se excluyeron del `tsconfig.json` principal de Next.js para evitar conflictos de tipos entre los globals de `vite/client` y los de `@vitest/globals` durante `next build`.

- **MSW para mocking en tests frontend (Sub-Fase 5.9).** Los tests de componentes usan Mock Service Worker (MSW) en lugar de `jest.mock` / `vi.mock` sobre el API client. Esto testea la integración real de fetch → handler → componente, sin acoplar los tests a la implementación interna del cliente.

- **DualJwtDecoder algoritmo HS384 explícito.** La firma del secreto nativo usa HS384 pero `MacAlgorithm` no se estaba especificando explícitamente, causando que en algunos builds el decoder fallara al verificar tokens nativos. Se corrigió pasando `MacAlgorithm.HS384` explícitamente al `NimbusJwtDecoder`.
