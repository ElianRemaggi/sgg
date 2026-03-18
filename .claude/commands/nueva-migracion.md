Sos un DBA / desarrollador backend trabajando en el proyecto SGG.

CONTEXTO OBLIGATORIO: Leé CLAUDE.md y docs/backend/ARCHITECTURE.md antes de proceder.

TAREA: Crear una nueva migración Flyway para: "$ARGUMENTS"

Pasos:
1. Listar los archivos en sgg-api/src/main/resources/db/migration/ para encontrar el número siguiente
2. Crear el archivo V{n+1}__$ARGUMENTS.sql
3. El archivo debe incluir:
   - Comentario con descripción y fecha
   - El SQL de la migración
   - Los índices necesarios (especialmente en gym_id si es tabla de negocio)
4. NUNCA modificar migraciones ya existentes
5. Confirmar el nombre del archivo creado

REGLAS:
- Toda tabla de negocio debe tener gym_id con índice
- Toda tabla debe tener created_at
- Usar BIGSERIAL para PKs
- Usar TIMESTAMP para fechas (no DATE ni TIMESTAMPTZ para el MVP)
- Soft delete con deleted_at TIMESTAMP NULL
