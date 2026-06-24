# Plan: Modo self-service — usuarios que se crean sus propias rutinas (gym personal)

## Context

Hoy SGG es un SaaS multi-tenant que se vende a propietarios de gimnasios: un coach crea
plantillas de rutina y se las **asigna** a los members; el member solo consume (ve su rutina,
trackea). El usuario quiere abrir un **modo self-service**: que cualquier persona, sin un coach
de por medio, pueda crearse sus propias rutinas desde la web y entrenarlas/trackearlas — para
captar clientes individuales además de gimnasios.

Decisiones tomadas con el usuario:
- **Convive** con el modelo de gimnasios (no lo reemplaza).
- Se implementa con un **"gym personal"** por usuario, reutilizando toda la infra existente
  (tenancy, training, tracking) — no una tabla aparte.
- Separación vía **columna discriminadora** `type` en `gyms` (`STANDARD` | `PERSONAL`), no tabla nueva.
- **Solo web** (`sgg-web`) por ahora; la app móvil no existe en el repo.

### Idea central (por qué es de bajo riesgo)
Un `User` ya existe independiente de los gyms. El gym personal es un `gyms` row con
`type='PERSONAL'`, `ownerUserId = user`, y una sola membresía: el propio user con rol **MEMBER**.
Con el owner como MEMBER:
- El lado member (`/member/routine`, tracking, historial) funciona **sin cambios** (`isMember` ya da true).
- El invariante BUG-09 (solo se asigna a rol MEMBER) queda **intacto**: el owner ES member.
- El **único** cambio de autorización es extender `isCoach` para que el dueño de un gym PERSONAL
  pueda crear/editar plantillas y auto-asignarse (que hoy es coach-only).
El gym se crea **lazy** (al entrar por primera vez al modo personal), así no se ensucia `gyms`
con users que solo se unen a gimnasios reales.

---

## Backend (`sgg-api`)

### Fase B1 — Columna `type` y exclusiones
1. **Migración `V20__add_type_to_gyms.sql`**: `ALTER TABLE gyms ADD COLUMN type VARCHAR(20) NOT NULL
   DEFAULT 'STANDARD'` + `CHECK (type IN ('STANDARD','PERSONAL'))`. Índice parcial sobre
   `(owner_user_id) WHERE type='PERSONAL'` para el lookup del gym personal.
2. **`Gym.java`** (`tenancy/entity`): agregar campo `type` (default `"STANDARD"`).
3. **Gyms personales nunca son públicamente visibles** — se aplican estas guardas en cascada:
   - `GymService.searchBySlug()` y `searchByName()`: añadir `AND type = 'STANDARD'` a las queries.
     Un gym personal tiene slug `"personal-{userId}"` que podría adivinarse; la guarda en la query
     lo hace inaccesible aunque el slug sea conocido.
   - `GymSearchController.getGymInfo()` (`GET /api/gyms/{gymId}/info`): este endpoint omite el check
     de membresía (`SKIP_MEMBERSHIP_PATHS`). Agregar validación explícita en el service: si
     `gym.getType().equals("PERSONAL")`, retornar 404 (`ResourceNotFoundException`).
   - `PlatformGymServiceImpl` (listado superadmin): filtrar `type = 'STANDARD'` por defecto; los gyms
     personales no deben aparecer en el ABM de gimnasios reales.

### Fase B2 — Gym personal + autorización self-service
4. **Endpoint "ensure personal gym"**: `POST /api/users/me/personal-gym` (fuera del `TenantInterceptor`,
   bajo `/api/users/**`). Idempotente: si el user ya tiene un gym `PERSONAL`, lo devuelve; si no, crea
   `Gym(type=PERSONAL, ownerUserId=current, name="Entrenamiento personal", slug="personal-{userId}",
   status=ACTIVE)` + `GymMember(role="MEMBER", status="ACTIVE")`. Reusa el patrón de creación de
   `PlatformGymServiceImpl.createGym()` (pero rol MEMBER en vez de ADMIN, y sin requerir SUPERADMIN).
   Devuelve `{ gymId }`. Crear `UserPersonalGymController`/service en `identity` o `tenancy`.
