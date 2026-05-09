# Frontend Web — Sección: Coach — Plantillas y Asignaciones
**Rutas:** `/gym/[gymId]/coach/templates`, `/gym/[gymId]/coach/assign`
**Acceso:** COACH | ADMIN_COACH | SUPERADMIN

---

## /coach/templates — Lista de Plantillas

**Fetch (Server Component):**
```ts
const templates = await apiClient<RoutineTemplateSummaryDto[]>(
  `/api/gyms/${gymId}/coach/templates`
)
```

**Componentes:**
```
TemplatesPage (Server Component)
├── CreateTemplateButton → /coach/templates/new
└── TemplatesList (Client Component)
    └── TemplateCard (por cada plantilla)
        ├── Nombre, descripción truncada
        ├── "X bloques · X ejercicios"
        ├── Creado por (nombre del coach)
        ├── Fecha de creación
        ├── Botón Editar → /coach/templates/[id]/edit
        └── Botón Eliminar (con confirmación)
```

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

**Fetch (Server Component):**
```ts
const [templates, myMembers] = await Promise.all([
  apiClient<RoutineTemplateSummaryDto[]>(`/api/gyms/${gymId}/coach/templates`),
  apiClient<AssignedMemberDto[]>(`/api/gyms/${gymId}/coach/my-members`),
])
```

**Formulario (Client Component):**
```
AssignRoutineForm
├── Select "Miembro" (lista de mis asignados)
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

**Fetch:**
```ts
const members = await apiClient<AssignedMemberDto[]>(
  `/api/gyms/${gymId}/coach/my-members`
)
```

**MemberCard muestra:**
- Foto, nombre, última actividad
- Indicador visual de progreso de la rutina actual (porcentaje)
- Link → `/gym/${gymId}/coach/progress/${memberId}`

---

## /coach/progress/[memberId] — Progreso de un Miembro

**Fetch:**
```ts
const [member, progress] = await Promise.all([
  apiClient<GymMemberDto>(`/api/gyms/${gymId}/admin/members/${memberId}`),
  apiClient<TrackingProgressDto>(`/api/gyms/${gymId}/coach/tracking/${memberId}`),
])
```

**Vista:**
- Header: foto + nombre del miembro
- Rutina activa: nombre, fechas
- Lista de bloques con ejercicios
- Cada ejercicio: ícono ✅ o ⬜ según `isCompleted`
- Métricas: total completados / total, porcentaje, última actividad

---

## Tests

### Editor de Plantillas
```
✅ Crear plantilla: form vacío, agregar bloque, agregar ejercicio, guardar → POST
✅ Editar plantilla: form pre-cargado con datos existentes → PUT
✅ Guardar sin nombre: error de validación, no envía
✅ Guardar sin bloques: error "Debe tener al menos un bloque"
✅ Bloque sin nombre: error inline en el bloque
✅ Ejercicio sin nombre: error inline en el ejercicio
✅ Agregar múltiples bloques y ejercicios: estado local se actualiza
✅ Eliminar ejercicio: se remueve del estado sin afectar otros
✅ Eliminar bloque: se remueve con todos sus ejercicios
✅ Editar plantilla con asignaciones activas: error 409, toast con mensaje
✅ Cancelar: redirige sin guardar (sin llamada al API)
```

### Asignación
```
✅ Selects se cargan con datos reales (members y templates)
✅ Preview de plantilla aparece al seleccionar
✅ Fecha de fin antes de inicio: error de validación
✅ Sin miembro seleccionado: error de validación
✅ Asignación exitosa: toast de éxito, form se resetea
```

### Progreso
```
✅ Lista de ejercicios con estado correcto (✅ / ⬜)
✅ Métricas muestran porcentaje correcto
✅ Miembro sin rutina activa: mensaje "Sin rutina asignada actualmente"
```
