# App Móvil — Convenciones y Patrones
**Ref rápida para Claude Code al trabajar en sgg-app/**

---

## Reglas Absolutas

| Regla | Correcto | Incorrecto |
|-------|----------|-----------|
| Almacenamiento de tokens | `expo-secure-store` | `AsyncStorage`, `localStorage` |
| Fetch inicial de datos | `useQuery` de React Query | `useEffect` + `useState` + `fetch` |
| URL de la API | `process.env.EXPO_PUBLIC_API_URL` | Hardcodeada |
| Estado del gym activo | `useGymStore()` (Zustand) | Estado local en componente |
| Verify gym antes de fetch | `enabled: !!gymId` | Llamar sin verificar |

---

## Query Keys — Convención

```ts
// lib/queryKeys.ts
export const queryKeys = {
  me:          () => ['me'] as const,
  memberships: () => ['memberships'] as const,
  routine:     (gymId: number) => ['routine', gymId] as const,
  history:     (gymId: number) => ['routine-history', gymId] as const,
  progress:    (gymId: number) => ['progress', gymId] as const,
  gymInfo:     (gymId: number) => ['gym-info', gymId] as const,
  schedule:    (gymId: number) => ['schedule', gymId] as const,
}
// Usar siempre estas keys para consistencia en invalidaciones
```

---

## Patrón de Pantalla Estándar

```ts
export default function MyScreen() {
  const gymId = useGymStore(s => s.activeGymId)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.algo(gymId!),
    queryFn: () => apiClient<MiDto>(`/api/gyms/${gymId}/...`),
    enabled: !!gymId,
  })

  // 1. Sin gym
  if (!gymId) return <NoGymScreen />

  // 2. Cargando
  if (isLoading) return <MiSkeleton />

  // 3. Error
  if (isError) return <ErrorScreen message={error.message} onRetry={refetch} />

  // 4. Sin datos
  if (!data || data.length === 0) return <EmptyState ... />

  // 5. Datos
  return <MiVista data={data} />
}
```

---

## Patrón de Mutación con Optimistic Update

```ts
const mutation = useMutation({
  mutationFn: (payload) => apiClient('/api/...', { method: 'POST', body: JSON.stringify(payload) }),

  onMutate: async (payload) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.algo(gymId!) })
    const snapshot = queryClient.getQueryData(queryKeys.algo(gymId!))
    // Actualizar cache optimísticamente
    queryClient.setQueryData(queryKeys.algo(gymId!), (old) => ({ ...old, /* cambio */ }))
    return { snapshot }
  },

  onError: (err, payload, context) => {
    queryClient.setQueryData(queryKeys.algo(gymId!), context?.snapshot)
    showToast("Error. Intentá de nuevo.")
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.algo(gymId!) })
  },
})
```

Usar optimistic update en: toggle de ejercicio completado. No usar para: join-request, cambio de perfil (no es urgente).

---

## Manejo de Errores de API

```ts
// lib/api.ts
export class ApiError extends Error {
  constructor(public status: number, public body: { message?: string; errors?: string[] }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

// En componentes:
if (error instanceof ApiError) {
  if (error.status === 409) showToast(error.body.message ?? "Conflicto")
  if (error.status === 404) showToast("No encontrado")
  if (error.status === 403) showToast("Sin permiso")
} else {
  showToast("Error de conexión")
}
```

---

## Componentes UI Reutilizables (a crear en components/ui/)

| Componente | Props clave | Uso |
|-----------|-------------|-----|
| `Button` | `variant`, `loading`, `disabled` | Todos los botones |
| `Card` | `padding`, `shadow` | Contenedores de info |
| `Badge` | `color`, `text` | Roles, status |
| `Avatar` | `uri`, `name`, `size` | Foto de usuario con fallback a iniciales |
| `EmptyState` | `icon`, `title`, `subtitle`, `action` | Pantallas vacías |
| `ErrorScreen` | `message`, `onRetry` | Errores de fetch |
| `Skeleton` | `width`, `height`, `borderRadius` | Loading states |
| `Toast` | Global via Context | Mensajes temporales |

---

## Navegación — Reglas

```ts
// Navegar entre tabs: usar el router de Expo Router
router.push('/(main)/(routine)/')   // ir a rutina
router.replace('/(auth)/login')     // reemplazar (sin back)
router.dismiss()                     // cerrar modal

// Modal select-gym: se abre como sheet desde cualquier pantalla
// No usar navigate para modales — usar el patrón de Expo Router sheets
```

---

## Expo — Variables de Entorno

```ts
// Solo EXPO_PUBLIC_ son accesibles en el cliente
// Las otras solo en el servidor de Expo (eas build)

process.env.EXPO_PUBLIC_API_URL        // URL del backend
process.env.EXPO_PUBLIC_SUPABASE_URL   // URL de Supabase
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Para desarrollo con WSL2:
// Opción 1: EXPO_PUBLIC_API_URL=http://TU_IP_WSL2:8080
// Opción 2: usar --tunnel y la URL del tunnel
```

---

## package.json — Dependencias Clave

```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "expo-auth-session": "~5.5.0",
    "expo-web-browser": "~13.0.0",
    "@supabase/supabase-js": "^2.44.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",
    "nativewind": "^4.0.0",
    "react-native-reanimated": "~3.10.0",
    "zod": "^3.23.0"
  }
}
```
