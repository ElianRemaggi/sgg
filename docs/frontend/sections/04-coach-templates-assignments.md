# Frontend Web — Sección: Coach — Plantillas y Asignaciones
**Rutas:** `/gym/[gymId]/coach/templates`, `/gym/[gymId]/coach/templates/new`, `/gym/[gymId]/coach/templates/[templateId]/edit`, `/gym/[gymId]/coach/assign`, `/gym/[gymId]/coach/my-members`, `/gym/[gymId]/coach/history/[memberId]`
**Acceso:** COACH | ADMIN_COACH | SUPERADMIN

---

## /coach/templates — Lista de Plantillas

**Fetch (Server Component), paginado (`?page=0&size=20`):**
```ts
const [templatesRes, membershipsResult] = await Promise.allSettled([
  apiClient<ApiResponse<PageResponse<RoutineTemplateSummaryDto>>>(
    `/api/gyms/${gymId}/coach/templates?page=${page}&size=20`
  ),
  apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
])
// templates es el contenido primario -> si rechaza, re-throw al error boundary del árbol
// memberships solo alimenta isPersonalGym -> degrada en silencio si falla
```
Ver el patrón canónico Promise.all vs allSettled en `docs/frontend/FRONTEND-CONVENTIONS.md`.

**Componentes reales** (`app/(dashboard)/gym/[gymId]/coach/templates/`):
```
page.tsx              ← Server Component: fetch + pasa a TemplatesView
templates-view.tsx     ← TemplatesView (prop data: PageResponse<...>, isPersonalGym para copy
                          distinto en gym personal): por plantilla → nombre, descripción,
                          contador de bloques/ejercicios, botón Editar, botón Exportar a Excel,
                          botón Eliminar, más <Pagination> al final de la grilla
template-editor.tsx    ← Compartido entre /new y /[templateId] (edit)
actions.ts
```

**Exportar a Excel:** el botón navega directo a
`/api/gyms/{gymId}/templates/{templateId}/export?format=xlsx` — un **Route Handler** de Next
(`app/api/gyms/[gymId]/templates/[templateId]/export/route.ts`) que proxea el `GET .../export`
del backend (ver `docs/backend/modules/04-training.md`) y reenvía el archivo descargable.

**Eliminar plantilla:**
- Confirmación: "¿Eliminar la plantilla '{nombre}'? Esta acción no se puede deshacer."
- Si tiene asignaciones activas: error 409 → toast "Esta plantilla tiene rutinas activas asignadas. Finalizalas antes de eliminar."

---

## /coach/templates/new y /coach/templates/[id]/edit — Editor de Plantilla

Esta es la pantalla más compleja del panel. Es un **Client Component** completo porque requiere estado local para el builder de bloques y ejercicios.

**Estado local del formulario:**
```ts
interface TemplateFormState {
  name: string
  description: string
  blocks: BlockForm[]
}

interface BlockForm {
  id: string          // temporal (crypto.randomUUID())
  name: string
  dayNumber: number
  exercises: ExerciseForm[]
}

interface ExerciseForm {
  id: string          // temporal
  name: string
  sets: number | null
  reps: string
  restSeconds: number | null
  notes: string
  sortOrder: number
}
```

**Layout del editor:**
```
TemplateEditorPage
├── Header: campo "Nombre de la plantilla" (grande, visible siempre)
├── Descripción (textarea colapsable)
│
├── Lista de bloques (drag & drop para reordenar — react-beautiful-dnd)
│   └── BlockCard (por cada bloque)
│       ├── Header: "Día X" + campo nombre editable inline
│       ├── Lista de ejercicios
│       │   └── ExerciseRow
│       │       ├── Nombre del ejercicio
│       │       ├── Sets | Reps | Descanso (campos inline pequeños)
│       │       ├── Notas (colapsable)
│       │       └── Botón eliminar ejercicio
│       ├── Botón "+ Agregar ejercicio"
│       └── Botón "Eliminar bloque"
│
├── Botón "+ Agregar bloque"
└── Footer fijo: [Cancelar] [Guardar plantilla]
```

**Validación antes de guardar (Zod):**
```ts
const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(200),
  description: z.string().max(500).optional(),
  blocks: z.array(z.object({
    name: z.string().min(1, "El nombre del bloque es obligatorio"),
    dayNumber: z.number().min(1).max(31),
    exercises: z.array(z.object({
      name: z.string().min(1, "El nombre del ejercicio es obligatorio"),
      sets: z.number().min(1).nullable(),
      reps: z.string().max(50).nullable(),
      restSeconds: z.number().min(0).nullable(),
    }))
  })).min(1, "Debe tener al menos un bloque")
})
```

