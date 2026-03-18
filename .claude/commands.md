# Claude Code — Comandos y Agentes SGG

## Comandos Disponibles

Estos comandos se invocan con `/` desde Claude Code.

---

## /nuevo-modulo

**Propósito:** Crear el scaffold completo de un módulo nuevo del backend.

**Uso:** `/nuevo-modulo [nombre]`

**Ejemplo:** `/nuevo-modulo notificaciones`

**Claude debe:**
1. Leer `docs/backend/CONVENTIONS.md` para seguir la estructura exacta
2. Crear el package `com.sgg.[nombre]/` con subcarpetas: `controller/`, `service/`, `repository/`, `entity/`, `dto/`
3. Crear la entidad base con `gym_id`, `created_at`, `updated_at`
4. Crear el service con interfaz + implementación
5. Crear el controller con el path base `/api/gyms/{gymId}/[nombre]`
6. Crear el archivo de migración Flyway siguiente en secuencia
7. Crear la clase de test de integración base
8. Actualizar el `CLAUDE.md` con el nuevo módulo en la lista

---

## /nueva-migracion

**Propósito:** Crear una migración Flyway correctamente numerada.

**Uso:** `/nueva-migracion [descripcion]`

**Ejemplo:** `/nueva-migracion add_status_to_gyms`

**Claude debe:**
1. Listar los archivos en `sgg-api/src/main/resources/db/migration/`
2. Identificar el número siguiente (V{n+1})
3. Crear el archivo `V{n+1}__{descripcion}.sql`
4. Incluir el script SQL y los índices correspondientes
5. Nunca modificar migraciones existentes

---

## /nuevo-endpoint

**Propósito:** Agregar un endpoint completo (controller + service + DTO + test).

**Uso:** `/nuevo-endpoint [modulo] [método] [path] [descripcion]`

**Ejemplo:** `/nuevo-endpoint training POST /api/gyms/{gymId}/coach/templates "Crear plantilla de rutina"`

**Claude debe:**
1. Leer el doc del módulo correspondiente en `docs/backend/modules/`
2. Crear el DTO de request con validaciones Bean Validation
3. Crear el DTO de response
4. Agregar el método al service (interfaz + implementación)
5. Agregar el endpoint al controller con `@PreAuthorize`
6. Escribir el test de integración completo
7. Documentar el endpoint en el doc del módulo

---

## /test-integracion

**Propósito:** Escribir tests de integración para un módulo o endpoint existente.

**Uso:** `/test-integracion [modulo]`

**Claude debe:**
1. Leer el doc del módulo para entender todos los endpoints
2. Para cada endpoint escribir tests para: happy path, validaciones fallidas, acceso sin auth, acceso con rol incorrecto, aislamiento de tenant (otro gym no ve los datos)
3. Usar Testcontainers para PostgreSQL real
4. Usar `@WithMockJwt` (custom) para simular usuarios autenticados
5. Verificar que ningún test use datos de otro tenant

---

## /revisar-seguridad

**Propósito:** Auditar un módulo en busca de problemas de seguridad y multi-tenancy.

**Uso:** `/revisar-seguridad [modulo]`

**Claude debe verificar:**
1. Todos los endpoints tienen `@PreAuthorize` o están en `SecurityConfig`
2. Todos los queries incluyen `gym_id` en el WHERE (o Hibernate Filter activo)
3. El `TenantInterceptor` está registrado para todas las rutas con `{gymId}`
4. No hay endpoints que expongan datos de múltiples gyms sin ser SUPERADMIN
5. Los DTOs de response no exponen campos sensibles (passwords, tokens, etc.)
6. Generar reporte con hallazgos y fixes sugeridos

---

## /implementar-fase

**Propósito:** Implementar una fase completa del plan de desarrollo.

**Uso:** `/implementar-fase [numero]`

**Ejemplo:** `/implementar-fase 1`

**Claude debe:**
1. Leer `docs/backend/ARCHITECTURE.md` sección del plan de fases
2. Listar todas las tareas de la fase
3. Implementarlas en orden, confirmando cada una antes de pasar a la siguiente
4. Al finalizar, correr los tests y reportar el resultado
5. Actualizar el archivo `docs/PROGRESS.md` con el estado

---

## /status

**Propósito:** Mostrar el estado actual del proyecto.

**Claude debe:**
1. Leer `docs/PROGRESS.md`
2. Listar qué módulos están completos, en progreso o pendientes
3. Listar los tests que pasan y los que fallan
4. Identificar el próximo paso recomendado

---

## /fix-wsl

**Propósito:** Diagnosticar y resolver problemas comunes de WSL2.

**Claude debe verificar:**
1. Docker Desktop está corriendo y tiene integración WSL2 activa
2. El repo está en `~/projects/` y no en `/mnt/c/`
3. Los permisos de archivos son correctos (no 777)
4. Si Expo tiene problemas de red, sugerir `--tunnel`
5. Si hay problemas de CORS con la API local, verificar `docker-compose.override.yml`
