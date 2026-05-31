# App Móvil — Pantallas: Tab Rutina
**Rutas:** `(main)/(routine)/index`, `(main)/(routine)/history`, `(main)/(routine)/history/[assignmentId]`, `(main)/(routine)/history/[assignmentId]/exercise/[exerciseId]`
**Tab label:** "Rutina" (ícono: Dumbbell)
**Usuarios:** MEMBER

---

## (routine)/index.tsx — Rutina Activa

Esta es la pantalla principal de la app. El member la usa a diario para ver y completar ejercicios.

**Fetch:**
```ts
const { selectedGymId } = useGymStore()
const gymId = selectedGymId!

const { data: routineData, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.memberRoutine(gymId),
  queryFn: () => apiClient<ApiResponse<MemberRoutineDto>>(`/api/gyms/${gymId}/member/routine`),
})

const { data: progressData } = useQuery({
  queryKey: queryKeys.memberProgress(gymId),
  queryFn: () => apiClient<ApiResponse<TrackingProgressDto>>(`/api/gyms/${gymId}/member/tracking/progress`),
  retry: false,
})
```

**Estados posibles:**
```
isLoading           → RoutineSkeleton
error 404           → EmptyState "Sin rutina asignada"
error otro          → ErrorScreen con botón reintentar
data                → RoutineView
```

**RoutineView — layout:**
```
ScrollView
├── Header
│   ├── Nombre de la plantilla (text-xl bold)
│   └── "Desde {fecha}" o "Desde {fecha} hasta {fecha}"
│
├── RoutineProgressBar (si hay progressData)
│   ├── Nombre del bloque activo + completados/total
│   ├── Barra de progreso
│   └── Chips de día (Día 1, Día 2, ...) → onSelectDay
│
└── BlockSection (del día activo)
    └── Lista de ExerciseRow por ejercicio
```

**Lógica de día activo:**
```ts
const [selectedDay, setSelectedDay] = useState<number | null>(null)
const activeDay = selectedDay ?? (progress?.currentDayNumber ?? routine.blocks[0]?.dayNumber ?? 1)
const activeBlock = routine.blocks.find((b) => b.dayNumber === activeDay) ?? routine.blocks[0]
```

Solo se muestra **un bloque a la vez** (el del día activo). El usuario puede cambiar de día tocando los chips en `RoutineProgressBar`.

**CompletionMap:**
```ts
const completionMap = new Map<number, ExerciseCompletionDto>(
  (progress?.completions ?? []).map((c) => [c.exerciseId, c])
)
// Se pasa a BlockSection → ExerciseRow para saber qué ejercicios están completados
```

**ExerciseRow — datos de completions (peso/reps/notas):**
El ExerciseRow permite al usuario ingresar peso, reps y notas al completar. La mutación llama:
- `POST /api/gyms/${gymId}/member/tracking/complete` con `{ assignmentId, exerciseId, weightKg, actualReps, notes }`
- `POST /api/gyms/${gymId}/member/tracking/undo` para desmarcar

**Optimistic update:** el toggle cambia el estado local inmediatamente; si falla, rollback + toast.

---

## (routine)/history.tsx — Historial de Rutinas

Lista todas las asignaciones (activas y pasadas) del member.

**Fetch:**
```ts
const { data } = useQuery({
  queryKey: queryKeys.memberRoutineHistory(gymId),
  queryFn: () =>
    apiClient<ApiResponse<RoutineHistorySummaryDto[]>>(
      `/api/gyms/${gymId}/member/history/assignments`
    ),
})
```

> Endpoint: `/api/gyms/${gymId}/member/history/assignments` (no `/member/routine/history`)

**Lista (FlatList):**
```
HistoryCard por asignación
├── Nombre de la plantilla
├── Badge "activa" (si item.isActive === true)
├── Fechas: "1 ene 2026 – 28 ene 2026" (o "Desde {fecha}" si no tiene fin)
├── "{totalCompletions} completados · {totalSessionDays} sesiones"
└── "Último: {lastActivityAt}" (si existe)
```

