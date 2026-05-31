# App Móvil — React Native + Expo
**Repo:** `sgg-app/`
**Usuarios:** Members (participantes de gimnasios)

---

## Stack

- React Native con Expo SDK 54
- TypeScript
- Expo Router v6 (file-based routing, como Next.js App Router)
- Supabase Auth (`@supabase/supabase-js`) — solo para OAuth con Google
- Auth nativa: email/password con JWT HS384 vía `/api/public/auth/login` (guardado en SecureStore como `sgg.jwt`)
- `expo-secure-store` (almacenamiento seguro de tokens y estado persistido)
- React Query v5 (`@tanstack/react-query`) para fetching y cache
- Zustand v5 (estado global: gym activo y tema)
- NativeWind v4 (Tailwind para React Native)
- `react-hook-form` + `@hookform/resolvers/zod` para formularios
- `lucide-react-native` para íconos
- `react-native-svg` para gráficos SVG (progresión de ejercicios)

---

## Estructura del Proyecto

```
sgg-app/
├── app/
│   ├── _layout.tsx                  # Root: SafeAreaProvider + QueryProvider + ToastProvider + BootstrapGate + ThemeController
│   ├── auth/
│   │   └── callback.tsx             # Deep link callback de OAuth (Google)
│   │
│   ├── (auth)/                      # Sin tab bar
│   │   ├── _layout.tsx              # Stack navigator
│   │   ├── login.tsx
│   │   └── register.tsx
│   │
│   ├── select-gym.tsx               # Pantalla fullscreen de selección/búsqueda de gym
│   │
│   └── (main)/                      # Con tab bar (solo si selectedGymId !== null)
│       ├── _layout.tsx              # Tab navigator — redirige a select-gym si no hay gym activo
│       │
│       ├── (routine)/               # Tab: Rutina 🏋️
│       │   ├── _layout.tsx          # Stack: index, history, history/[id], history/[id]/exercise/[id]
│       │   ├── index.tsx            # Rutina activa del día (con selector de día)
│       │   ├── history.tsx          # Lista de asignaciones pasadas
│       │   └── history/
│       │       └── [assignmentId]/
│       │           ├── index.tsx    # Detalle de rutina (stats + ejercicios por bloque)
│       │           └── exercise/
│       │               └── [exerciseId].tsx  # Progresión de un ejercicio (gráfico SVG)
│       │
│       ├── (progress)/              # Tab: Historial 📊
│       │   └── index.tsx            # Progreso actual + link a historial
│       │
│       ├── (gym)/                   # Tab: Mi gym 🏢
│       │   ├── index.tsx            # Info del gym
│       │   └── schedule.tsx         # Horarios
│       │
│       └── (profile)/              # Tab: Perfil 👤
│           └── index.tsx            # Perfil + selector de tema + join gym + cerrar sesión + eliminar cuenta
│
├── components/
│   ├── ui/                          # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorScreen.tsx
│   │   ├── Input.tsx
│   │   ├── Screen.tsx               # Wrapper con SafeAreaView
│   │   └── Skeleton.tsx
│   └── routine/
│       ├── ExerciseRow.tsx          # Fila de ejercicio con toggle y entrada de datos (peso/reps/notas)
│       ├── BlockSection.tsx         # Sección de bloque con lista de ejercicios
│       ├── ProgressRing.tsx         # Anillo SVG de progreso (tab Progreso)
│       └── RoutineProgressBar.tsx   # Barra de progreso + selector de día (tab Rutina)
│
├── lib/
│   ├── supabase.ts                  # Cliente Supabase + SecureStore adapter
│   ├── api.ts                       # API client con JWT automático (nativo o Supabase)
│   ├── auth.ts                      # nativeLogin, nativeRegister, syncSupabaseUser, navigateAfterAuth, logout
│   └── queryKeys.ts                 # Claves para React Query
│
├── store/
│   ├── gymStore.ts                  # Zustand: gym activo (selectedGymId: string | null)
│   └── themeStore.ts                # Zustand: modo de tema ('system' | 'light' | 'dark')
│
├── providers/
│   ├── QueryProvider.tsx            # React Query client provider
│   └── ToastProvider.tsx            # Toast global (useToast hook)
│
├── types/
│   └── api.ts                       # Tipos que espeja los DTOs del backend
│
├── tests/
│   ├── msw/
│   │   ├── handlers.ts              # Mock handlers para tests
│   │   └── server.ts
│   └── utils/
│       └── render.tsx               # Render helper con providers
│
├── app.config.js                    # Configuración Expo (scheme: "sgg")
└── eas.json
```

---

## Autenticación

La app soporta dos métodos de auth:

### 1. Auth Nativa (principal)
Email/password via backend propio. El JWT se almacena en SecureStore bajo la clave `sgg.jwt`.

