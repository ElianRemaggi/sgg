# App Móvil — Pantallas: Progreso, Mi Gym y Perfil
**Rutas:** `(main)/(progress)/index`, `(main)/(gym)/index`, `(main)/(gym)/schedule`, `(main)/(profile)/index`

---

## (progress)/index.tsx — Tab Progreso

**Fetch:**
```ts
const { data: progress, isLoading } = useQuery({
  queryKey: ['progress', gymId],
  queryFn: () => apiClient<TrackingProgressDto>(
    `/api/gyms/${gymId}/member/tracking/progress`
  ),
  enabled: !!gymId,
  refetchOnWindowFocus: true,   // refrescar al volver a la tab
})
```

**Layout:**
```
ScrollView
├── ProgressRing (SVG animado)
│   └── Porcentaje de completado de la rutina actual
│       Ej: "75%" en el centro
│
├── StatsRow
│   ├── "18" completados hoy
│   ├── "24" total en la rutina
│   └── "6" pendientes
│
├── "Última actividad: hace 2 horas"
│
└── BlockProgressList (si hay rutina activa)
    └── Por cada bloque:
        ├── Nombre ("Día 1 — Pecho")
        └── Mini progress bar + "4/6 ejercicios"
```

**ProgressRing — implementación:**
```ts
// SVG con animación de stroke-dashoffset
// Usar Animated de React Native o react-native-reanimated
// El porcentaje se anima al montar y al cambiar el valor

function ProgressRing({ percent, size = 160 }: { percent: number; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - percent / 100)
  // ...animación con useSharedValue de reanimated
}
```

**Sin rutina activa:**
```
Ícono 📊
"Sin datos de progreso"
"Cuando tu coach te asigne una rutina, verás tu progreso acá"
```

---

## (gym)/index.tsx — Tab Mi Gym — Info

**Fetch:**
```ts
const { data: gymInfo } = useQuery({
  queryKey: ['gym-info', gymId],
  queryFn: () => apiClient<GymPublicDto>(`/api/gyms/${gymId}/info`),
  enabled: !!gymId,
  staleTime: 1000 * 60 * 10,   // 10 minutos, no cambia seguido
})
```

**Layout:**
```
ScrollView
├── GymHeader
│   ├── Logo del gym (o imagen placeholder)
│   ├── Nombre del gym
│   └── Descripción
│
├── InfoCard "Mi membresía"
│   ├── Rol: "Miembro" / "Coach"
│   ├── Estado: "Activa"
│   └── Vence: "31 dic 2026" (en rojo si < 30 días)
│
├── InfoCard "Mi coach"
│   ├── Foto + nombre del coach (si tiene)
│   └── "Sin coach asignado" (si no tiene)
│
└── Link → Horarios (navega a (gym)/schedule)
```

---

## (gym)/schedule.tsx — Horarios del Gym

**Fetch:**
```ts
const { data: schedule } = useQuery({
  queryKey: ['schedule', gymId],
  queryFn: () => apiClient<ScheduleActivityDto[]>(`/api/gyms/${gymId}/schedule`),
  enabled: !!gymId,
  staleTime: 1000 * 60 * 30,   // 30 minutos
})
```

**Layout:**
```
SectionList agrupado por día de la semana
│
├── Section "Lunes"
│   └── ActivityCard
│       ├── Nombre: "CrossFit Matutino"
│       ├── Horario: "07:00 – 08:00"
│       └── Descripción (si existe)
│
├── Section "Martes"
│   └── (sin actividades: no mostrar la sección)
│
└── ...
```

**Highlight del día actual:** la sección del día de hoy aparece con borde o fondo diferente.

**Estado vacío:** "No hay actividades programadas para esta semana."

---

## (profile)/index.tsx — Tab Perfil

**Fetch:**
```ts
const { data: user } = useQuery({
  queryKey: ['me'],
  queryFn: () => apiClient<UserDto>('/api/users/me'),
})

const { data: memberships } = useQuery({
  queryKey: ['memberships'],
  queryFn: () => apiClient<UserMembershipDto[]>('/api/users/me/memberships'),
})
```

**Layout:**
```
ScrollView
├── ProfileHeader
│   ├── Avatar (Image con fallback a iniciales)
│   ├── Nombre completo
│   └── Email
│
├── Section "Mi gym activo"
│   ├── GymCard (gym seleccionado)
│   └── Botón "Cambiar gym" → abre select-gym modal
│         (visible solo si tiene más de 1 membresía activa)
│
├── Section "Unirse a un gym"
│   ├── Input de búsqueda por slug
│   └── Botón "Buscar"
│         → GET /api/gyms/search?slug=...
│         → Si existe: modal de confirmación → POST join-request
│         → Si no existe: toast "No se encontró ningún gym con ese slug"
│
├── Section "Editar perfil"
│   └── Link → editar nombre y avatar
│
└── Botón "Cerrar sesión" (rojo, al final)
```

**Flujo "Unirse a un gym":**
```ts
async function searchAndJoin(slug: string) {
  // 1. Buscar gym
  const gym = await apiClient<GymPublicDto>(`/api/gyms/search?slug=${slug}`)
  // gym encontrado → mostrar modal de confirmación

  // 2. Modal: "¿Querés unirte a {nombre}?"
  // Al confirmar:
  await apiClient(`/api/gyms/${gym.id}/join-request`, { method: 'POST' })
  showToast("Solicitud enviada. El admin del gym te dará acceso pronto.")
  queryClient.invalidateQueries({ queryKey: ['memberships'] })
}
```

**Posibles errores en join-request:**
- 409 (ya tiene membresía pending/activa): toast "Ya tenés una solicitud pendiente en este gym"
- 404 (gym no encontrado): toast "No se encontró ningún gym con ese slug"
- Gym suspendido (404 del search): mismo mensaje que no encontrado

**Cerrar sesión:**
```ts
async function logout() {
  await supabase.auth.signOut()
  useGymStore.getState().clearActiveGym()
  queryClient.clear()
  router.replace('/(auth)/login')
}
```

**Editar perfil:**
```
Modal o pantalla separada:
├── Campo nombre (pre-cargado con nombre actual)
└── [Cancelar] [Guardar]

PUT /api/users/me → { fullName: "..." }
Al guardar: invalidar query ['me'] y cerrar modal
```

---

## Tests

### Progreso
```
✅ ProgressRing renderiza con el porcentaje correcto
✅ Sin rutina activa: estado vacío correcto
✅ Stats muestran números correctos (completados, total, pendientes)
✅ Última actividad muestra tiempo relativo ("hace 2 horas")
```

### Mi Gym
```
✅ Info del gym cargada: nombre, descripción, logo
✅ Info de membresía: rol y estado correctos
✅ Coach asignado: nombre y foto
✅ Sin coach: mensaje "Sin coach asignado"
✅ Vencimiento < 30 días: texto en rojo
```

### Horarios
```
✅ Actividades agrupadas por día correctamente
✅ Día actual destacado visualmente
✅ Días sin actividades no aparecen en la lista
✅ Sin actividades: estado vacío
```

### Perfil
```
✅ Datos del usuario cargados: nombre, email, avatar
✅ Gym activo mostrado con nombre y rol
✅ "Cambiar gym" visible solo con múltiples membresías
✅ Búsqueda de gym por slug exitosa: modal de confirmación
✅ Búsqueda de gym inexistente: toast de error
✅ Join request exitoso: toast de confirmación
✅ Join request duplicado: toast 409
✅ Cerrar sesión: limpia store, limpia queries, redirige a login
✅ Editar nombre: modal pre-cargado, guardar actualiza el header
```
