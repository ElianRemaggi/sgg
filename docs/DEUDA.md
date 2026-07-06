# SGG — Deuda Técnica

Registrar acá toda la deuda técnica identificada. Actualizar estado cuando se resuelva.

**Leyenda de prioridad:** 🔴 Alta · 🟡 Media · 🟢 Baja  
**Leyenda de estado:** `pendiente` · `en progreso` · `resuelto`

---

## Backend

### ~~🔴 DT-01 — Roles y status como `String` en vez de `Enum`~~

**Estado:** resuelto (2026-07-06)  
**Archivos afectados:** `GymMember.java`, `Gym.java`, `GymAccessChecker.java`, `TenantInterceptor.java`, `GymMemberServiceImpl.java`, `RoutineAssignmentServiceImpl.java`, `PlatformGymServiceImpl.java`, `PersonalGymServiceImpl.java`, `GymServiceImpl.java`, `CoachAssignmentServiceImpl.java`, `UserServiceImpl.java` y DTOs relacionados

**Problema:**  
`GymMember.role`, `GymMember.status` y `Gym.status` eran `String`. Había ~30 string literals dispersos en código productivo. Un typo pasaba el compilador y solo explotaba en runtime — con riesgo de bug de seguridad si la comparación de rol fallaba silenciosamente.

**Solución aplicada:** 4 enums en `com.sgg.tenancy.entity` (uno más de lo previsto — `GymType` también se convirtió, y los value sets reales resultaron más amplios que lo documentado originalmente):
```java
public enum GymMemberRole   { MEMBER, COACH, ADMIN, ADMIN_COACH }
public enum GymMemberStatus { PENDING, ACTIVE, REJECTED, BLOCKED, INACTIVE }
public enum GymStatus       { ACTIVE, SUSPENDED, DELETED }
public enum GymType         { STANDARD, PERSONAL }
```
Entidades anotadas con `@Enumerated(EnumType.STRING)`. Migración `V21__enforce_role_status_enums.sql` agrega CHECK constraints en BD para los mismos value sets. Los DTOs de respuesta (`GymMemberDto`, `MembershipDto`, `GymSummaryDto`, `GymDetailDto`, `JoinRequestResponse`) ahora tipan role/status/type con los enums — el JSON de salida no cambia (Jackson serializa `enum.name()`). Los DTOs de request (`UpdateMemberRoleRequest`, `ChangeGymStatusRequest`) se mantienen `String` con `@Pattern`, y se parsean a enum dentro del service.

**Esfuerzo real:** ~1 sesión (incluyó descubrir 3 value sets reales no documentados: `REJECTED`/`INACTIVE` en member status y `DELETED` en gym status).

---

### ~~🔴 DT-02 — `common` depende de `tenancy`~~

**Estado:** resuelto (2026-07-06)  
**Archivos afectados:** `GymAccessChecker.java`, `TenantInterceptor.java`

**Problema:**  
`GymAccessChecker` y `TenantInterceptor` estaban en `com.sgg.common` pero importaban `GymMemberRepository` y `GymRepository` de `com.sgg.tenancy`, violando la regla de que `common` es una hoja.

**Solución aplicada:**
- Nueva interfaz `GymTenantResolver` (+ record `GymTenantInfo`) en `com.sgg.common.multitenancy`, con métodos que devuelven tipos primitivos/String — nunca entidades de `tenancy`.
- `GymTenantResolverImpl` en `com.sgg.tenancy.security` implementa el puerto usando `GymRepository`/`GymMemberRepository`.
- `TenantInterceptor` (queda en `common`) ahora depende de `GymTenantResolver` en vez de los repositorios de `tenancy`.
- `GymAccessChecker` se movió a `com.sgg.tenancy.security` (mismo nombre de bean `"gymAccessChecker"`, sin impacto en los `@PreAuthorize` que lo referencian por SpEL).

Verificado: `grep -rn "com.sgg.tenancy" sgg-api/src/main/java/com/sgg/common/` no devuelve dependencias reales (solo un comentario).

**Esfuerzo real:** ~1 sesión (bundleado con DT-01, ya que `GymAccessChecker` necesitaba los enums nuevos de todos modos).

---

### ~~🟡 DT-10 — `common` depende de `identity`~~