```typescript
// lib/auth.ts
export async function nativeLogin(usernameOrEmail: string, password: string) {
  const res = await apiClient<ApiResponse<NativeLoginResponse>>(
    '/api/public/auth/login',
    { method: 'POST', body: JSON.stringify({ identifier: usernameOrEmail, password }) }
  )
  await SecureStore.setItemAsync('sgg.jwt', res.data.token)
  return res.data
}

export async function nativeRegister(payload: NativeRegisterRequest) {
  await apiClient('/api/public/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return nativeLogin(payload.email, payload.password)
}
```

### 2. OAuth con Google (Supabase)
Usa `expo-auth-session` + `WebBrowser.openAuthSessionAsync`. Después del OAuth se llama `syncSupabaseUser()` para sincronizar con el backend.

### lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: secureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,  // IMPORTANTE para React Native
    },
  }
)
```

---

## API Client

```typescript
// lib/api.ts
// Adjunta automáticamente el JWT nativo (sgg.jwt) o el token de Supabase
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Primero intenta el JWT nativo; si no hay, usa Supabase
  const nativeJwt = await SecureStore.getItemAsync('sgg.jwt')
  let token: string | null = nativeJwt

  if (!token) {
    const { data: { session } } = await supabase.auth.getSession()
    token = session?.access_token ?? null
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) throw new ApiError(response.status, await response.json())
  if (response.status === 204) return null as T
  return response.json()
}
```

Las respuestas del backend están envueltas en `ApiResponse<T>`:
```typescript
interface ApiResponse<T> { data: T }
```

---

## Estado Global con Zustand

### gymStore.ts — Gym activo
```typescript
interface GymState {
  selectedGymId: string | null   // string, no number
  setGym: (gymId: string) => void
  clearGym: () => void
}
// Persistido en SecureStore bajo la clave 'sgg.gym'
```

### themeStore.ts — Tema de la app
```typescript
type ThemeMode = 'system' | 'light' | 'dark'
interface ThemeState {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}
// Persistido en SecureStore bajo la clave 'sgg.theme'
```

---

## Bootstrap y navegación inicial

`_layout.tsx` usa un `BootstrapGate` que:
1. Busca `sgg.jwt` en SecureStore y sesión de Supabase
2. Si no hay nada → redirige a `/(auth)/login`
3. Si hay sesión → llama `navigateAfterAuth()` para resolver el gym activo
4. Tiene un timeout global de 12s como fallback duro a login
5. Muestra un overlay de carga con el paso actual ("Verificando sesión...", "Cargando membresías...")

`navigateAfterAuth()`:
```
membresías activas === 0  → /select-gym
membresías activas === 1  → setGym(id) → /(main)/(routine)
membresías activas > 1    → /select-gym
gym ya seleccionado y válido → /(main)/(routine)
```

`ThemeController` aplica el modo de tema (del `themeStore`) a NativeWind al arrancar.

---

## Navegación y Flujo de Usuario

```
App abre
  └── _layout.tsx (BootstrapGate)
        ├── Sin sesión → (auth)/login
        └── Con sesión → navigateAfterAuth()
              ├── 0 gyms → select-gym (fullscreen)
              ├── 1 gym  → setGym() → (main)/(routine)
              └── N gyms → select-gym (fullscreen)

(main)/_layout.tsx
  └── Sin selectedGymId → Redirect a /select-gym
```

---

## Variables de Entorno

```bash
# .env (Expo usa EXPO_PUBLIC_ prefix para las públicas)
EXPO_PUBLIC_API_URL=https://api.tudominio.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Para desarrollo local con WSL2:
# Usar --tunnel de Expo, o la IP de WSL2: http://172.x.x.x:8080
```

---

## Desarrollo con WSL2

**Problema frecuente:** Expo en WSL2 no puede hacer broadcast de red al dispositivo físico.

**Solución 1 — Tunnel (más simple):**
```bash
npx expo start --tunnel
```

**Solución 2 — IP de WSL2:**
```bash
ip addr show eth0 | grep 'inet '
# Anotar la IP (ej: 172.28.x.x)
# En app: EXPO_PUBLIC_API_URL=http://172.28.x.x:8080
npx expo start --host lan
```

---

## Reglas de Desarrollo

1. **NUNCA AsyncStorage para tokens** — siempre `expo-secure-store`.
2. **NUNCA fetch directo en componentes** — siempre React Query con `queryKey` de `queryKeys.*`.
3. **SIEMPRE verificar `selectedGymId`** antes de hacer requests — puede ser null.
4. **Google OAuth en mobile:** `expo-auth-session` + `WebBrowser.openAuthSessionAsync`. Soporta PKCE y flujo implícito. El scheme es `sgg`.
5. **Formularios:** usar `react-hook-form` + `zodResolver` — nunca estado manual con `useState`.
6. **iOS y Android:** siempre testear en ambos. Los gestos y la navegación se comportan distinto.
