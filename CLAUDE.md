# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SGG — SaaS Multi-Tenant para Gimnasios

---

## 🗺️ LEER ANTES DE CUALQUIER TAREA

Este archivo es tu punto de entrada. Antes de escribir código, siempre:

1. Leé este archivo completo
2. Identificá en qué capa estás trabajando (backend / web / app)
3. Leé el doc del módulo específico en `docs/backend/modules/` si es backend
4. Consultá las reglas de arquitectura en `docs/backend/ARCHITECTURE.md`
5. Nunca asumir — si falta contexto, preguntar antes de implementar

---

## 📁 Estructura del Monorepo

```
sgg/
├── CLAUDE.md                    ← estás acá
├── docker-compose.yml
├── docker-compose.override.yml
├── .env.example
├── sgg-api/                     ← Spring Boot 3 / Java 21
├── sgg-web/                     ← Next.js 14+ (App Router)
└── sgg-app/                     ← React Native + Expo
```

---

## 🧠 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | Java + Spring Boot | 21 / 3.x |
| Panel Web | Next.js (App Router) | 14+ |
| App Móvil | React Native + Expo | SDK 51+ |
| Base de datos | PostgreSQL | 16 |
| Auth | Supabase Auth | Cloud free tier |
| Migraciones | Flyway | Integrado con Spring |
| Contenedores | Docker + Compose | v2+ |
| Túnel | Cloudflared | latest |
| OS Dev | Windows + WSL2 (Ubuntu) | — |

---

## 🏗️ Arquitectura en una Página

- **Backend**: monolito modular. Packages = módulos. Sin microservicios.
- **Multi-tenancy**: BD compartida, segregación por `gym_id` en cada tabla. TenantInterceptor + Hibernate Filters.
- **Roles**: dos dimensiones independientes:
  - `users.platform_role`: `USER` | `SUPERADMIN` (global)
  - `gym_members.role`: `MEMBER` | `COACH` | `ADMIN` | `ADMIN_COACH` (por gym)
- **Auth**: Supabase emite JWT → Spring Security los valida. También soporta auth nativa (email/password) con JWT firmado HS384 (ver `NativeAuthController`). `DualJwtDecoder` intenta decodificar primero con el secreto nativo (HS384) y si falla prueba con Supabase JWKS.
- **Multi-tenancy impl**: `TenantContext` (ThreadLocal) almacena `gym_id` actual. `TenantInterceptor` extrae `gymId` del path `/api/gyms/{gymId}/**` y valida acceso. Hibernate `@FilterDef` aplica `WHERE gym_id = :gymId` automáticamente.
- **Clientes**: Next.js (admin/coach/superadmin) y React Native (members). Misma API, distintos endpoints por rol.
- **Key libs backend**: Lombok, MapStruct 1.6 (DTO mapping), Testcontainers 1.19 (tests de integración).

---

## 📦 Módulos del Backend

```
com.sgg
├── common/        # config, security, multitenancy, exceptions, DTOs base
├── identity/      # users, auth sync con Supabase + native auth
├── tenancy/       # gyms, gym_members, membresías
├── training/      # routine_templates, blocks, exercises, assignments
├── tracking/      # exercise_completions
├── schedule/      # schedule_activities
└── platform/      # superadmin: ABM de gyms y gestión de admins
```

> **Nota:** El módulo `coaching` (coach_assignments) está planificado pero **no implementado** aún.
> El proyecto `sgg-app` (React Native) está planificado pero **no existe** en el repositorio todavía.

Dependencias (solo en esta dirección, nunca al revés):
```
identity ← tenancy ← training ← tracking
                          ↑
                    schedule (solo depende de tenancy)
platform → tenancy, identity
```

---

## 🗄️ Reglas de Base de Datos

- **TODA** tabla de negocio tiene columna `gym_id` (excepto `users`, `auth_identities`)
- Índices obligatorios en `gym_id` para cada tabla de negocio
- Soft delete con `deleted_at TIMESTAMP NULL` (nunca DELETE físico en producción)
- Migraciones solo via Flyway: `V{n}__{descripcion}.sql` en `src/main/resources/db/migration/`
- Nunca modificar una migración ya ejecutada — siempre crear una nueva

---

## 🔐 Reglas de Seguridad

- Nunca exponer endpoints sin autenticación salvo `/api/public/**`, `/api/auth/**` y `GET /api/gyms/search`
- Todo endpoint con `gymId` en el path debe pasar por `TenantInterceptor`
- Validar siempre que el usuario autenticado pertenece al gym del path (salvo SUPERADMIN)
- SUPERADMIN bypasea membresía pero no bypasea el seteo del TenantContext
- Usar `@PreAuthorize` con `@gymAccessChecker` para validaciones a nivel de método

---

## ✅ Reglas de Calidad

- Todo endpoint debe tener su test de integración extendiendo `BaseIntegrationTest` (en `com.sgg.common`). No replicar la config de Testcontainers — ya está en la clase base.
- Validaciones con Bean Validation (`@Valid`, `@NotNull`, `@Size`, etc.) en los DTOs
- Nunca lógica de negocio en controllers — solo en services
- Nunca queries en entities — solo en repositories
- Excepciones de negocio: usar `BusinessException` del módulo `common`
- Logs: usar SLF4J (`private static final Logger log = LoggerFactory.getLogger(...)`)
- No usar `System.out.println` nunca
- Constructor injection siempre (via `@RequiredArgsConstructor`). Nunca `@Autowired` en campos.
- Services: `@Transactional` a nivel de clase + `@Transactional(readOnly = true)` en métodos de lectura.

