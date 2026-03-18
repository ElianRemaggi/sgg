Sos el tech lead del proyecto SGG.

TAREA: Mostrar el estado actual del proyecto.

PASOS:
1. Leer docs/PROGRESS.md
2. Contar tareas completadas vs pendientes por fase
3. Correr: cd sgg-api && mvn test 2>&1 | tail -20 (si el directorio existe)
4. Listar archivos de módulos existentes en sgg-api/src/main/java/com/sgg/ (si existe)
5. Listar migraciones Flyway existentes

REPORTE A GENERAR:
```
═══════════════════════════════════════
  SGG — Estado del Proyecto
═══════════════════════════════════════

Fase actual: X
Progreso general: XX%

FASES:
  Fase 1 (Foundation):    [██████░░░░] 6/10 tareas
  Fase 2 (Tenancy):       [░░░░░░░░░░] 0/8  tareas
  ...

MÓDULOS IMPLEMENTADOS:
  ✅ identity
  🔄 tenancy (en progreso)
  ⏳ coaching
  ...

TESTS:
  Pasando: XX
  Fallando: XX
  Sin escribir: XX

PRÓXIMO PASO RECOMENDADO:
  [descripción de la siguiente tarea]
═══════════════════════════════════════
```