**Estado:** resuelto (2026-07-06)  
**Archivos afectados:** `SecurityUtils.java`, `CustomJwtAuthenticationConverter.java`, `NativeJwtConfig.java` (los 3 en `com.sgg.common`)

**Problema:**  
Detectado al resolver DT-02. El alcance real era mayor a lo documentado originalmente (que solo mencionaba `SecurityUtils`): `CustomJwtAuthenticationConverter` (resuelve el JWT y otorga `ROLE_SUPERADMIN`) y `NativeJwtConfig` (arma el JWT nativo a partir de un `User`) tenían la misma violación — los 3 importaban `User`/`UserRepository` de `com.sgg.identity`.

**Solución aplicada:** Mismo patrón que DT-02.
- Puerto `CurrentUserResolver` (+ record `ResolvedUser(id, platformRole)`) en `com.sgg.common.security`, implementado en `com.sgg.identity.security.CurrentUserResolverImpl`.
- `SecurityUtils`: `getCurrentUserId()` usa el puerto (cachea el `Long` en vez de la entidad); se eliminó `getCurrentUser()` (solo lo usaba `UserController`, que ya tenía `userService.getProfile(userId)` disponible).
- `CustomJwtAuthenticationConverter`: resuelve vía el puerto en vez de `UserRepository` directo. De paso corrige una inconsistencia: el path de token nativo ahora excluye usuarios `deletedAt != null` al otorgar `ROLE_SUPERADMIN`, igual que ya hacía `SecurityUtils`.
- `NativeJwtConfig.generateToken` pasó de recibir la entidad `User` a recibir `(Long userId, String email)` — actualizados los 2 call sites en `NativeAuthService` y 1 en test.

Verificado: `grep -rn "com.sgg.identity" sgg-api/src/main/java/com/sgg/common/` no devuelve dependencias reales (solo un comentario). 206/206 tests OK en build limpio (`mvn clean verify`).

**Esfuerzo real:** ~1 sesión.

---

### 🟡 DT-03 — Doble consulta de membresía por request

**Estado:** resuelto  
**Archivos afectados:** `TenantInterceptor.java`, `GymAccessChecker.java`

**Problema:**  
Cada request autenticado a un endpoint de gym ejecuta 2 queries a `gym_members`:

1. `TenantInterceptor.preHandle` → `existsByGymIdAndUserIdAndStatusIn(gymId, userId, ["ACTIVE"])`
2. `@PreAuthorize("@gymAccessChecker.isAdmin(#gymId)")` → `findByGymIdAndUserIdAndStatus(gymId, userId, "ACTIVE")`

Los datos son idénticos. La segunda query siempre ocurre después de la primera.

**Solución:** Guardar el `GymMember` resuelto en `TenantContext` (ya es ThreadLocal) durante `preHandle`. `GymAccessChecker` lo lee de ahí en vez de hacer otra query.

```java
// TenantContext:
private static final ThreadLocal<GymMember> currentMember = new ThreadLocal<>();
public static void setCurrentMember(GymMember m) { currentMember.set(m); }
public static GymMember getCurrentMember() { return currentMember.get(); }
// limpiar en clear()

// GymAccessChecker:
public boolean isAdmin(Long gymId) {
    GymMember member = TenantContext.getCurrentMember();
    if (member == null || !member.getGymId().equals(gymId)) return false;
    return List.of(GymMemberRole.ADMIN, GymMemberRole.ADMIN_COACH).contains(member.getRole());
}
```

**Esfuerzo estimado:** 1-2 horas

---

### 🟡 DT-04 — N+1 en `RoutineHistoryServiceImpl.getMemberHistory`

**Estado:** resuelto  
**Archivo:** `RoutineHistoryServiceImpl.java`

**Problema:**  
`buildSummary` hace 4 queries extra por cada asignación del historial:
- `templateRepository.findById(assignment.getTemplateId())`
- `countDistinctSessionDays(assignmentId, userId)`
- `countTotalCompletionsByAssignment(assignmentId, userId)`
- `findLastActivityAt(assignmentId, userId)`

Con 10 asignaciones históricas = ~41 queries. El mismo patrón fue corregido con batch fetch en `RoutineTemplateServiceImpl.findByGym`, pero no se aplicó acá.

**Solución:**
- Batch fetch de template names en una sola query con `findAllById`
- Una query de aggregation con `GROUP BY assignment_id` para obtener sessionDays, totalCompletions y lastActivityAt en un solo hit