---

## 🗄️ Bases de Datos

- **`sgg`** = producción. Se usa con `docker-compose -f docker-compose.yml up`
- **`sgg_dev`** = desarrollo. Se usa con `docker-compose up` (override apunta aquí)
- Nunca meter datos de prueba en `sgg`. Usar siempre `sgg_dev` + `seed-dev-db.sh`
- Para resetear dev: `./scripts/reset-dev-db.sh` (dropea y recrea `sgg_dev`)

---

## 🔑 Variables de Entorno Requeridas

**Backend (`sgg-api`):**

| Variable | Descripción |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | URL JDBC de PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | Usuario de BD |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de BD |
| `SUPABASE_JWKS_URI` | URI del JWKS de Supabase (`https://<project>.supabase.co/auth/v1/.well-known/jwks.json`) |
| `APP_JWT_SECRET` | Secreto HS384 para auth nativa (mín. 32 chars) |
| `APP_CORS_WEB_ORIGIN` | Origen permitido para el panel web (default: `http://localhost:3000`) |
| `APP_CORS_ALLOWED_ORIGINS` | Orígenes adicionales permitidos (ej: URL del tunnel de Expo) |

**Frontend web (`sgg-web/.env.local`):**

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (default: `http://localhost:8080`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server-side, nunca exponer) |

---

## 🖥️ Entorno WSL2

- El repo vive en el filesystem de WSL2 (`~/projects/sgg`), NO en `/mnt/c/`
- Docker Desktop con integración WSL2 habilitada
- Los comandos Maven y npm se ejecutan dentro de WSL2
- Para la app Expo: `npx expo start --tunnel` si hay problemas de red con WSL2

---

## 📋 Comandos Frecuentes

```bash
# Levantar todo el stack (dev)
docker-compose up

# Solo la BD (cuando desarrollás la API fuera de Docker)
docker-compose up postgres

# Build y deploy producción
docker-compose -f docker-compose.yml up --build -d

# Correr tests del backend
cd sgg-api && mvn test

# Correr tests de integración (Testcontainers + PostgreSQL real)
cd sgg-api && mvn verify

# Correr un solo test
cd sgg-api && mvn test -Dtest=NombreDelTestClass
cd sgg-api && mvn test -Dtest=NombreDelTestClass#metodoEspecifico

# Nueva migración Flyway (script automático)
./scripts/new-migration.sh "descripcion_del_cambio"
# O manual: crear src/main/resources/db/migration/V{n}__descripcion.sql

# Backup de BD
./scripts/backup-db.sh

# BD de desarrollo: seed con datos de prueba
./scripts/seed-dev-db.sh

# BD de desarrollo: reset completo (drop + recreate + flyway)
./scripts/reset-dev-db.sh

# Frontend web
cd sgg-web && npm run dev       # Development
cd sgg-web && npm run build     # Production build

# App móvil
cd sgg-app && npx expo start
cd sgg-app && npx expo start --tunnel   # si hay problemas de red en WSL2
```

---

## 📚 Documentación de Referencia

- Arquitectura completa: `docs/backend/ARCHITECTURE.md`
- Convenciones backend: `docs/backend/CONVENTIONS.md`
- Módulo Identity: `docs/backend/modules/01-identity.md`
- Módulo Tenancy: `docs/backend/modules/02-tenancy.md`
- Módulo Coaching: `docs/backend/modules/03-coaching.md`
- Módulo Training: `docs/backend/modules/04-training.md`
- Módulo Tracking: `docs/backend/modules/05-tracking.md`
- Módulo Schedule: `docs/backend/modules/06-schedule.md`
- Módulo Platform: `docs/backend/modules/07-platform.md`
- Frontend Web — Arquitectura y patrones: `docs/frontend/FRONTEND.md` *(nota: las rutas reales usan `/gym/[gymId]/admin/`, `/gym/[gymId]/coach/`, `/gym/[gymId]/member/` — sin grupos de ruta `(admin)`/`(coach)` como indica la doc)*

- Frontend Web — Convenciones: `docs/frontend/FRONTEND-CONVENTIONS.md`
- Frontend Web — Auth: `docs/frontend/sections/01-auth.md`
- Frontend Web — Admin Miembros: `docs/frontend/sections/02-admin-members.md`
- Frontend Web — Admin Coaches y Horarios: `docs/frontend/sections/03-admin-coaches-schedule.md`
- Frontend Web — Coach Plantillas y Asignaciones: `docs/frontend/sections/04-coach-templates-assignments.md`
- Frontend Web — Superadmin: `docs/frontend/sections/05-superadmin-platform.md`
- App Móvil — Arquitectura y patrones: `docs/mobile/MOBILE.md`
- App Móvil — Convenciones: `docs/mobile/MOBILE-CONVENTIONS.md`
- App Móvil — Auth: `docs/mobile/screens/01-auth.md`
- App Móvil — Tab Rutina: `docs/mobile/screens/02-routine.md`
- App Móvil — Progreso, Gym y Perfil: `docs/mobile/screens/03-progress-gym-profile.md`
- Infraestructura: `docs/infrastructure/INFRA.md`
- Setup inicial: `docs/SETUP.md`
- Progreso y fases: `docs/PROGRESS.md`
- Templates de config: `docs/backend/pom.xml.template`, `docs/backend/application.yml.template`
