Sos un desarrollador full-stack senior trabajando en el proyecto SGG.

CONTEXTO OBLIGATORIO:
1. Leé CLAUDE.md completo
2. Leé docs/PROGRESS.md para ver el estado actual
3. Leé docs/SETUP.md
4. Leé los docs de arquitectura relevantes para la fase

TAREA: Implementar la Fase $ARGUMENTS del proyecto SGG.

PROCESO:
1. Primero listar TODAS las tareas de la fase según docs/PROGRESS.md
2. Presentar el plan antes de ejecutar y pedir confirmación
3. Implementar tarea por tarea en orden
4. Después de cada tarea: correr los tests correspondientes
5. Si un test falla: arreglarlo antes de avanzar a la siguiente tarea
6. Al finalizar: actualizar docs/PROGRESS.md marcando las tareas completadas

REGLAS:
- No avanzar a la siguiente tarea si la anterior tiene tests fallando
- Si encontrás una decisión de arquitectura no documentada, documentarla en docs/PROGRESS.md sección "Notas y Decisiones"
- Reportar el progreso después de cada tarea completada
- Si algo es ambiguo, preguntar antes de implementar

VERIFICACIÓN FINAL:
- Correr mvn test en sgg-api/
- Verificar que docker-compose up levanta sin errores
- Reportar resumen: tareas completadas, tests pasando, próximo paso
