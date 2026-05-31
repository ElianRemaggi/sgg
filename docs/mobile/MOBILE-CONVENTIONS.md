# App Móvil — Convenciones y Patrones
**Ref rápida para Claude Code al trabajar en sgg-app/**

---

## Reglas Absolutas

| Regla | Correcto | Incorrecto |
|-------|----------|-----------|
| Almacenamiento de tokens | `expo-secure-store` | `AsyncStorage`, `localStorage` |
| Fetch inicial de datos | `useQuery` de React Query | `useEffect` + `useState` + `fetch` |
| URL de la API | `process.env.EXPO_PUBLIC_API_URL` | Hardcodeada |
| Estado del gym activo | `useGymStore().selectedGymId` | Estado local en componente |
| Formularios | `react-hook-form` + `zodResolver` | `useState` manual por campo |
| Íconos | `lucide-react-native` | Íconos de otras librerías |

---

## Query Keys — Convención

```ts
// lib/queryKeys.ts
export const queryKeys = {
  memberships:       () => ['memberships'] as const,
  memberRoutine:     (gymId: string) => ['member', gymId, 'routine'] as const,
  memberProgress:    (gymId: string) => ['member', gymId, 'progress'] as const,
  memberRoutineHistory: (gymId: string) => ['member', gymId, 'routineHistory'] as const,
  gymSearch:         (slug: string) => ['gym', 'search', slug] as const,
  gymInfo:           (gymId: string) => ['gym', gymId, 'info'] as const,
  gymSchedule:       (gymId: string) => ['gym', gymId, 'schedule'] as const,
  assignmentDetail:  (gymId: string, assignmentId: string) => ['member', gymId, 'history', assignmentId] as const,
  exerciseProgress:  (gymId: string, assignmentId: string, exerciseId: string) => ['member', gymId, 'history', assignmentId, 'exercise', exerciseId] as const,
  currentUser:       () => ['currentUser'] as const,
}
// Usar SIEMPRE estas keys para consistencia en invalidaciones
```

> **Importante:** `gymId` es `string` en todo el store y las queries (se convierte con `String(id)` al guardarlo).

---

## Patrón de Pantalla Estándar

```ts
export default function MyScreen() {
  const { selectedGymId } = useGymStore()
  const gymId = selectedGymId!   // (main) garantiza que no es null

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.memberRoutine(gymId),
    queryFn: () => apiClient<ApiResponse<MiDto>>(`/api/gyms/${gymId}/...`),
  })

  // 1. Cargando
  if (isLoading) return <MiSkeleton />

  // 2. Error 404 → vacío
  if (isError && error instanceof ApiError && error.status === 404)
    return <EmptyState title="..." subtitle="..." />

  // 3. Error genérico
  if (isError) return <ErrorScreen onRetry={refetch} />

  // 4. Sin datos
  if (!data?.data) return <EmptyState title="..." subtitle="..." />

  // 5. Datos
  return <MiVista data={data.data} />
}
```

> **Nota:** `(main)/_layout.tsx` redirige a `/select-gym` si `selectedGymId` es null, así que dentro de `(main)` el gymId siempre existe.

---

## Respuestas de API

Todas las respuestas del backend están envueltas:
```ts
interface ApiResponse<T> { data: T }

// Acceder siempre con:
const items = data?.data ?? []
const item = data?.data
```

---

## Patrón de Formularios

```ts
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  field: z.string().min(1, 'Requerido'),
})
type FormValues = z.infer<typeof schema>

export default function MyForm() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormValues) => {
    // llamar API...
  }

  return (
    <>
      <Controller
        control={control}
        name="field"
        render={({ field }) => (
          <Input
            label="Campo"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.field?.message}
          />
        )}
      />
      <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting}>
        Guardar
      </Button>
    </>
  )
}
```

---

## Patrón de Mutación con Optimistic Update

```ts
const mutation = useMutation({
  mutationFn: (payload) => apiClient('/api/...', { method: 'POST', body: JSON.stringify(payload) }),

  onMutate: async (payload) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.memberRoutine(gymId) })
    const snapshot = queryClient.getQueryData(queryKeys.memberRoutine(gymId))
    queryClient.setQueryData(queryKeys.memberRoutine(gymId), (old) => ({ ...old, /* cambio */ }))
    return { snapshot }
  },

  onError: (err, payload, context) => {
    queryClient.setQueryData(queryKeys.memberRoutine(gymId), context?.snapshot)
    toast.error("Error. Intentá de nuevo.")
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.memberProgress(gymId) })
  },
})
```

Usar optimistic update en: toggle de ejercicio completado. No usar para: join-request, cambio de perfil.

---

## Manejo de Errores de API

```ts
// lib/api.ts
export class ApiError extends Error {
  constructor(public status: number, public body: { message?: string; errors?: string[] }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

// En componentes (con useToast):
const toast = useToast()
// ...
} catch (err) {
  toast.error(err instanceof ApiError ? err.message : 'Error de conexión')
}
```

---

## Dark Mode

La app soporta tres modos: `system`, `light`, `dark`. El modo está persistido en `themeStore` y aplicado por `ThemeController` en `_layout.tsx`.

```ts
// Leer el modo actual
const { mode, setMode } = useThemeStore()

// Cambiar el tema (desde Perfil)
const { setColorScheme } = useColorScheme()  // de nativewind
setMode('dark')
setColorScheme('dark')

// En componentes que necesitan adaptar colores manualmente (no Tailwind):
const { colorScheme } = useColorScheme()
const isDark = colorScheme === 'dark'
```

Usar clases Tailwind `dark:*` para la mayoría de los casos. Solo usar `isDark` booleano cuando necesitás un valor dinámico (colores de íconos SVG, colores en estilos inline).

---

## Componentes UI Reutilizables (components/ui/)

| Componente | Props clave | Uso |
|-----------|-------------|-----|
| `Button` | `variant` (`primary`/`secondary`/`destructive`), `loading`, `disabled`, `size` | Todos los botones |
| `Card` | — | Contenedores de info |
| `Badge` | `color`, `text` | Roles, status |
| `EmptyState` | `title`, `subtitle` | Pantallas vacías |
| `ErrorScreen` | `message?`, `onRetry` | Errores de fetch |
| `Skeleton` | `className` (width/height vía Tailwind) | Loading states |
| `Screen` | `className` | Wrapper SafeAreaView para pantallas sin header nativo |
| `Input` | `label`, `error`, ...TextInputProps | Inputs de formularios |
| `Toast` | Global via `useToast()` hook | Mensajes temporales |

---

## Navegación — Reglas

```ts
// Navegar entre tabs: usar router de Expo Router
router.push('/(main)/(routine)/')    // ir a rutina
router.replace('/(auth)/login')      // reemplazar (sin back)
router.back()                         // volver atrás

// Historial de rutinas y detalle:
router.push(`/(main)/(routine)/history`)
router.push(`/(main)/(routine)/history/${assignmentId}`)
router.push(`/(main)/(routine)/history/${assignmentId}/exercise/${exerciseId}`)

// select-gym: pantalla fullscreen, no modal
router.replace('/select-gym')         // desde bootstrap
router.push('/select-gym')            // desde perfil (Cambiar gym)
```

---

## Safe Area

`Screen` ya incluye `SafeAreaView`. Las pantallas con header nativo (`headerShown: true`) **no deben** usar `Screen` — el header ya maneja la safe area superior.

---

## Expo — Variables de Entorno

```ts
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
    "expo": "~54.0.33",
    "expo-router": "~6.0.23",
    "expo-secure-store": "~15.0.8",
    "expo-auth-session": "~7.0.11",
    "expo-web-browser": "~15.0.11",
    "@supabase/supabase-js": "^2.105.4",
    "@tanstack/react-query": "^5.100.10",
    "zustand": "^5.0.13",
    "nativewind": "^4.2.3",
    "react-native-reanimated": "~4.1.1",
    "react-native-svg": "15.12.1",
    "react-hook-form": "^7.75.0",
    "@hookform/resolvers": "^5.2.2",
    "zod": "^4.4.3",
    "lucide-react-native": "^1.14.0"
  }
}
```
