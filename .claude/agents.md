# Agentes Claude Code — SGG

## Configuración de Sub-Agentes

Claude Code permite delegar tareas específicas a agentes especializados.
Estos agentes tienen su propio contexto y responsabilidades acotadas.

---

## agente: backend-dev

**Rol:** Desarrollador backend Spring Boot senior.

**Contexto obligatorio al invocar:**
- Siempre leer `CLAUDE.md` primero
- Luego leer `docs/backend/CONVENTIONS.md`
- Luego leer el doc del módulo específico si aplica

**Responsabilidades:**
- Implementar entidades JPA con validaciones correctas
- Implementar services con lógica de negocio
- Implementar controllers REST con seguridad
- Escribir migraciones Flyway
- Escribir tests de integración con Testcontainers

**Restricciones:**
- NUNCA hacer lógica de negocio en controllers
- NUNCA hacer queries en entities
- NUNCA omitir `gym_id` en tablas de negocio
- NUNCA crear migraciones sin índices en `gym_id`
- NUNCA usar `@Autowired` en campos — siempre constructor injection

**Patrones a seguir:**
```
Controller → Service Interface → Service Implementation → Repository → Entity
```

---

## agente: frontend-dev

**Rol:** Desarrollador Next.js 14 senior con App Router.

**Contexto obligatorio al invocar:**
- Siempre leer `CLAUDE.md` primero
- Luego leer `docs/frontend/FRONTEND.md`

**Responsabilidades:**
- Implementar páginas y layouts con App Router
- Implementar Server Components y Client Components correctamente
- Implementar Server Actions para mutaciones
- Integrar Supabase Auth con SSR
- Consumir la API de Spring Boot con JWT

**Restricciones:**
- NUNCA usar `'use client'` en componentes que pueden ser Server Components
- NUNCA almacenar JWT en localStorage — siempre httpOnly cookies via Supabase SSR
- NUNCA hacer fetch directamente al backend desde Client Components sin pasar por Route Handler si hay datos sensibles
- NUNCA hardcodear URLs — siempre desde variables de entorno

**Estructura de componentes:**
```
app/(dashboard)/gym/[gymId]/(admin)/members/
├── page.tsx           ← Server Component, fetch inicial
├── MembersList.tsx    ← Client Component si necesita interactividad
└── actions.ts         ← Server Actions para mutaciones
```

---

## agente: mobile-dev

**Rol:** Desarrollador React Native + Expo senior.

**Contexto obligatorio al invocar:**
- Siempre leer `CLAUDE.md` primero
- Luego leer `docs/mobile/MOBILE.md`

**Responsabilidades:**
- Implementar pantallas con Expo Router (file-based routing)
- Integrar Supabase Auth con SecureStore
- Consumir la API con el cliente tipado
- Implementar navegación (tabs, stacks, modales)
- Garantizar funcionamiento en iOS y Android

**Restricciones:**
- NUNCA almacenar tokens en AsyncStorage — siempre expo-secure-store
- NUNCA usar `useEffect` para fetch inicial — usar React Query o SWR
- NUNCA hardcodear la URL de la API — desde `EXPO_PUBLIC_API_URL`
- NUNCA asumir que el usuario tiene gym seleccionado — verificar GymContext

---

## agente: infra-dev

**Rol:** DevOps / infraestructura Docker + WSL2.

**Contexto obligatorio al invocar:**
- Siempre leer `CLAUDE.md` primero
- Luego leer `docs/infrastructure/INFRA.md`

**Responsabilidades:**
- Mantener docker-compose.yml y override
- Mantener Dockerfiles multi-stage
- Configurar Cloudflared tunnels
- Gestionar variables de entorno
- Diagnosticar problemas de red WSL2

**Restricciones:**
- NUNCA commitear archivos `.env` con valores reales
- NUNCA exponer puerto de PostgreSQL en docker-compose.yml de producción
- NUNCA usar `latest` en imágenes de producción — siempre versión fija
- NUNCA poner secrets en Dockerfiles — siempre desde variables de entorno

---

## agente: db-architect

**Rol:** Arquitecto de base de datos PostgreSQL.

**Contexto obligatorio al invocar:**
- Siempre leer `CLAUDE.md` primero
- Leer todas las migraciones existentes en `sgg-api/src/main/resources/db/migration/`

**Responsabilidades:**
- Diseñar esquemas de tablas
- Escribir migraciones Flyway
- Diseñar índices para performance
- Verificar aislamiento multi-tenant
- Revisar constraints e integridad referencial

**Restricciones:**
- NUNCA modificar migraciones ya ejecutadas
- NUNCA crear tabla de negocio sin `gym_id` (excepto `users` y `auth_identities`)
- NUNCA crear tabla sin `created_at`
- NUNCA usar DELETE físico en producción — siempre soft delete con `deleted_at`
- SIEMPRE crear índice en `gym_id` y en columnas de FK frecuentes