**Al tocar una card:**
```ts
router.push(`/(main)/(routine)/history/${item.id}`)
```

**Estado vacío:** "Todavía no tenés rutinas anteriores."

---

## history/[assignmentId]/index.tsx — Detalle de Rutina

Pantalla con header nativo ("Detalle de rutina", back → "Historial").

**Fetch:**
```ts
const { assignmentId } = useLocalSearchParams<{ assignmentId: string }>()

apiClient<ApiResponse<AssignmentHistoryDetailDto>>(
  `/api/gyms/${gymId}/member/history/assignments/${assignmentId}`
)
```

**Layout:**
```
ScrollView
├── Header: nombre de plantilla + rango de fechas
├── Card "Resumen"
│   ├── Sesiones (totalDistinctDays)
│   ├── Completados (totalCompletions)
│   ├── Primera sesión (firstActivityAt)
│   └── Última sesión (lastActivityAt)
│
└── Por bloque:
    ├── "Día N — {nombre del bloque}"
    └── Lista de ExerciseRow
        ├── Nombre del ejercicio
        ├── "{sessionsCount} ses." | "Sin registros" (si sessionsCount === 0)
        ├── "Mejor: X kg" (si bestWeightKg != null)
        ├── "Último: X kg" (si lastWeightKg != null)
        └── ChevronRight (solo si sessionsCount > 0) → navega a progresión
```

**Ejercicio sin sesiones:** sin tap, opacity 0.5.
**Al tocar ejercicio con sesiones:**
```ts
router.push(`/(main)/(routine)/history/${assignmentId}/exercise/${exercise.exerciseId}`)
```

---

## history/[assignmentId]/exercise/[exerciseId].tsx — Progresión de Ejercicio

Pantalla con header nativo ("Progresión", back → "Rutina").

**Fetch:**
```ts
apiClient<ApiResponse<ExerciseProgressDto>>(
  `/api/gyms/${gymId}/member/history/assignments/${assignmentId}/exercises/${exerciseId}`
)
```

**Layout:**
```
ScrollView
├── "{blockName} · Día {dayNumber}"
├── "{exerciseName}" (text-lg bold)
│
├── Stats row (cards)
│   ├── Mejor: {bestWeightKg} kg
│   ├── Promedio: {avgWeightKg} kg
│   ├── Primero: {firstWeightKg} kg
│   └── Evolución: {deltaPercent}% (verde si >0, rojo si <0)
│
├── WeightChart (SVG — solo si hay >= 2 sesiones con peso)
│   ├── Gráfico de línea con puntos verdes (#16a34a)
│   ├── Grid horizontal con etiquetas de peso (Y)
│   └── Fechas primera/última sesión (X)
│   (si < 2 sesiones: "Se necesitan al menos 2 sesiones con peso")
│
└── Lista de sesiones (desc cronológico)
    └── SessionRow
        ├── Fecha ({day} {mes})
        ├── {weightKg} kg (si existe)
        ├── {actualReps} reps (si existe)
        └── Notes (si existe, max 2 líneas)
```

**WeightChart:** usa `react-native-svg` (Svg, Circle, Line, Polyline, Text). Solo grafica sesiones completadas con peso.

---

## Tests

```
✅ (routine)/index: loading → skeleton
✅ (routine)/index: error 404 → EmptyState "Sin rutina asignada"
✅ (routine)/index: error de red → ErrorScreen con reintentar
✅ (routine)/index: rutina cargada → muestra nombre + RoutineProgressBar + BlockSection
✅ (routine)/index: selección de día → cambia el bloque mostrado
✅ (routine)/index: toggle completar → optimistic update inmediato
✅ (routine)/index: toggle deshacer → revierte estado

✅ history: lista de rutinas con fechas y stats
✅ history: rutina activa → badge "activa"
✅ history: vacío → EmptyState
✅ history: tap en card → navega a /history/{id}
```
