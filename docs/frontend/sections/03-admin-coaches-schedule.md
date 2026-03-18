# Frontend Web — Sección: Admin — Coaches y Horarios
**Rutas:** `/gym/[gymId]/admin/coaches`, `/gym/[gymId]/admin/schedule`
**Acceso:** ADMIN | ADMIN_COACH | SUPERADMIN

---

## /admin/coaches — Gestión de Coaches

### Lista de Coaches

**Fetch (Server Component):**
```ts
const [coaches, members] = await Promise.all([
  apiClient<CoachDto[]>(`/api/gyms/${gymId}/admin/coaches`),
  apiClient<PageResponse<GymMemberDto>>(
    `/api/gyms/${gymId}/admin/members?role=MEMBER&status=ACTIVE&size=100`
  )
])
```

**Componentes:**
```
CoachesPage (Server Component)
└── CoachesList (Client Component)
    ├── CoachCard (por cada coach)
    │   ├── Avatar + nombre + email
    │   ├── Badge "X miembros asignados"
    │   └── AssignMemberButton → abre modal
    └── AssignCoachModal (Client Component)
        ├── Select "Seleccionar coach"
        ├── Select "Seleccionar miembro"
        └── Botón Asignar
```

**AssignCoachModal:**
- Dos selects: coach y member
- El select de coach muestra solo usuarios con rol COACH o ADMIN_COACH
- El select de member muestra solo MEMBER activos sin coach asignado (filtrado client-side)
- Al confirmar → `POST /api/gyms/{gymId}/admin/assign-coach`
- Error 409 (ya asignado): toast "Este miembro ya tiene un coach asignado"

**CoachCard — lista de asignados:**
- Expandible: al hacer click muestra los miembros asignados del coach
- Cada miembro tiene botón "Desasignar" → `DELETE /api/gyms/{gymId}/admin/assign-coach/{id}`
- Confirmación antes de desasignar: "¿Desasignar a {nombre} de {coach}?"

---

## /admin/schedule — Gestión de Horarios

### Lista de Actividades

**Fetch (Server Component):**
```ts
const activities = await apiClient<ScheduleActivityDto[]>(
  `/api/gyms/${gymId}/admin/schedule`
)
// El admin ve TODAS (activas e inactivas), el endpoint público solo muestra activas
```

**Componentes:**
```
SchedulePage (Server Component)
├── WeeklyScheduleGrid (Client Component)
│   └── Por cada día de la semana:
│       ├── Nombre del día (Lunes, Martes...)
│       └── Lista de ActivityCard en ese día
│           ├── Nombre, horario, descripción
│           ├── Badge "Activa" / "Inactiva"
│           ├── Botón Editar → abre ActivityModal
│           └── Botón Desactivar / Activar
└── AddActivityButton → abre ActivityModal vacío
```

**ActivityModal (crear y editar):**
```
Campos:
- Nombre (text, requerido, max 200 chars)
- Descripción (textarea, opcional, max 500 chars)
- Día de la semana (select: Lunes a Domingo)
- Hora inicio (time picker)
- Hora fin (time picker)

Validación client-side (Zod):
- nombre: z.string().min(1).max(200)
- dayOfWeek: z.number().min(1).max(7)
- startTime: z.string().regex(/^\d{2}:\d{2}$/)
- endTime: z.string() + refine(end > start, "La hora fin debe ser posterior")

Estados del modal:
- idle → form editable
- saving → botones deshabilitados + spinner
- error → mensaje inline si el backend rechaza
```

**Server Actions:**
```ts
'use server'

export async function createActivity(gymId: string, data: CreateActivityForm) {
  await apiClient(`/api/gyms/${gymId}/admin/schedule`, {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      description: data.description || null,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,   // "07:00"
      endTime: data.endTime,
    }),
  })
  revalidatePath(`/gym/${gymId}/admin/schedule`)
}

export async function updateActivity(gymId: string, activityId: number, data: CreateActivityForm) {
  await apiClient(`/api/gyms/${gymId}/admin/schedule/${activityId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  revalidatePath(`/gym/${gymId}/admin/schedule`)
}

export async function deactivateActivity(gymId: string, activityId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/schedule/${activityId}`, { method: 'DELETE' })
  revalidatePath(`/gym/${gymId}/admin/schedule`)
}
```

---

## Tests

### Coaches
```
✅ Lista coaches con conteo de miembros asignados
✅ Expandir coach muestra sus miembros asignados
✅ Modal asignar: selects se cargan con datos correctos
✅ Asignar coach a miembro: éxito, lista se actualiza
✅ Asignar duplicado: toast 409 con mensaje claro
✅ Desasignar: pide confirmación, luego ejecuta y actualiza lista
✅ Estado vacío (sin coaches): mensaje "No hay coaches en este gym"
```

### Horarios
```
✅ Vista semanal: actividades agrupadas por día correctamente
✅ Día sin actividades: columna vacía con opción de agregar
✅ Crear actividad: modal se abre vacío, submit, aparece en grilla
✅ Editar actividad: modal se abre con datos pre-cargados, submit actualiza
✅ Hora fin antes de hora inicio: error de validación Zod, no envía
✅ Desactivar: pide confirmación, badge cambia a "Inactiva"
✅ Nombre en blanco: error de validación inline
```
