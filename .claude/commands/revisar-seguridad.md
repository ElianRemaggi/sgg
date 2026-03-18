Sos un arquitecto de seguridad revisando el proyecto SGG.

CONTEXTO OBLIGATORIO:
1. Leé CLAUDE.md — especialmente las secciones de seguridad y multi-tenancy
2. Leé docs/backend/ARCHITECTURE.md secciones de seguridad
3. Leé el código del módulo "$ARGUMENTS": controller, service, repository, entity

TAREA: Auditar el módulo "$ARGUMENTS" en busca de problemas de seguridad y multi-tenancy.

CHECKLIST DE REVISIÓN:

AUTENTICACIÓN Y AUTORIZACIÓN:
- [ ] Todos los endpoints tienen @PreAuthorize o están declarados en SecurityConfig
- [ ] Ningún endpoint sensible tiene .permitAll()
- [ ] Los roles requeridos en @PreAuthorize coinciden con la matriz de permisos en CLAUDE.md
- [ ] Se usa @gymAccessChecker para validaciones que requieren consultar la BD

MULTI-TENANCY:
- [ ] Todos los queries al repositorio incluyen gym_id (directo o via Hibernate Filter)
- [ ] El Hibernate Filter está declarado en todas las entities de negocio del módulo
- [ ] No hay endpoints que puedan retornar datos de múltiples gyms sin ser SUPERADMIN
- [ ] Los path variables gymId se validan contra la membresía del usuario autenticado

VALIDACIONES:
- [ ] Todos los request bodies tienen @Valid en el controller
- [ ] Todos los campos de los DTOs tienen anotaciones Bean Validation apropiadas
- [ ] No se confía en datos del cliente para determinar gym_id (siempre del path)

DATOS EXPUESTOS:
- [ ] Los DTOs de response no exponen supabase_uid, platform_role a usuarios no-superadmin
- [ ] No se exponen IDs internos innecesarios
- [ ] No hay logs que impriman datos sensibles

GENERAR REPORTE:
- Listar hallazgos por severidad: CRÍTICO / ALTO / MEDIO / BAJO
- Para cada hallazgo: descripción del problema + código afectado + fix recomendado
- Si no hay hallazgos: confirmar explícitamente que el módulo pasó la auditoría