```sql
SELECT ec.assignment_id,
       COUNT(DISTINCT ec.session_date) as session_days,
       COUNT(*) as total_completions,
       MAX(ec.completed_at) as last_activity_at
FROM exercise_completions ec
WHERE ec.user_id = :userId
  AND ec.assignment_id IN (:assignmentIds)
  AND ec.is_completed = true
GROUP BY ec.assignment_id
```

**Esfuerzo estimado:** 2-3 horas

---

### 🟡 DT-05 — `tracking` consume repositorios de `training` directamente

**Estado:** resuelto  
**Archivo:** `RoutineHistoryServiceImpl.java`, `TrackingServiceImpl.java`

**Problema:**  
El módulo `tracking` importa 5 artefactos de `training` directamente (entidades + repositorios):
`RoutineAssignment`, `TemplateBlock`, `TemplateExercise`, `RoutineAssignmentRepository`, `TemplateBlockRepository`, `TemplateExerciseRepository`.

Si `training` cambia el schema de `TemplateBlock` o `TemplateExercise`, `tracking` rompe. El grafo de dependencias documenta `tracking ← training` como correcto, pero importar repositorios concretos crea acoplamiento fuerte a la implementación.

**Solución:** Definir en `training` un service de consulta (`RoutineQueryService`) que exponga lo que `tracking` necesita, sin exponer entidades ni repositorios. `tracking` depende de la interfaz, no de la implementación.

**Esfuerzo estimado:** 3-4 horas (refactor sin cambio de comportamiento)

---

### ~~🟢 DT-06 — `validateExerciseBelongsToAssignment` ineficiente~~

**Estado:** resuelto (ya estaba resuelto — detectado al auditar, 2026-07-06)  
**Archivo:** `TemplateExerciseRepository.java`, `RoutineQueryServiceImpl.java`

**Problema (histórico):**  
`TrackingServiceImpl` cargaba todos los bloques + ejercicios de la plantilla para verificar que un `exerciseId` pertenece a la asignación activa.

**Resuelto como efecto colateral de DT-05:** al crear el facade `RoutineQueryService` para que `tracking` no dependa de los repositorios de `training`, `exerciseBelongsToTemplate(exerciseId, templateId)` ya quedó implementado con el `EXISTS` a nivel de repositorio exacto que este item pedía (`TemplateExerciseRepository.existsByIdAndTemplateId`, `JOIN` a `TemplateBlock`, `SELECT COUNT(e) > 0`). Nadie actualizó este item cuando se resolvió DT-05.

**Esfuerzo real:** 0 (ya estaba hecho, solo faltaba la doc)

---

## Frontend

### 🟡 DT-07 — `fetch` directo en `admins-view.tsx`

**Estado:** resuelto  
**Archivo:** `sgg-web/src/app/(dashboard)/platform/admins/admins-view.tsx`

**Problema:**  
El componente usa `fetch()` directamente al backend en vez de `apiClient`. Bypasea el token injection, el manejo centralizado de errores y la tipificación de `ApiError`. Los otros usos de `fetch` directo en el codebase son a rutas internas de Next.js (`/api/auth/native`), que es correcto; este es el único caso que llama al backend externo.

**Solución:** Reemplazar el `fetch` por una server action que use `apiClient`.

**Esfuerzo estimado:** 30 minutos

---

### ~~🟢 DT-08 — Sin paginación en historial y lista de templates~~

**Estado:** resuelto (2026-07-06)  
**Archivos:** `RoutineTemplateRepository/Service/Controller`, `RoutineAssignmentRepository`, `RoutineQueryService`, `RoutineHistoryService`, `MemberHistoryController`, `CoachHistoryController` (backend); páginas `member/history`, `coach/history/[memberId]`, `coach/templates` + `HistoryListView` (frontend).

**Problema (histórico):**  
Las listas de historial de rutinas y de templates se cargaban completas, sin paginación.

