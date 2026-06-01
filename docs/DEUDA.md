# SGG — Deuda Técnica

Registrar acá toda la deuda técnica identificada. Actualizar estado cuando se resuelva.

**Leyenda de prioridad:** 🔴 Alta · 🟡 Media · 🟢 Baja  
**Leyenda de estado:** `pendiente` · `en progreso` · `resuelto`

---

## Backend

### 🔴 DT-01 — Roles y status como `String` en vez de `Enum`

**Estado:** pendiente  
**Archivos afectados:** `GymMember.java`, `Gym.java`, `GymAccessChecker.java`, `TenantInterceptor.java`, `GymMemberServiceImpl.java`, `RoutineAssignmentServiceImpl.java`, `PlatformGymServiceImpl.java` y otros

**Problema:**  
`GymMember.role`, `GymMember.status` y `Gym.status` son `String`. Hay 29+ string literals dispersos en código productivo (`"ACTIVE"`, `"ADMIN"`, `"COACH"`, `"MEMBER"`, `"BLOCKED"`, `"PENDING"`, `"ADMIN_COACH"`). Un typo pasa el compilador y solo explota en runtime — con riesgo de bug de seguridad si la comparación de rol falla silenciosamente.

**Solución:**
```java
// Crear enums:
public enum GymMemberRole { MEMBER, COACH, ADMIN, ADMIN_COACH }
public enum GymMemberStatus { PENDING, ACTIVE, BLOCKED }
public enum GymStatus { ACTIVE, SUSPENDED }

// Anotar las entidades:
@Enumerated(EnumType.STRING)
private GymMemberRole role;

@Enumerated(EnumType.STRING)
private GymMemberStatus status;
```
Requiere migración Flyway para validar que no hay valores inválidos en la BD (unlikely, pero necesario).

**Esfuerzo estimado:** 3-4 horas (refactor + migración de validación)

---

### 🔴 DT-02 — `common` depende de `tenancy`

**Estado:** pendiente  
**Archivos afectados:** `GymAccessChecker.java`, `TenantInterceptor.java` (ambos en `com.sgg.common`)

**Problema:**  
`GymAccessChecker` y `TenantInterceptor` están en `com.sgg.common` pero importan `GymMemberRepository` y `GymRepository` de `com.sgg.tenancy`. El módulo `common` debería ser una hoja sin dependencias hacia otros módulos del proyecto — actualmente viola esa regla.

```
// Actual (incorrecto):
com.sgg.common.security.GymAccessChecker → com.sgg.tenancy.repository.GymMemberRepository
com.sgg.common.multitenancy.TenantInterceptor → com.sgg.tenancy.repository.GymMemberRepository
com.sgg.common.multitenancy.TenantInterceptor → com.sgg.tenancy.repository.GymRepository

// Correcto:
GymAccessChecker → mover a com.sgg.tenancy.security
TenantInterceptor → inyectar interfaces definidas en common, implementadas en tenancy
```

**Solución:** Mover `GymAccessChecker` al package `com.sgg.tenancy.security`. Para `TenantInterceptor` definir una interfaz `GymMembershipChecker` en `common` implementada en `tenancy`.

**Esfuerzo estimado:** 2-3 horas

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

### 🟢 DT-06 — `validateExerciseBelongsToAssignment` ineficiente

**Estado:** pendiente  
**Archivo:** `TrackingServiceImpl.java`

**Problema:**  
Carga todos los bloques + todos los ejercicios de la plantilla para verificar que un `exerciseId` pertenece a la asignación activa. Con una plantilla de 40 ejercicios carga 40 entidades.

**Solución:** Un `EXISTS` a nivel de repositorio:

```java
// En TemplateExerciseRepository:
@Query("""
    SELECT COUNT(e) > 0 FROM TemplateExercise e
    JOIN TemplateBlock b ON e.blockId = b.id
    WHERE e.id = :exerciseId AND b.templateId = :templateId
""")
boolean existsByIdAndTemplateId(@Param("exerciseId") Long exerciseId,
                                @Param("templateId") Long templateId);
```

**Esfuerzo estimado:** 30 minutos

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

### 🟢 DT-08 — Sin paginación en historial y lista de templates

**Estado:** pendiente  
**Archivos:** páginas `member/history`, `coach/history`, `coach/templates`

**Problema:**  
El backend de admins ya implementa `PageResponse<T>`. Las listas de historial de rutinas y de templates se cargan completas. Con usuarios activos durante meses el historial puede volverse pesado. La lista de templates también puede crecer.

**Solución:** El backend no requiere cambios para historial (los queries ya están). Agregar `?page=0&size=20` a los endpoints y un componente de paginación en el frontend.

**Esfuerzo estimado:** 2-3 horas por vista

---

### 🟢 DT-09 — Loading/error states asimétricos entre páginas

**Estado:** pendiente

**Problema:**  
Algunas páginas usan `Promise.allSettled` con graceful degradation cuando falla un fetch secundario. Otras dejan que el error burbujee al `error.tsx` boundary. No hay un patrón uniforme — algunas muestran estado vacío, otras pantalla de error.

**Solución:** Decidir el patrón canónico (probablemente `Promise.allSettled` + estado vacío para datos secundarios, error boundary solo para datos críticos) y aplicarlo consistentemente.

**Esfuerzo estimado:** 2-4 horas

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
