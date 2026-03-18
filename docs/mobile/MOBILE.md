# App Móvil — React Native + Expo
**Repo:** `sgg-app/`
**Usuarios:** Members (participantes de gimnasios)

---

## Stack

- React Native con Expo SDK 51+
- TypeScript
- Expo Router (file-based routing, como Next.js App Router)
- Supabase Auth (`@supabase/supabase-js`)
- `expo-secure-store` (almacenamiento seguro de tokens)
- React Query (`@tanstack/react-query`) para fetching y cache
- Zustand (estado global liviano)
- NativeWind (Tailwind para React Native)

---

## Estructura del Proyecto

```
sgg-app/
├── app/
│   ├── _layout.tsx                  # Root: AuthProvider + QueryClient
│   │
│   ├── (auth)/                      # Sin tab bar
│   │   ├── _layout.tsx              # Stack navigator
│   │   ├── login.tsx
│   │   └── register.tsx
│   │
│   └── (main)/                      # Con tab bar (solo si tiene gym activo)
│       ├── _layout.tsx              # Tab navigator
│       │
│       ├── (routine)/               # Tab: Mi Rutina 🏋️
│       │   ├── _layout.tsx
│       │   ├── index.tsx            # Rutina activa del día
│       │   └── history.tsx
│       │
│       ├── (progress)/              # Tab: Progreso 📊
│       │   └── index.tsx
│       │
│       ├── (gym)/                   # Tab: Mi Gym 🏢
│       │   ├── index.tsx            # Info del gym
│       │   └── schedule.tsx         # Horarios
│       │
│       └── (profile)/              # Tab: Perfil 👤
│           └── index.tsx            # Perfil + selector de gym + logout
│
├── components/
│   ├── ui/                          # Componentes reutilizables (Button, Card, etc.)
│   ├── routine/
│   │   ├── ExerciseItem.tsx         # Item de ejercicio con toggle
│   │   ├── BlockSection.tsx         # Sección de bloque (Día 1, Día 2)
│   │   └── ProgressRing.tsx         # Anillo de progreso
│   └── tracking/
│       └── CompletionToggle.tsx     # Botón check/uncheck
│
├── lib/
│   ├── supabase.ts                  # Cliente Supabase + SecureStore adapter
│   ├── api.ts                       # API client con JWT automático
│   └── queryKeys.ts                 # Claves para React Query
│
├── hooks/
│   ├── useAuth.ts                   # Sesión de Supabase, user actual
│   ├── useGym.ts                    # Gym activo (de Zustand store)
│   └── useRoutine.ts                # Rutina activa del member
│
├── store/
│   └── gymStore.ts                  # Zustand: gym activo seleccionado
│
├── types/
│   └── api.ts                       # Tipos que espeja los DTOs del backend
│
├── app.json
└── eas.json
```

---

## Autenticación

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

### hooks/useAuth.ts

```typescript
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, loading, user: session?.user }
}
```

---

## API Client

```typescript
// lib/api.ts
import { supabase } from './supabase'

const API_BASE = process.env.EXPO_PUBLIC_API_URL!

export class ApiError extends Error {
  constructor(public status: number, public body: unknown) {
    super(`API Error ${status}`)
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await response.json())
  }

  if (response.status === 204) return null as T
  return response.json()
}
```

---

## Estado Global con Zustand

```typescript
// store/gymStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'

interface GymStore {
  activeGymId: number | null
  activeGymName: string | null
  setActiveGym: (id: number, name: string) => void
  clearActiveGym: () => void
}

export const useGymStore = create<GymStore>()(
  persist(
    (set) => ({
      activeGymId: null,
      activeGymName: null,
      setActiveGym: (id, name) => set({ activeGymId: id, activeGymName: name }),
      clearActiveGym: () => set({ activeGymId: null, activeGymName: null }),
    }),
    {
      name: 'gym-store',
      storage: createJSONStorage(() => ({
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      })),
    }
  )
)
```

---

## Pantalla Principal: Rutina Activa

```typescript
// app/(main)/(routine)/index.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useGymStore } from '@/store/gymStore'

export default function RoutineScreen() {
  const { activeGymId } = useGymStore()
  const queryClient = useQueryClient()

  const { data: routine, isLoading } = useQuery({
    queryKey: ['routine', activeGymId],
    queryFn: () => apiClient(`/api/gyms/${activeGymId}/member/routine`),
    enabled: !!activeGymId,
  })

  const completeMutation = useMutation({
    mutationFn: ({ assignmentId, exerciseId }: { assignmentId: number, exerciseId: number }) =>
      apiClient(`/api/gyms/${activeGymId}/member/tracking/complete`, {
        method: 'POST',
        body: JSON.stringify({ assignmentId, exerciseId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routine', activeGymId] })
    },
  })

  if (isLoading) return <LoadingScreen />
  if (!routine) return <NoRoutineScreen />

  return (
    <ScrollView>
      {routine.blocks.map(block => (
        <BlockSection
          key={block.id}
          block={block}
          onComplete={(exerciseId) =>
            completeMutation.mutate({
              assignmentId: routine.assignmentId,
              exerciseId,
            })
          }
        />
      ))}
    </ScrollView>
  )
}
```

---

## Navegación y Flujo de Usuario

```
App abre
  └── _layout.tsx verifica sesión
        ├── Sin sesión → (auth)/login
        └── Con sesión
              └── ¿Tiene gym activo en store?
                    ├── No → select-gym.tsx (modal)
                    └── Sí → (main)/tabs
```

El modal de selección de gym aparece:
- Al primer login
- Cuando el usuario toca "Cambiar gym" en perfil
- Cuando el gym activo queda inaccesible (suspendido, membresía expirada)

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
# En WSL2
ip addr show eth0 | grep 'inet '
# Anotar la IP (ej: 172.28.x.x)
# En app: EXPO_PUBLIC_API_URL=http://172.28.x.x:8080
npx expo start --host lan
```

---

## Reglas de Desarrollo

1. **NUNCA AsyncStorage para tokens** — siempre `expo-secure-store`.
2. **NUNCA fetch directo en componentes** — siempre React Query con `queryKey` tipada.
3. **SIEMPRE verificar `activeGymId`** antes de hacer requests — puede ser null.
4. **Google OAuth en mobile:** usar `expo-auth-session` con deep link. El redirect URI debe configurarse en Supabase y en `app.json` (`scheme`).
5. **Offline:** mostrar datos cacheados de React Query mientras se reconecta. No bloquear la UI por falta de red.
6. **iOS y Android:** siempre testear en ambos. Los gestos y la navegación se comportan distinto.