**Solución aplicada:**
- Backend: los 3 endpoints ahora aceptan `?page=0&size=20` y devuelven `PageResponse<T>` (mismo contrato que `admin/members`). El batch-fetch de nombres de plantilla/stats (DT-04) sigue operando solo sobre los ids de la página actual — no se reintrodujo el N+1.
- Frontend: nuevo componente compartido `src/components/ui/pagination.tsx` (`<Pagination page totalPages totalElements last onPageChange />`), reutilizado en `admin/members` (se extrajo el bloque que ya tenía) y en las 3 vistas nuevas.
- **Limitación conocida:** `HistoryListView` sigue separando "Activa"/"Pasadas" filtrando dentro de la página cargada (no hay un query separado por estado) — en la práctica no es un problema porque solo puede existir una asignación activa por vez y queda casi siempre en la página 0 (orden `startsAt DESC`). Se documentó en el componente.

**Esfuerzo real:** ~1 sesión.

---

### ~~🟢 DT-09 — Loading/error states asimétricos entre páginas~~

**Estado:** resuelto (2026-07-06)

**Problema (histórico):**  
Algunas páginas usaban `Promise.allSettled` con graceful degradation cuando fallaba un fetch secundario. Otras dejaban que el error burbujeara sin ningún `error.tsx`/`loading.tsx` en el árbol (ni siquiera el genérico de Next). No había patrón uniforme.

**Solución aplicada:**
- `gym/[gymId]/error.tsx` + `loading.tsx` y `platform/error.tsx` + `loading.tsx`: boundary genérico a nivel de árbol, sibling de cada `layout.tsx` (el sidebar queda montado). Cubre automáticamente todas las páginas hijas que no definan los suyos propios — antes solo `admin/members` y `coach/templates` tenían protección.
- Patrón canónico documentado en `docs/frontend/FRONTEND-CONVENTIONS.md` ("Loading y Error States — Patrón Canónico"): fetch único crítico → sin catch; varios fetches igual de críticos → `Promise.all` sin catch; contenido primario + dato secundario/cosmético → `Promise.allSettled` con re-throw del primario y degradación silenciosa del secundario; ausencia de datos como estado válido (ej. historial vacío) → `try/catch` puntual a lista vacía.
- Aplicado como ejemplo concreto en `coach/templates/page.tsx`: pasó de `Promise.all` (memberships podía tirar abajo la lista de templates) a `Promise.allSettled` con degradación del flag `isPersonalGym`.

**Esfuerzo real:** ~1 sesión (bundleado con DT-08).

---

## Historial de deudas resueltas

| ID | Descripción | Resuelta en |
|----|-------------|-------------|
| — | N+1 en `findByGym` de templates (BUG-02) | Fase 4 post-release |
| — | N+1 en `getHistory` de assignments (BUG-03) | Fase 4 post-release |
| — | Tenant bypass en `findOrThrow` (BUG-04) | Fase 4 post-release |
| — | Método derivado roto en `RoutineAssignmentRepository` (BUG-01) | Fase 4 post-release |
| — | DualJwtDecoder algoritmo HS384 no especificado | Sub-Fase 5.8 |
| — | Flyway V14 sin commitear | Sub-Fase 5.7 |
| DT-03 | Doble consulta de membresía: rol cacheado en `TenantContext` | 2026-05-10 |
| DT-04 | N+1 en `getMemberHistory`: batch con `findStatsBatch` JPQL GROUP BY | 2026-05-10 |
| DT-05 | `tracking` → `training` repos: facade `RoutineQueryService` + DTOs de query | 2026-05-10 |
| DT-07 | `fetch` directo en `admins-view`: migrado a server action `searchUsers` | 2026-05-10 |
| DT-01 | Roles/status `String` → enums (`GymMemberRole/Status`, `GymStatus`, `GymType`) + CHECK constraints | 2026-07-06 |
| DT-02 | `common` → `tenancy`: puerto `GymTenantResolver` + `GymAccessChecker` movido a `tenancy.security` | 2026-07-06 |
| DT-10 | `common` → `identity` (3 archivos): puerto `CurrentUserResolver` implementado en `identity.security` | 2026-07-06 |
| DT-06 | `exerciseBelongsToTemplate`: ya resuelto como efecto colateral de DT-05, faltaba actualizar la doc | 2026-07-06 |
| DT-08 | Paginación en historial y templates: `PageResponse<T>` + componente `Pagination` compartido | 2026-07-06 |
| DT-09 | Loading/error states: boundaries a nivel de árbol (`gym/[gymId]`, `platform`) + patrón canónico documentado | 2026-07-06 |
