Sos un desarrollador backend Spring Boot 3 / Java 21 senior trabajando en el proyecto SGG.

CONTEXTO OBLIGATORIO:
1. Leé CLAUDE.md
2. Leé docs/backend/CONVENTIONS.md
3. Leé docs/backend/modules/ del módulo correspondiente

TAREA: Agregar un nuevo endpoint completo.

Especificación recibida: "$ARGUMENTS"
Formato esperado: [modulo] [MÉTODO] [path] [descripción]
Ejemplo: "training POST /api/gyms/{gymId}/coach/templates Crear plantilla de rutina"

PASOS:
1. Parsear la especificación para extraer módulo, método HTTP, path y descripción
2. Leer el doc del módulo para entender el contexto y no duplicar lógica
3. Crear DTO de request con todas las validaciones Bean Validation necesarias
4. Crear DTO de response
5. Agregar método a la interfaz del Service
6. Implementar el método en ServiceImpl con lógica de negocio y manejo de errores
7. Agregar el endpoint al Controller con:
   - @PreAuthorize correcto según la matriz de permisos
   - @Valid en el request body
   - HTTP status code correcto
8. Escribir el test de integración con los casos: happy path, validación fallida, sin auth, rol incorrecto, tenant isolation
9. Actualizar el doc del módulo con el nuevo endpoint

VERIFICAR ANTES DE TERMINAR:
- El endpoint incluye gym_id en el path si opera sobre datos de un gym
- El service verifica que los recursos pertenecen al gym del path (no solo por ID)
- No hay lógica de negocio en el controller
- El test corre sin errores: mvn test -Dtest=[NombreTest]
