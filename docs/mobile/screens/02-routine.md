# App Móvil — Pantallas: Tab Mi Rutina
**Rutas:** `(main)/(routine)/index`, `(main)/(routine)/history`
**Usuarios:** MEMBER

---

## (routine)/index.tsx — Rutina Activa

Esta es la pantalla principal de la app. El member la usa a diario para ver y completar ejercicios.

**Fetch:**
```ts
const gymId = useGymStore(s => s.activeGymId)

const { data: routine, isLoading, isError, error } = useQuery({
  queryKey: ['routine', gymId],
  queryFn: () => apiClient<ActiveRoutineDto>(`/api/gyms/${gymId}/member/routine`),
  enabled: !!gymId,
  staleTime: 1000 * 60 * 2,   // 2 minutos de cache
})
```

**Estados posibles:**
```
gymId === null          → NoGymScreen (buscar gym)
isLoading               → RoutineSkeleton
isError && status === 404 → NoRoutineScreen (sin rutina asignada)
isError && otros         → ErrorScreen con botón reintentar
data                    → RoutineView
```

**RoutineView — layout:**
```
ScrollView
├── RoutineHeader
│   ├── Nombre de la plantilla
│   ├── Fechas: "1 feb – 28 feb"
│   └── ProgressBar + "18 de 24 ejercicios completados"
│
└── Lista de BlockSection (por cada bloque)
    ├── BlockHeader: "Día 1 — Pecho y Tríceps"
    └── Lista de ExerciseItem (por cada ejercicio)
        ├── CompletionToggle (checkbox animado)
        ├── Nombre del ejercicio (bold)
        ├── "4 series · 8-10 reps · 90s descanso"
        └── Notas (texto gris, colapsable si > 50 chars)
```

**CompletionToggle — lógica de toggle:**
```ts
const completeMutation = useMutation({
  mutationFn: ({ exerciseId, isCompleted }: { exerciseId: number, isCompleted: boolean }) =>
    apiClient(`/api/gyms/${gymId}/member/tracking/${isCompleted ? 'complete' : 'undo'}`, {
      method: 'POST',
      body: JSON.stringify({ assignmentId: routine.assignmentId, exerciseId }),
    }),
  onMutate: async ({ exerciseId, isCompleted }) => {
    // Optimistic update: cambiar estado local inmediatamente
    await queryClient.cancelQueries({ queryKey: ['routine', gymId] })
    const prev = queryClient.getQueryData(['routine', gymId])
    queryClient.setQueryData(['routine', gymId], (old: ActiveRoutineDto) => ({
      ...old,
      blocks: old.blocks.map(block => ({
        ...block,
        exercises: block.exercises.map(ex =>
          ex.id === exerciseId ? { ...ex, isCompleted } : ex
        )
      }))
    }))
    return { prev }
  },
  onError: (err, vars, context) => {
    // Rollback si falla
    queryClient.setQueryData(['routine', gymId], context?.prev)
    showToast("Error al guardar. Intentá de nuevo.")
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['progress', gymId] })
  }
})
```

**Importante:** usar **optimistic update** para que el toggle se sienta instantáneo aunque haya latencia de red.

**ExerciseItem — comportamiento:**
- Tap en el checkbox: toggle isCompleted
- Ejercicio completado: tachado visualmente + opacity 0.6
- Tap largo en el ejercicio: mostrar `restSeconds` con countdown timer (opcional)

**NoRoutineScreen:**
```
Ícono 🏋️
"Todavía no tenés una rutina asignada"
"Tu coach te va a asignar una próximamente"
[Contactar al coach] (si tiene coach asignado — abre WhatsApp / mensaje)
```

**NoGymScreen:**
```
Ícono 🏢
"No tenés un gym activo"
[Seleccionar gym] → abre select-gym modal
```

---

## (routine)/history.tsx — Historial de Rutinas

**Fetch:**
```ts
const { data: history } = useQuery({
  queryKey: ['routine-history', gymId],
  queryFn: () => apiClient<RoutineAssignmentSummaryDto[]>(
    `/api/gyms/${gymId}/member/routine/history`
  ),
  enabled: !!gymId,
})
```

**Lista:**
```
FlatList
└── HistoryCard (por cada asignación pasada)
    ├── Nombre de la plantilla
    ├── "1 feb 2026 – 28 feb 2026"
    └── "24/24 ejercicios completados" (o el porcentaje que haya alcanzado)
```

**Estado vacío:** "Todavía no tenés rutinas anteriores."

---

## Tests

```
✅ Sin gym activo: renderiza NoGymScreen con botón "Seleccionar gym"
✅ Loading: muestra RoutineSkeleton (sin crashes)
✅ Sin rutina asignada (404): renderiza NoRoutineScreen
✅ Error de red: renderiza ErrorScreen con botón reintentar
✅ Con rutina: renderiza bloques y ejercicios correctamente
✅ Toggle completar: optimistic update cambia el UI inmediatamente
✅ Toggle deshacer: revierte el estado visualmente
✅ Toggle falla: rollback al estado anterior + toast
✅ ProgressBar refleja cantidad de completados correctamente
✅ Ejercicio completado: aparece visualmente diferente (tachado / opacidad)
✅ Notas largas: colapsadas por defecto, expandibles

✅ Historial: lista de rutinas pasadas con fechas
✅ Historial vacío: mensaje apropiado
```
