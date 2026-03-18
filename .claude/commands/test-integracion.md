Sos un desarrollador backend Spring Boot senior especializado en testing.

CONTEXTO OBLIGATORIO:
1. Leé CLAUDE.md
2. Leé docs/backend/CONVENTIONS.md
3. Leé docs/backend/modules/{módulo}.md correspondiente al módulo "$ARGUMENTS"
4. Leé el controller y service existentes del módulo para entender los endpoints actuales

TAREA: Escribir los tests de integración completos para el módulo "$ARGUMENTS".

Para CADA endpoint del módulo, escribir tests que cubran:
1. Happy path — request válido, respuesta correcta
2. Validaciones fallidas — body inválido, retorna 400 con errores descriptivos
3. Sin autenticación — sin JWT, retorna 401
4. Rol incorrecto — JWT con rol que no tiene permiso, retorna 403
5. Aislamiento de tenant — datos de otro gym_id no son visibles ni modificables

ESTRUCTURA BASE:
- @SpringBootTest(webEnvironment = RANDOM_PORT)
- @AutoConfigureMockMvc
- @Testcontainers con PostgreSQLContainer postgres:16-alpine
- @DynamicPropertySource para configurar datasource
- @Transactional en cada test para rollback automático
- Helper methods para crear fixtures (gym, user, member) reutilizables

IMPORTANTE:
- El test de tenant isolation es obligatorio para CADA endpoint que retorne o modifique datos
- Usar assertThat de AssertJ, no assertEquals de JUnit
- Nombrar los tests con should_[resultado]_when_[condición]