5. **`TenantContext` + `TenantInterceptor`** — extender para cargar `gymType` y `gymOwnerUserId` sin
   costo extra:
   - `TenantContext`: agregar dos `ThreadLocal` nuevos (`gymType: String`, `gymOwnerUserId: Long`) con
     sus getters/setters; extender `clear()` para limpiarlos.
   - `TenantInterceptor.preHandle()`: el interceptor ya fetchea el `Gym` en la línea 50 para validar
     que existe. En lugar de descartarlo, retenerlo y llamar a
     `TenantContext.setGymType(gym.getType())` y `TenantContext.setGymOwnerUserId(gym.getOwnerUserId())`
     inmediatamente después (antes del check de membresía). Costo adicional: **cero queries**.
   
6. **`GymAccessChecker.isCoach`** (`common/security`): extender para devolver `true` también cuando el
   user actual es **owner de un gym PERSONAL**. **No requiere inyectar `GymRepository`**. Lógica:
   ```
   // short-circuit existente (O(1), desde TenantContext)
   if (COACH / ADMIN_COACH en rol cacheado) → true
   // nueva rama, también O(1): datos ya en TenantContext
   if ("PERSONAL".equals(TenantContext.getGymType())
       && currentUserId.equals(TenantContext.getGymOwnerUserId())) → true
   // fallback a DB (paths sin TenantContext — ej: SUPERADMIN bypass)
   gymMemberRepository.findByGymIdAndUserIdAndStatus(...)
   ```
   Esto habilita: crear/editar/borrar plantillas (`RoutineTemplateController`) y
   `POST /coach/assignments` (auto-asignación).
7. **Auto-asignación**: NO requiere endpoint nuevo. El frontend personal llama al existente
   `POST /api/gyms/{personalGymId}/coach/assignments` con `memberUserId = su propio userId`. El check
   de rol en `RoutineAssignmentServiceImpl:57` pasa porque el owner es MEMBER. El invariante de "una
   rutina activa" (BUG-05) sigue aplicando.
8. **Finalizar rutina activa** (para poder cambiar de rutina): agregar endpoint para cerrar la
   asignación activa (`endsAt = now`). `POST /api/gyms/{gymId}/member/routine/finish` (rol member).
   Necesario porque hoy no existe forma de terminar una asignación antes de su `endsAt`, y BUG-05
   bloquea tener dos activas.
9. **`MembershipDto`** (`/api/users/me/memberships`): agregar `gymType` para que el frontend distinga
   la membresía personal de las de gimnasios reales. El query JPQL en `GymMemberRepository`
   (`SELECT new MembershipDto(...)`) es un constructor expression hardcodeado — hay que agregar
   `g.type` al JOIN y al constructor explícitamente. Actualizar DTO y mapper.

### Tests de integración (extender `BaseIntegrationTest`)
- Ensure-personal-gym es idempotente (segunda llamada no duplica).
- Owner de gym personal: puede crear plantilla y auto-asignarse; un MEMBER de gym **real** sigue sin poder.
- Finalizar rutina activa permite iniciar otra.
- `GymSearch` (slug y by-name) no devuelve gyms `PERSONAL`.
- `GET /api/gyms/{personalGymId}/info` devuelve 404.
- `isCoach` devuelve true para el owner del gym personal sin hacer queries extras
  (verificar con un spy/contador de queries si se quiere ser exhaustivo).

---

## Frontend (`sgg-web`)

### Fase F1 — Punto de entrada y flag de membresía
10. **`select-gym/page.tsx`**: agregar card/botón **"Entrenamiento personal"**. Al hacer click, server
    action → `POST /api/users/me/personal-gym` → `redirect('/gym/{gymId}/member/routine')`. Separar la
    membresía personal de "Mis gyms" usando el nuevo `gymType`, y **excluirla del auto-redirect** de
    membresía única (`select-gym/page.tsx:37-40`) para que no fuerce entrar al gym personal.