**Guardado:**
```ts
// Para nuevo: POST /api/gyms/{gymId}/coach/templates
// Para editar: PUT /api/gyms/{gymId}/coach/templates/{id}
// Ambos envían el objeto completo con bloques y ejercicios

async function handleSave(data: TemplateFormState) {
  setStatus('saving')
  try {
    if (templateId) {
      await apiClient(`/api/gyms/${gymId}/coach/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(mapFormToRequest(data)),
      })
    } else {
      await apiClient(`/api/gyms/${gymId}/coach/templates`, {
        method: 'POST',
        body: JSON.stringify(mapFormToRequest(data)),
      })
    }
    router.push(`/gym/${gymId}/coach/templates`)
  } catch (error) {
    if (error.status === 409) {
      setError("No podés editar una plantilla con rutinas activas asignadas")
    } else {
      setError("Error al guardar. Intentá de nuevo.")
    }
    setStatus('idle')
  }
}
```

**Auto-guardado (opcional, post-MVP):** guardar borrador en localStorage cada 30 segundos.

---

## /coach/assign — Asignar Rutina a Miembro

**Fetch (Server Component, `page.tsx`):**
```ts
const [templatesRes, membersRes] = await Promise.all([
  apiClient<ApiResponse<PageResponse<RoutineTemplateSummaryDto>>>(
    `/api/gyms/${gymId}/coach/templates?size=100`
  ),
  apiClient<ApiResponse<PageResponse<GymMemberDto>>>(
    `/api/gyms/${gymId}/admin/members?status=ACTIVE&role=MEMBER&size=100`
  ),
])
```
El dropdown necesita la lista completa de plantillas, no una página — por eso pide `size=100`
(igual que ya hacía con members) en vez de usar el `<Pagination>` de `/coach/templates`.

**El listado de miembros NO viene de `/coach/my-members`.** Trae **todos** los `MEMBER` activos
del gym (`GET /admin/members?status=ACTIVE&role=MEMBER`), no solo los asignados a este coach —
cualquier coach puede asignarle una rutina a cualquier member del gym, esté o no en su lista de
"mis miembros". Componente real: `AssignView` (`assign-view.tsx`).

**Formulario (Client Component):**
```
AssignView
├── Select "Miembro" (todos los MEMBER activos del gym, no solo los asignados al coach)
├── Select "Plantilla de rutina"
├── Preview de la plantilla seleccionada (bloques y ejercicios, colapsado)
├── DatePicker "Fecha de inicio"
├── DatePicker "Fecha de fin" (opcional)
└── Botón Asignar
```

**Validación:**
```ts
const schema = z.object({
  memberUserId: z.number({ required_error: "Seleccioná un miembro" }),
  templateId: z.number({ required_error: "Seleccioná una plantilla" }),
  startsAt: z.date({ required_error: "La fecha de inicio es obligatoria" }),
  endsAt: z.date().optional()
    .refine(
      (end) => !end || end > form.getValues('startsAt'),
      "La fecha de fin debe ser posterior al inicio"
    )
})
```

**Post-asignación:**
- Éxito → toast "Rutina asignada a {nombre}" + reset del formulario
- Error → toast con el mensaje del backend

---

## /coach/my-members — Mis Miembros

**Fetch (`page.tsx`):**
```ts
const members = await apiClient<ApiResponse<AssignedMemberDto[]>>(
  `/api/gyms/${gymId}/coach/my-members`
)
```

**Componente real:** `MyMembersView` (`my-members-view.tsx`, con test en `__tests__/`). Por cada
member (`Card`): inicial del nombre, nombre completo, última actividad relativa (`date-fns`,
locale `es`), badge de rutina activa (`CheckCircle2`/`XCircle` según `hasActiveRoutine`).

**No hay ruta `/coach/progress/[memberId]` ni indicador de progreso porcentual en esta vista.**
Cada card es un `Link` directo a `/gym/${gymId}/coach/history/${member.userId}` — el detalle de
progreso/tracking del member se ve en el historial (sección de abajo), no en una pantalla de
"progreso" separada.

---

## /coach/history/[memberId] — Historial de un Miembro

El coach puede ver el historial completo de rutinas y la progresión de peso de cualquier member de su gym. Usa los mismos componentes compartidos que las páginas de historial del member.

**Rutas:**
```
/gym/[gymId]/coach/history/[memberId]                                       → lista de asignaciones
/gym/[gymId]/coach/history/[memberId]/[assignmentId]                        → detalle de asignación
/gym/[gymId]/coach/history/[memberId]/[assignmentId]/exercises/[exerciseId] → progresión de ejercicio
```

**Fetches:**
```ts
// Lista
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments

// Detalle
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}

// Progresión
GET /api/gyms/{gymId}/coach/history/{memberId}/assignments/{assignmentId}/exercises/{exerciseId}
```

**Componentes:**
- `HistoryListView` con `basePath={/gym/${gymId}/coach/history/${memberId}}`
- `AssignmentDetailView` con el basePath correcto para el coach
- `ExerciseProgressView` (igual que member)

La página de lista tiene un link "← Mis miembros" hacia `/gym/${gymId}/coach/my-members`.

---

## Tests

**Único test file real de esta sección:** `coach/my-members/__tests__/my-members-view.test.tsx`.
El editor de plantillas y `assign-view.tsx` no tienen test — lo de abajo describe
comportamiento esperado, no verificado por CI.

### my-members-view.test.tsx (real)
```
✅ Renderiza el nombre completo del member
✅ Estado vacío: "no tenés alumnos asignados"
✅ Badge "Con rutina" cuando hasActiveRoutine=true
✅ Badge "Sin rutina" cuando hasActiveRoutine=false
✅ Link apunta a /coach/history/{userId}
✅ Renderiza múltiples members
✅ Avatar muestra la primera letra del nombre
```

### Editor de Plantillas (sin test — comportamiento esperado)
```
- Crear plantilla: form vacío, agregar bloque, agregar ejercicio, guardar → POST
- Editar plantilla: form pre-cargado con datos existentes → PUT
- Guardar sin nombre / sin bloques: error de validación, no envía
- Editar plantilla con asignaciones activas: error 409, toast con mensaje
- Exportar (botón nuevo, ver `GET .../export?format=xlsx|csv`): descarga el archivo
```

### Asignación (sin test — comportamiento esperado)
```
- Selects se cargan con todos los MEMBER activos del gym y las plantillas
- Fecha de fin antes de inicio: error de validación
- Asignación exitosa: toast de éxito, form se resetea
```
