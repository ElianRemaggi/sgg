# Frontend Web — Sección: Member — Mi Rutina
**Ruta:** `/gym/[gymId]/member/routine`
**Acceso:** MEMBER | ADMIN | COACH | ADMIN_COACH

---

## Estructura de componentes

```
MemberRoutinePage (Server Component)           ← page.tsx
└── RoutineTrackingView (Client Component)     ← routine-tracking-view.tsx
    ├── Header: nombre de la plantilla + fechas de vigencia
    ├── Barra de progreso del día
    ├── Tabs de días (Día 1, Día 2 … según bloques)
    └── Card del bloque activo
        └── ExerciseRow × N                    ← exercise-row.tsx
```

---

## Fetch (Server Component)

Se ejecutan dos fetches en paralelo con `Promise.allSettled` para que un fallo en el progress no rompa la vista de la rutina:

```ts
const [routineResult, progressResult] = await Promise.allSettled([
  apiClient<ApiResponse<MemberRoutineDto>>(`/api/gyms/${gymId}/member/routine`),
  apiClient<ApiResponse<TrackingProgressDto>>(`/api/gyms/${gymId}/member/tracking/progress`),
])
```

- Si `routine` falla → mensaje "No tenés una rutina asignada actualmente."
- Si `progress` falla → se pasa `progress={null}` a la vista (sin barra de progreso, sin completions, sin observaciones)

---

## `TrackingProgressDto` — campo `previousNotesByExerciseId`

El endpoint `GET /api/gyms/{gymId}/member/tracking/progress` incluye:

```ts
previousNotesByExerciseId: Record<number, string>
```

Mapa de `exerciseId → última nota` que el usuario haya registrado para ese ejercicio en **cualquier sesión anterior a hoy** (cualquier asignación). Solo incluye ejercicios que tengan al menos una completion pasada con `notes` no vacío.

**Uso:** `RoutineTrackingView` pasa `previousNotes={progress?.previousNotesByExerciseId[exercise.id] ?? null}` a cada `ExerciseRow`.

---

## `ExerciseRow` — form de completion

El form se expande al tocar el botón de chevron. Estado local (no sube al server hasta el submit):

```ts
const [weightKg, setWeightKg]   = useState(completion?.weightKg?.toString() ?? '')
const [actualReps, setActualReps] = useState(completion?.actualReps?.toString() ?? '')
const [notes, setNotes]          = useState(completion?.notes ?? '')
```

Los valores se pre-cargan desde la completion de **hoy** si ya existe (comportamiento upsert del backend). La `previousNotes` es puramente informativa y **no pre-carga el input**.

### Observación de sesión anterior

Cuando `previousNotes` es no-nulo, se renderiza arriba del input "Notas (opcional)":

```tsx
{previousNotes && (
  <p className="text-xs text-muted-foreground mb-2">
    <span className="font-medium">Observación:</span> {previousNotes}
  </p>
)}
```

**Semántica:** muestra el último comentario que el usuario dejó en sesiones previas para ese ejercicio específico. Ayuda a recordar intenciones como "subir 2.5 kg la próxima vez" sin abrir el historial.

### Flujo de completion

```
Usuario abre el form
  ↓
[Opcional] Ve "Observación: <nota anterior>"
  ↓
Ingresa Peso (kg) | Reps reales | Notas (opcional)
  ↓
Click "Completar"
  ↓
Server Action completeExercise → POST /api/gyms/{gymId}/member/tracking/complete
  { assignmentId, exerciseId, weightKg?, actualReps?, notes? }
  ↓
Éxito → toast "¡Ejercicio completado!" + cierra el form
Error → toast con mensaje del backend
```

### Undo con confirmación doble

El botón de deshacer requiere dos clicks para evitar toques accidentales:
1. Primer click → muestra "¿Confirmar?" por 3 segundos
2. Segundo click → Server Action `undoExercise` → `POST /api/.../tracking/undo`

---

## Server Actions

Archivo: `exercise-row/actions.ts` (`'use server'`)

```ts
completeExercise(gymId, assignmentId, exerciseId, weightKg, actualReps, notes)
  → POST /api/gyms/{gymId}/member/tracking/complete

undoExercise(gymId, assignmentId, exerciseId)
  → POST /api/gyms/{gymId}/member/tracking/undo
```

Ambas acciones llaman `revalidatePath` para refrescar los datos tras la mutación.

---

## Props de `ExerciseRow`

```ts
interface ExerciseRowProps {
  gymId: string
  assignmentId: number
  exercise: TemplateExerciseDto
  completion: ExerciseCompletionDto | undefined   // completion de hoy, si existe
  previousNotes: string | null                    // última nota de sesiones previas
}
```

---

## Tests

Archivo: `__tests__/routine-tracking-view.test.tsx` (Vitest + Testing Library)

