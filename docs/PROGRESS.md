# SGG — Estado del Proyecto

Actualizar este archivo al completar cada tarea. Claude Code lo lee para saber dónde estamos.

---

## Estado General

**Fase actual:** 0 — Sin iniciar
**Última actualización:** -

---

## Fases

### Fase 1 — Foundation (semanas 1-2)
- [ ] Inicializar proyecto Spring Boot (`sgg-api/`)
- [ ] Configurar `pom.xml` con todas las dependencias
- [ ] Configurar `application.yml` (dev y prod profiles)
- [ ] Implementar módulo `common/` (SecurityConfig, CorsConfig, GlobalExceptionHandler, TenantContext, ApiResponse)
- [ ] Implementar módulo `identity/` (User, AuthIdentity, /auth/sync, /users/me)
- [ ] Configurar Flyway + migraciones V1-V2
- [ ] Tests de integración: AuthSyncControllerTest, UserControllerTest
- [ ] Inicializar proyecto Next.js (`sgg-web/`)
- [ ] Configurar Supabase SSR en Next.js
- [ ] Implementar login page
- [ ] Docker Compose funcional (postgres + api + web)
- [ ] Cloudflared tunnel configurado en servidor

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
| identity | 0 | 0 | - |
| tenancy | 0 | 0 | - |
| coaching | 0 | 0 | - |
| training | 0 | 0 | - |
| tracking | 0 | 0 | - |
| schedule | 0 | 0 | - |
| platform | 0 | 0 | - |

---

## Notas y Decisiones en Progreso

_(Agregar acá cualquier decisión tomada durante el desarrollo que no esté en la arquitectura)_
