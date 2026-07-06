# Frontend Web — Next.js 14 (App Router)
**Repo:** `sgg-web/`
**Usuarios:** Administradores, Coaches, Superadmins

---

## Stack

- Next.js **14.2.35** con App Router (no 15.x)
- TypeScript
- Supabase SSR (`@supabase/ssr`)
- Tailwind CSS
- shadcn/ui (componentes base)
- React Hook Form + Zod **v4** (formularios)

---

## Estructura de Rutas

Las rutas usan carpetas planas dentro de los grupos de ruta `(auth)`/`(dashboard)` (esos sí
existen, son solo para no compartir layout — no aparecen en la URL). Lo que **no** existe son
subgrupos por rol dentro de `gym/[gymId]/` — el path real es `/gym/[gymId]/admin/`,
`/gym/[gymId]/coach/`, `/gym/[gymId]/member/`, sin `(admin)`/`(coach)`.

```
src/app/
│
├── page.tsx                         # Redirect a /landing
├── landing/page.tsx                 # Landing page pública
├── privacy/page.tsx                 # Política de privacidad
│
├── (auth)/                          # Sin sidebar, sin auth requerida
│   ├── login/
│   │   ├── page.tsx
│   │   └── login-form.tsx           # Client Component
│   ├── register/
│   │   ├── page.tsx
│   │   └── register-form.tsx        # Client Component
│   └── layout.tsx
│
├── auth/
│   └── callback/                    # Callback de OAuth Google (Supabase)
│
├── (dashboard)/                     # Con sidebar, requiere auth
│   ├── layout.tsx                   # Shell: sidebar
│   │
│   ├── select-gym/
│   │   ├── page.tsx                 # Elegir gym activo (lista membresías)
│   │   ├── gym-selector.tsx
│   │   ├── gym-search.tsx           # Buscar/unirse a un gym STANDARD por slug o nombre
│   │   ├── personal-gym-create-button.tsx  # Self-service: crear gym PERSONAL propio
│   │   ├── logout-button.tsx
│   │   └── actions.ts
│   │
│   ├── gym/[gymId]/
│   │   ├── layout.tsx               # GymProvider: carga gym, verifica status
│   │   │
│   │   ├── admin/                   # Rutas de ADMIN | ADMIN_COACH
│   │   │   ├── members/             # Lista de miembros con filtros + modals/
│   │   │   ├── coaches/             # ABM de asignación coach↔member
│   │   │   ├── schedule/
│   │   │   └── settings/
│   │   │
│   │   ├── coach/                   # Rutas de COACH | ADMIN_COACH (y owner de gym personal)
│   │   │   ├── templates/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [templateId]/edit/page.tsx
│   │   │   ├── assign/page.tsx      # Asignar plantilla a un member activo del gym
│   │   │   ├── my-members/          # Members asignados a este coach
│   │   │   └── history/
│   │   │       └── [memberId]/
│   │   │           ├── page.tsx                                         # Historial del miembro (lista)
│   │   │           ├── [assignmentId]/page.tsx                          # Detalle de asignación
│   │   │           └── [assignmentId]/exercises/[exerciseId]/page.tsx   # Progresión de ejercicio
│   │   │
│   │   └── member/                  # Rutas de MEMBER (y ADMIN/COACH para su propia rutina)
│   │       ├── routine/page.tsx     # Mi rutina del día — tracking con observaciones
│   │       ├── history/
│   │       │   ├── page.tsx                                         # Historial (lista de asignaciones)
│   │       │   ├── [assignmentId]/page.tsx                          # Detalle de asignación
│   │       │   └── [assignmentId]/exercises/[exerciseId]/page.tsx   # Progresión de ejercicio
│   │       ├── schedule/page.tsx
│   │       └── profile/page.tsx
│   │
│   └── platform/                    # Rutas de SUPERADMIN (sin gymId en el path)
│       ├── gyms/
│       │   ├── page.tsx             # Lista de gyms (ABM)
│       │   ├── new/page.tsx
│       │   └── [gymId]/page.tsx     # Detalle + stats + zona de peligro
│       ├── admins/page.tsx          # Gestión de superadmins
│       └── gym-requests/            # Solicitudes de alta desde la landing
│
├── api/                             # Route Handlers (BFF)
│   ├── auth/native/route.ts         # POST: guarda JWT nativo en httpOnly cookie; DELETE: borra cookie
│   └── gyms/[gymId]/templates/[templateId]/export/route.ts  # Proxea la descarga xlsx/csv del backend
│
└── middleware.ts                    # Auth check global (nativo + Supabase)
```

---

## Autenticación

La app soporta dos mecanismos de auth en paralelo:
- **Nativo** (email/password via backend propio): el JWT se guarda en cookie httpOnly `sgg-token` via el Route Handler `/api/auth/native`
- **OAuth Google** (Supabase): sesión en cookies de Supabase SSR

### Route Handler: `/api/auth/native`

```typescript
// POST: guarda el JWT nativo en cookie httpOnly (24h)
// DELETE: borra la cookie (logout nativo)
export async function POST(request: NextRequest) {
  const { token } = await request.json()
  const response = NextResponse.json({ success: true })
  response.cookies.set('sgg-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return response
}
```

### middleware.ts