11. **`types.ts`**: agregar `gymType: string` a `MembershipDto`.

### Fase F2 — Modo personal (sidebar + self-assign + finish)
12. **`gym/[gymId]/layout.tsx`**: detectar gym personal (desde la membership con `gymType==='PERSONAL'`)
    y pasar `isPersonalGym` al `Sidebar`.
13. **`components/sidebar.tsx`**: cuando `isPersonalGym`, renderizar un set simplificado y sin jerga de
    gym: **"Mis Rutinas"** → `coach/templates` (reusa el editor existente), **"Entrenar"** →
    `member/routine`, **"Historial"** → `member/history`, **"Perfil"**. Ocultar las secciones
    admin/coach/member estándar (incluyendo el módulo Coaches, que no aplica en modo personal).
14. **Reutilizar tal cual**: `coach/templates/template-editor.tsx` (crear/editar rutina) y
    `member/routine/routine-tracking-view.tsx` + `exercise-row.tsx` (entrenar/trackear) — ya están
    desacoplados de quién creó la rutina; funcionan sin cambios en el gym personal.
15. **"Empezar esta rutina"**: en `coach/templates/templates-view.tsx`, en modo personal, agregar botón
    por plantilla que auto-asigna (server action → `POST coach/assignments` con `memberUserId` = id del
    user de `/api/users/me`, `startsAt = now`). Manejar 409 (BUG-05) ofreciendo "Finalizar rutina actual".
16. **"Finalizar rutina actual"** en `member/routine` (modo personal): server action → endpoint del paso 8.

---

## Archivos críticos
- Backend: `sgg-api/src/main/resources/db/migration/V20__add_type_to_gyms.sql` (nuevo),
  `tenancy/entity/Gym.java`,
  `common/multitenancy/TenantContext.java` (nuevos campos gymType/gymOwnerUserId),
  `common/multitenancy/TenantInterceptor.java` (setear los nuevos campos desde el Gym ya fetcheado),
  `common/security/GymAccessChecker.java` (extender isCoach con TenantContext, sin GymRepository),
  `tenancy/service/GymService.java` + `GymServiceImpl.java` (filtrar PERSONAL en search e info),
  `platform/service/PlatformGymServiceImpl.java` (filtrar PERSONAL en listado superadmin),
  nuevo `UserPersonalGymController`/service,
  `training/service/RoutineAssignmentServiceImpl.java` + controller (endpoint finish),
  DTO/mapper de membresías (`MembershipDto`, `GymMemberRepository` query JPQL).
- Frontend: `app/(dashboard)/select-gym/page.tsx`, `app/(dashboard)/gym/[gymId]/layout.tsx`,
  `components/sidebar.tsx`, `app/(dashboard)/gym/[gymId]/coach/templates/templates-view.tsx`,
  `app/(dashboard)/gym/[gymId]/member/routine/` (botón finish), `lib/api/types.ts`.

## Verificación end-to-end
1. Backend: `cd sgg-api && mvn verify` (corre los tests de integración nuevos con Testcontainers).
2. Manual (dev): `./scripts/reset-dev-db.sh` + `docker-compose up`, `cd sgg-web && npm run dev`.
   - Registrar un usuario nuevo (sin gym) → login → en `select-gym` aparece "Entrenamiento personal".
   - Entrar → crear una rutina en "Mis Rutinas" → "Empezar esta rutina" → ir a "Entrenar" → marcar
     ejercicios y verificar progreso/tracking → ver "Historial".
   - "Finalizar rutina actual" → empezar otra plantilla sin error 409.
   - Verificar que el gym personal NO aparece en el buscador público ni en el panel superadmin.
   - Verificar que un usuario miembro de un gym **real** sigue sin poder crear plantillas.
3. `cd sgg-web && npm test` para unit/integration del front afectado.
