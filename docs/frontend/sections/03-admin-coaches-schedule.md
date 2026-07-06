# Frontend Web — Sección: Admin — Coaches y Horarios
**Rutas:** `/gym/[gymId]/admin/coaches`, `/gym/[gymId]/admin/schedule`
**Acceso:** ADMIN | ADMIN_COACH | SUPERADMIN

---

## /admin/coaches — Gestión de Coaches

### Lista de Coaches

**Fetch (Server Component, `page.tsx`):**
```ts
const [coachesRes, membersRes] = await Promise.all([
  apiClient<ApiResponse<CoachSummaryDto[]>>(`/api/gyms/${gymId}/admin/coaches`),
  apiClient<ApiResponse<PageResponse<GymMemberDto>>>(
    `/api/gyms/${gymId}/admin/members?status=ACTIVE&role=MEMBER&size=200`
  ),
])
```

**Componentes reales** (`app/(dashboard)/gym/[gymId]/admin/coaches/`):
```
page.tsx                  ← Server Component: fetch coaches + members, pasa a CoachesView
coaches-view.tsx          ← Client Component: CoachesView — lista de coaches (Card por coach:
                             nombre, email, badge "N alumnos", botón "Asignar alumno")
assign-coach-dialog.tsx   ← AssignCoachDialog: select de miembro + botón Asignar
actions.ts                ← Server Actions: assignCoach, unassignCoach
```

**El prop `unassignedMembers`/`members` es engañoso:** en realidad es "todos los miembros
`ACTIVE`/`MEMBER` del gym" (`GET .../admin/members?status=ACTIVE&role=MEMBER&size=200`), **sin
filtrar** a los que ya tienen coach asignado. El dialog solo muestra un texto de ayuda ("Si el
miembro ya tiene un coach asignado se mostrará un error") y confía en el 409 del backend
(`existsByGymIdAndMemberUserIdAndUnassignedAtIsNull`) para rechazarlo.

**Sin UI para desasignar.** `unassignCoach(gymId, assignmentId)` existe en `actions.ts` (llama
`DELETE /api/gyms/{gymId}/admin/assign-coach/{assignmentId}`) pero **no tiene ningún caller** —
`coaches-view.tsx` no expande ni lista los miembros asignados de cada coach, así que hoy no hay
forma de desasignar desde esta pantalla. La única desasignación real ocurre automáticamente
cuando se le cambia el rol o se bloquea al coach desde Admin → Miembros (ver
`docs/backend/modules/03-coaching.md`, `CoachDeactivatedEvent`).

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

**Componentes reales** (`app/(dashboard)/gym/[gymId]/admin/schedule/`):
```
page.tsx                    ← Server Component: fetch + pasa a ScheduleAdminView
schedule-admin-view.tsx     ← ScheduleAdminView: agrupa por día (array DAYS fijo, Lunes..Domingo),
                               por actividad: nombre/horario, botones Editar (lápiz) y
                               Eliminar (tacho) — sin badge Activa/Inactiva visible
schedule-form-dialog.tsx    ← ScheduleFormDialog: modal crear/editar (mismo componente para ambos)
actions.ts                  ← Server Actions: createActivity, updateActivity, deleteActivity
```

**ScheduleFormDialog (crear y editar):**
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

export async function deleteActivity(gymId: string, activityId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/schedule/${activityId}`, { method: 'DELETE' })
  revalidatePath(`/gym/${gymId}/admin/schedule`)
}
```

> El nombre de la action es `deleteActivity`, pero el DELETE del backend es lógico
> (`is_active = false`, ver `docs/backend/modules/06-schedule.md`) — no hay delete físico.

---

## Tests

### Coaches
`coaches-view.test.tsx` (Vitest + Testing Library, existe de verdad):
```
✅ Renderiza nombre, email y badge de conteo de miembros
✅ Usa "alumno" en singular cuando el conteo es 1
✅ Estado vacío (sin coaches): mensaje "No hay coaches en este gym"
✅ Deshabilita el botón Asignar cuando no hay miembros disponibles
✅ Habilita el botón Asignar cuando hay miembros disponibles
✅ Muestra "todos los miembros tienen coach" cuando no hay disponibles
✅ Abre el dialog de asignación con el nombre del coach en el título
✅ Puebla el select del dialog con los miembros disponibles
✅ Llama assignCoach con los args correctos y cierra el dialog al tener éxito
✅ Muestra toast de error y mantiene el dialog abierto si assignCoach falla
```

### Horarios

**No hay test file** para `schedule-admin-view.tsx`/`schedule-form-dialog.tsx` — la lista de
abajo describe comportamiento esperado, no verificado por CI.
```
- Vista agrupa actividades por día (Lunes..Domingo) correctamente
- Crear actividad: dialog vacío, submit, aparece en la lista
- Editar actividad: dialog con datos pre-cargados, submit actualiza
- Hora fin antes de hora inicio: error de validación, no envía
- Nombre en blanco: error de validación inline
```