```typescript
export async function middleware(request: NextRequest) {
  // / → /landing (redirect antes de instanciar Supabase)
  if (pathname === '/') return redirect('/landing')

  // /landing y /auth/* (callback OAuth) → público, sin verificación.
  // NOTA: /privacy NO está en esta lista pese a ser una página pública — queda
  // detrás del check de auth de abajo (comportamiento real, no corregido todavía).
  const isPublicPage = pathname.startsWith('/landing') || pathname.startsWith('/auth/')
  if (isPublicPage) return NextResponse.next()

  // Auth dual: nativo (cookie) O Supabase session
  const nativeToken = request.cookies.get('sgg-token')?.value
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!nativeToken || !!session

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (!isAuthenticated && !isAuthPage) return redirect('/login')
  if (isAuthenticated && isAuthPage)  return redirect('/select-gym')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|screenshots/).*)',],
}
```

### Supabase Clients

```typescript
// lib/supabase/server.ts — Server Components y Route Handlers
export function createClient() {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: { get, set, remove },  // lee/escribe cookies del request
  })
}

// lib/supabase/client.ts — Client Components
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
```

---

## API Client

Hay **dos** clientes de API, uno por contexto de ejecución — no usar `lib/api/client.ts` desde
un Client Component (no tiene acceso a `cookies()` de Next ni al server-side Supabase client).

### `lib/api/client.ts` — Server Components y Server Actions

El `apiClient` usa el token nativo (`sgg-token`) si existe; si no, el access token de Supabase. Siempre `cache: 'no-store'`.

```typescript
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const nativeToken = cookies().get('sgg-token')?.value

  let token = nativeToken
  if (!token) {
    const { data: { session } } = await createClient().auth.getSession()
    token = session?.access_token
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json()
    throw new ApiError(res.status, error)
  }

  return res.json()
}
```

### `lib/api/browser.ts` — Client Components

Mismo contrato (`apiClient<T>`, `ApiError`), pero resuelve el token leyendo `document.cookie`
directamente (no hay `cookies()` de Next disponible en el browser) y cae al Supabase browser
client si no hay cookie nativa. También expone `getErrorMessage(error)` para mostrar mensajes
de error consistentes en UI (403/404/409 con mensaje propio, resto usa `body.message`).

```typescript
'use client'

async function getBrowserAuthToken(): Promise<string | null> {
  const match = document.cookie.match(/(?:^|;\s*)sgg-token=([^;]*)/)
  if (match) return decodeURIComponent(match[1])

  const supabase = createClient()  // lib/supabase/client.ts
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getBrowserAuthToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})))
  return res.json()
}
```

Usalo, por ejemplo, en `select-gym/personal-gym-create-button.tsx` (crea el gym personal desde
un botón client-side sin pasar por una Server Action).

---

## Patrones de Componentes

### Server Component (fetch + render)

```typescript
// app/(dashboard)/gym/[gymId]/admin/members/page.tsx
import { apiClient } from '@/lib/api/client'

export default async function MembersPage({
  params,
  searchParams,
}: {
  params: { gymId: string }
  searchParams: { status?: string; page?: string }
}) {
  const data = await apiClient<PageResponse<GymMemberDto>>(
    `/api/gyms/${params.gymId}/admin/members?status=${searchParams.status ?? 'ACTIVE'}&page=${searchParams.page ?? 0}`
  )

  return <MembersTable data={data} gymId={params.gymId} />
}
```

### Server Action (mutaciones)

```typescript
// app/(dashboard)/gym/[gymId]/admin/members/actions.ts
'use server'
import { apiClient } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

export async function approveMember(gymId: string, memberId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/approve`, {
    method: 'PUT',
  })
  revalidatePath(`/gym/${gymId}/admin/members`)
}
```

### Client Component (interactividad)

```typescript
'use client'
import { approveMember } from './actions'

export function MemberActions({ gymId, memberId }: Props) {
  return (
    <button onClick={() => approveMember(gymId, memberId)}>
      Aprobar
    </button>
  )
}
```

---

## Variables de Entorno

```bash
# .env.local (desarrollo)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # solo server-side, nunca en NEXT_PUBLIC_
```

---

## Reglas de Desarrollo

1. **Server Components por defecto.** Agregar `'use client'` solo cuando se necesita estado local, eventos del browser, o hooks.
2. **Preferir Server Actions/Route Handlers para mutaciones.** Para lecturas puntuales desde un Client Component sí existe `lib/api/browser.ts` (ver más arriba) — no es una regla absoluta, pero las mutaciones y todo lo que dependa de datos sensibles deben ir por Server Actions.
3. **Formularios con Server Actions.** Usar `react-hook-form` + Zod en client para UX, y Server Action para la mutación real.
4. **Validar roles.** Solo `platform/layout.tsx` valida rol (`SUPERADMIN`) a nivel de layout. `admin/` y `coach/` no tienen layout propio — la validación de rol para esas secciones queda del lado del backend (`@PreAuthorize`/`GymAccessChecker`); el frontend confía en que un 403 del backend se traduzca en el error boundary correspondiente.
5. **Revalidar después de mutaciones.** Siempre llamar `revalidatePath` o `revalidateTag` después de una Server Action que modifica datos.
6. **Error boundaries.** Cada segmento de ruta importante tiene su `error.tsx`.

---

## Testing

Ver la guía completa en [docs/frontend/TESTING.md](./TESTING.md).

Comandos rápidos:
- `npm test` — unit/integration (Vitest)
- `npm run test:e2e` — E2E (Playwright)
- `npm run test:coverage` — cobertura

---

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|---------|-----------|---------|
| Páginas | kebab-case folder + page.tsx | `members/page.tsx` |
| Componentes | PascalCase | `MembersTable.tsx` |
| Server Actions | camelCase en `actions.ts` | `approveMember()` |
| API Types | PascalCase con sufijo Dto | `GymMemberDto` |
| Hooks client | `use` prefix | `useGymContext()` |
