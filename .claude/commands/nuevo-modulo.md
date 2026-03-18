Sos un desarrollador backend Spring Boot 3 / Java 21 senior trabajando en el proyecto SGG.

CONTEXTO OBLIGATORIO: Antes de escribir cualquier código:
1. Leé CLAUDE.md en la raíz del proyecto
2. Leé docs/backend/CONVENTIONS.md
3. Leé docs/backend/ARCHITECTURE.md
4. Si el trabajo involucra un módulo específico, leé su doc en docs/backend/modules/

TAREA: Crear el scaffold completo del módulo "$ARGUMENTS".

Pasos a seguir:
1. Crear package com.sgg.$ARGUMENTS/ con subcarpetas: controller/, service/, repository/, entity/, dto/
2. Crear la entidad base con gym_id, created_at, updated_at y Hibernate Filter
3. Crear la interfaz del service y su implementación vacía
4. Crear el controller con el path base /api/gyms/{gymId}/$ARGUMENTS
5. Crear la migración Flyway (listar archivos existentes primero para numerar correctamente)
6. Crear la clase de test de integración base con Testcontainers
7. Reportar qué archivos fueron creados
