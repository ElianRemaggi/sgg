# SGG — Estado del Proyecto

Actualizar este archivo al completar cada tarea. Claude Code lo lee para saber dónde estamos.

---

## Estado General

**Fase actual:** 1 — Foundation (completada)
**Última actualización:** 2026-03-19

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
- [ ] Tests pendientes: GET /api/users/me/memberships (2 tests — requiere módulo tenancy, Fase 2)
- [x] Inicializar proyecto Next.js (`sgg-web/`)
- [x] Configurar Supabase SSR en Next.js
- [x] Implementar login page
- [x] Docker Compose funcional (postgres + api + web)
- [x] Cloudflared tunnel configurado en servidor

### Fase 2 — Tenancy Core (semanas 3-4)
- [ ] Implementar módulo `tenancy/` (Gym, GymMember)
- [ ] TenantInterceptor + Hibernate Filters
- [ ] Flyway V3-V4
- [ ] Tests: GymSearchControllerTest, JoinRequestControllerTest, AdminMembersControllerTest
- [ ] Panel web: listado de miembros
- [ ] Panel web: aprobar/rechazar/bloquear miembros
- [ ] Panel web: cambiar rol de miembro

### Fase 3 — Superadmin (semana 5)
- [ ] Implementar módulo `platform/`
- [ ] CustomJwtAuthenticationConverter (platform_role)
- [ ] Flyway V13 (platform_role en users, status/deleted_at en gyms)
- [ ] Tests: PlatformGymControllerTest, PlatformAdminControllerTest
- [ ] Panel web: sección /platform (ABM de gyms)
- [ ] Panel web: gestión de superadmins

### Fase 4 — Training (semanas 6-7)
- [ ] Implementar módulo `training/`
- [ ] Flyway V6-V9
- [ ] Tests: RoutineTemplateControllerTest, RoutineAssignmentControllerTest
- [ ] Panel coach: CRUD de plantillas de rutina
- [ ] Panel coach: asignación de rutinas

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
- [ ] Flyway V10
- [ ] Tests: TrackingControllerTest
- [ ] App: toggle completar/deshacer ejercicios
- [ ] App: vista de progreso
- [ ] Implementar módulo `coaching/`
- [ ] Flyway V5
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
| tenancy | 0 | 0 | - |
| coaching | 0 | 0 | - |
| training | 0 | 0 | - |
| tracking | 0 | 0 | - |
| schedule | 0 | 0 | - |
| platform | 0 | 0 | - |

---

## Notas y Decisiones en Progreso

- **SecurityConfig: `/api/auth/**` requiere autenticación.** A diferencia del template original en ARCHITECTURE.md que listaba `/api/auth/**` como `permitAll()`, se decidió requerir JWT para `/api/auth/sync` para evitar que usuarios no autenticados puedan crear registros arbitrarios en la BD. El endpoint recibe datos en el body pero la autenticación via JWT garantiza que solo usuarios válidos de Supabase puedan llamarlo.

- **Testcontainers: singleton container pattern.** Se usa un container PostgreSQL estático compartido entre todas las clases de test (en `BaseIntegrationTest`) en lugar de `@Container` + `@Testcontainers`, para evitar problemas de lifecycle y reutilizar el Spring context entre tests.

- **Google OAuth configurado.** Google Cloud Console OAuth 2.0 Client ID creado y habilitado en Supabase Authentication → Providers → Google. Login con Google funcional.

- **CORS fix en SecurityConfig.** Se agregó `.cors(cors -> {})` al SecurityFilterChain para que Spring Security procese los preflight OPTIONS antes del filtro de autenticación. Sin esto, el browser no podía hacer fetch al backend desde el frontend.

- **Maven Wrapper:** se agregó `mvnw` / `mvnw.cmd` al proyecto para no depender de Maven instalado globalmente.

- **docker-compose.override.yml:** se removió el volume `/app/.next` del servicio web porque causaba conflicto con Next.js dev mode (el anonymous volume quedaba vacío y bloqueaba la generación del build manifest).