```
✅ Renders template name
✅ Renders day tabs for each block
✅ Shows progress bar when progress data is provided
✅ Marks exercise as "hoy" when currentDayNumber matches
✅ Shows exercise name and expand button when not completed
✅ Expands form on chevron click and allows completion
✅ Shows completed state with check icon and weight/reps badges
✅ Requests confirmation before undo, then calls undoExercise
✅ Shows toast error when completeExercise fails
✅ Shows "Observación" from previous session when form is expanded
✅ Does not show "Observación" when there are no previous notes
```

Los tests de integración backend que cubren `previousNotesByExerciseId` están en `TrackingControllerTest.java`.

---

## Historial de Rutinas

Tres páginas anidadas compartidas por member y coach (via componentes reutilizables en `src/components/history/`).

### /member/history — Lista de asignaciones

**Ruta:** `/gym/[gymId]/member/history`
**Fetch (Server Component):**
```ts
GET /api/gyms/{gymId}/member/history/assignments
→ AssignmentHistorySummaryDto[]
```

**Componente:** `HistoryListView` (Client — maneja tab Activa/Pasadas)

**Layout:**
```
Tabs: [Activa] [Pasadas (N)]
└── AssignmentCard por asignación
    ├── Nombre de plantilla + badge "Activa"
    ├── Fechas (startsAt → endsAt o "sin vencimiento")
    ├── "{totalCompletions} completions · {totalSessionDays} días entrenados"
    └── Navega a /member/history/{assignmentId}
```

**Estado vacío por tab:**
- Activa: "No tenés rutina activa."
- Pasadas: "No hay rutinas pasadas aún."

---

### /member/history/[assignmentId] — Detalle de asignación

**Ruta:** `/gym/[gymId]/member/history/[assignmentId]`
**Fetch (Server Component):**
```ts
GET /api/gyms/{gymId}/member/history/assignments/{assignmentId}
→ AssignmentHistoryDetailDto
```

**Componente:** `AssignmentDetailView`

**Layout:**
```
Header: nombre de plantilla + badge "Activa" + fechas
Stats row (3 cards):
├── Días entrenados (totalDistinctDays)
├── Completions (totalCompletions)
└── Bloques (blocks.length)

Por bloque (Card):
└── "Día N — {nombre}"
    └── ExerciseRow por ejercicio
        ├── Nombre + "N sesión(es)"
        ├── "mejor: X kg · último: Y kg" (si tiene peso)
        └── Navega a .../exercises/{exerciseId}
            (solo si bestWeightKg !== null || sessionsCount > 0)
```

---

### /member/history/[assignmentId]/exercises/[exerciseId] — Progresión de ejercicio

**Ruta:** `/gym/[gymId]/member/history/[assignmentId]/exercises/[exerciseId]`
**Fetch (Server Component):**
```ts
GET /api/gyms/{gymId}/member/history/assignments/{assignmentId}/exercises/{exerciseId}
→ ExerciseProgressDto
```

**Componente:** `ExerciseProgressView` (Client — incluye SVG chart)

**Layout:**
```
Header:
├── "Día N · {blockName}"
├── Nombre del ejercicio
└── DeltaBadge: variación de peso (↑ verde / ↓ rojo / — gris)

Stats (4 cards): mejor peso · promedio · sesiones · último peso

WeightChart (SVG):
├── Requiere ≥ 2 sesiones con weightKg
├── Línea + puntos, gradiente de fill
├── Eje Y: min/mid/max peso; Eje X: fechas primera/última
└── Si < 2 sesiones: mensaje informativo

Historial de sesiones (lista desc):
└── Fecha · peso kg · reps · notas (si existe)
```

**Componentes compartidos** (`src/components/history/`):
| Componente | Usado en |
|------------|----------|
| `HistoryListView` | `/member/history` y `/coach/history/[memberId]` |
| `AssignmentDetailView` | `/member/history/[id]` y `/coach/history/[memberId]/[id]` |
| `ExerciseProgressView` | `.../exercises/[exerciseId]` (member y coach) |

Los componentes reciben `basePath` como prop para que los links internos funcionen tanto en el contexto member como en el contexto coach.

---

## Tests de Historial

Archivos en `src/components/history/__tests__/`:

```
history-list-view.test.tsx
✅ Muestra tab "Activa" con la asignación activa
✅ Cambia a tab "Pasadas" y muestra asignaciones pasadas
✅ Estado vacío en tab Activa: mensaje correcto
✅ Link a basePath/{id} al hacer click en card

assignment-detail-view.test.tsx
✅ Muestra nombre, fechas, badge "Activa"
✅ Stats: días, completions, bloques
✅ Ejercicio con peso: muestra "mejor" y "último"
✅ Ejercicio sin peso: sin stats de peso
✅ Link a exercises/{id} para ejercicios con sesiones

exercise-progress-view.test.tsx
✅ Muestra nombre del ejercicio y blockName/dayNumber
✅ DeltaBadge positivo → verde con TrendingUp
✅ DeltaBadge negativo → rojo con TrendingDown
✅ Sin delta → no muestra badge
✅ Chart con ≥ 2 sesiones con peso: renderiza SVG
✅ Chart con < 2 sesiones: muestra mensaje informativo
✅ Lista de sesiones ordenada desc
```
