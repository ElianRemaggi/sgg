# App Móvil — Pantallas: Progreso, Mi Gym y Perfil
**Rutas:** `(main)/(progress)/index`, `(main)/(gym)/index`, `(main)/(gym)/schedule`, `(main)/(profile)/index`

---

## (progress)/index.tsx — Tab Historial (Progreso actual)

**Tab label:** "Historial" (ícono: BarChart2)

**Fetch:**
```ts
const { data, isLoading, error, refetch } = useQuery({
  queryKey: queryKeys.memberProgress(gymId),
  queryFn: () => apiClient<ApiResponse<TrackingProgressDto>>(
    `/api/gyms/${gymId}/member/tracking/progress`
  ),
  refetchOnWindowFocus: true,
})
```

**Layout:**
```
ScrollView
├── "Mi progreso" (título)
│
├── Card con ProgressRing
│   ├── Anillo SVG con porcentaje (progress.progressPercent)
│   └── Nombre del bloque activo (progress.currentBlockName) o "Rutina activa"
│
├── Stats row (3 cards)
│   ├── Completados hoy (progress.completedToday) — verde
│   ├── Total completados (progress.completedTotal) — slate
│   └── Pendientes (totalExercises - completedTotal) — ámbar
│
├── Card "Última actividad"
│   └── Tiempo relativo ("hace 2 h", "hace 3 días") — basado en progress.lastActivityAt
│
├── "Rutina actual" + "{completedTotal} de {totalExercises} ejercicios completados"
│
└── Link "Ver historial de rutinas" → router.push('/(main)/(routine)/history')
```

**Sin rutina activa (404):**
```
EmptyState
"Sin datos de progreso"
"Cuando tu coach te asigne una rutina, verás tu progreso acá"
```

**ProgressRing:** implementado con `react-native-svg` en `components/routine/ProgressRing.tsx`.

---

## (gym)/index.tsx — Tab Mi Gym — Info

**Tab label:** "Mi gym" (ícono: Building2)

**Fetch:**
```ts
const { data: gymInfo } = useQuery({
  queryKey: queryKeys.gymInfo(gymId),
  queryFn: () => apiClient<ApiResponse<GymPublicDto>>(`/api/gyms/${gymId}/info`),
  staleTime: 1000 * 60 * 10,
})
```

**Layout:**
```
ScrollView
├── GymHeader: nombre, descripción
├── InfoCard "Mi membresía": rol, estado, vencimiento
├── InfoCard "Mi coach": nombre (o "Sin coach asignado")
└── Link → Horarios (navega a (gym)/schedule)
```

---

## (gym)/schedule.tsx — Horarios del Gym

**Fetch:**
```ts
const { data: schedule } = useQuery({
  queryKey: queryKeys.gymSchedule(gymId),
  queryFn: () => apiClient<ApiResponse<ScheduleActivityDto[]>>(`/api/gyms/${gymId}/schedule`),
  staleTime: 1000 * 60 * 30,
})
```

**Layout:**
```
SectionList agrupado por día de la semana
├── Section "Lunes" (destaca el día actual)
│   └── ActivityCard: nombre, horario, descripción
└── ...
```

**Estado vacío:** "No hay actividades programadas para esta semana."

---

## (profile)/index.tsx — Tab Perfil

**Tab label:** "Perfil" (ícono: User)

**Fetch:**
```ts
const { data: userData } = useQuery({
  queryKey: queryKeys.currentUser(),
  queryFn: () => apiClient<ApiResponse<UserDto>>('/api/users/me'),
})

const { data: membershipsData } = useQuery({
  queryKey: queryKeys.memberships(),
  queryFn: () => apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
})
```

**Layout:**
```
ScrollView
│
├── Card de perfil
│   ├── Avatar (inicial del nombre, fondo green-100/green-900)
│   ├── Nombre completo
│   ├── Email
│   └── Ícono Edit2 → abre modal "Editar nombre"
│
├── Link discreto "Eliminar cuenta" (texto xs rojo, alineado a la derecha)
│   └── Abre modal de doble confirmación
│
├── Card "Mi gym activo" (si hay gym seleccionado con membresía activa)
│   ├── Nombre del gym
│   ├── Rol + gymSlug
│   └── "Cambiar gym" → router.push('/select-gym')
│         (visible solo si tiene > 1 membresía activa)
│
├── Card "Apariencia" — selector de tema
│   └── Toggle de 3 opciones: Sistema | Claro | Oscuro
│       (opción seleccionada: fondo verde)
│
├── Card "Unirse a un gym"
│   ├── TextInput + botón "Buscar" → GET /api/gyms/search?slug=...
│   ├── Si encontrado: card con nombre/descripción + botón "Solicitar acceso"
│   │     → modal de confirmación → POST /api/gyms/${id}/join-request
│   └── Si no encontrado: "No se encontró ningún gym con ese slug."
│
└── Botón "Cerrar sesión" (variant destructive)
```

**Flujo "Cerrar sesión":**
```ts
await logout()     // borra sgg.jwt + supabase.auth.signOut()
clearGym()
queryClient.clear()
router.replace('/(auth)/login')
```

**Modal "Editar nombre":**
- TextInput pre-cargado con nombre actual
- `PUT /api/users/me` con `{ fullName }`
- `onSuccess`: invalida `queryKeys.currentUser()` + cierra modal + toast

**Modal "Eliminar cuenta" — doble confirmación:**
- Muestra advertencia: "Esta acción es permanente"
- El usuario debe escribir exactamente `ELIMINAR` (mayúsculas) para habilitar el botón
- `DELETE /api/users/me`
- `onSuccess`: logout() + clearGym() + queryClient.clear() + replace a login

**Modal "Confirmar solicitud de gym":**
- "¿Querés unirte a {gymName}?"
- `POST /api/gyms/${id}/join-request`
- `onSuccess`: toast + invalida memberships
- Error 409: toast "Ya tenés una solicitud pendiente en este gym"

**Selector de tema:**
```ts
const { mode, setMode } = useThemeStore()
const { setColorScheme } = useColorScheme()  // nativewind

function handleSetTheme(m: ThemeMode) {
  setMode(m)         // persiste en SecureStore
  setColorScheme(m)  // aplica a NativeWind
}
```

---

## Tests

### Progreso
```
✅ ProgressRing renderiza con el porcentaje correcto
✅ Sin rutina activa (404): EmptyState correcto
✅ Stats correctos (completadosHoy, total, pendientes)
✅ Última actividad: tiempo relativo
✅ Link a historial navega a /(main)/(routine)/history
```

### Perfil
```
✅ Datos del usuario: nombre, email, inicial del avatar
✅ Gym activo: nombre, rol, slug
✅ "Cambiar gym" visible solo con múltiples membresías
✅ Selector de tema: opción seleccionada destaca en verde
✅ Cambiar tema: llama setMode + setColorScheme
✅ Búsqueda de gym por slug: muestra card con "Solicitar acceso"
✅ Búsqueda inexistente: mensaje de no encontrado
✅ Join request exitoso: toast de confirmación
✅ Join request duplicado: toast 409
✅ Editar nombre: modal pre-cargado, guardar invalida currentUser
✅ Cerrar sesión: limpia todo → login
✅ Eliminar cuenta: solo se habilita al escribir "ELIMINAR"
✅ Eliminar cuenta exitosa: logout → login
```
