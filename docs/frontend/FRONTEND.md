# Frontend Web — Next.js 14 (App Router)
**Repo:** `sgg-web/`
**Usuarios:** Administradores, Coaches, Superadmins

---

## Stack

- Next.js 14+ con App Router
- TypeScript
- Supabase SSR (`@supabase/ssr`)
- Tailwind CSS
- shadcn/ui (componentes base)
- React Hook Form + Zod (formularios)
- SWR o React Query (fetch client-side cuando necesario)

---

## Estructura de Rutas

> **Nota:** Las rutas usan carpetas planas (sin grupos de ruta `(admin)`/`(coach)`). El path real es `/gym/[gymId]/admin/`, `/gym/[gymId]/coach/`, `/gym/[gymId]/member/`.

```
src/app/
│
├── page.tsx                         # Redirect a /landing
├── landing/page.tsx                 # Landing page pública (dev.drinklen.com.ar)
├── privacy/page.tsx                 # Política de privacidad (pública)
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
├── (dashboard)/                     # Con sidebar, requiere auth
│   ├── layout.tsx                   # Shell: sidebar
│   │
│   ├── select-gym/page.tsx          # Elegir gym activo
│   │
│   └── gym/[gymId]/
│       ├── layout.tsx               # GymProvider: carga gym, verifica status
│       │
│       ├── admin/                   # Rutas de ADMIN | ADMIN_COACH
│       │   ├── members/page.tsx     # Lista de miembros con filtros
│       │   ├── schedule/page.tsx
│       │   └── settings/page.tsx
│       │
│       ├── coach/                   # Rutas de COACH | ADMIN_COACH
│       │   ├── templates/
│       │   │   ├── page.tsx
│       │   │   ├── new/page.tsx
│       │   │   └── [templateId]/edit/page.tsx
│       │   ├── assign/page.tsx
│       │   └── history/
│       │       └── [memberId]/
│       │           ├── page.tsx                                         # Historial del miembro (lista)
│       │           ├── [assignmentId]/page.tsx                          # Detalle de asignación
│       │           └── [assignmentId]/exercises/[exerciseId]/page.tsx   # Progresión de ejercicio
│       │
│       └── member/                  # Rutas de MEMBER (y ADMIN/COACH para su propia rutina)
│           ├── routine/page.tsx     # Mi rutina del día — tracking con observaciones
│           ├── history/
│           │   ├── page.tsx                                         # Historial (lista de asignaciones)
│           │   ├── [assignmentId]/page.tsx                          # Detalle de asignación
│           │   └── [assignmentId]/exercises/[exerciseId]/page.tsx   # Progresión de ejercicio
│           ├── schedule/page.tsx
│           └── profile/page.tsx
│
├── api/                             # Route Handlers (BFF)
│   └── auth/
│       └── native/route.ts          # POST: guarda JWT nativo en httpOnly cookie; DELETE: borra cookie
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

  // /landing, /privacy → público, sin verificación
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

El `apiClient` usa el token nativo (`sgg-token`) si existe; si no, el access token de Supabase. Siempre `cache: 'no-store'`.

```typescript
// lib/api/client.ts (Server Components / Server Actions)
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

---

## Patrones de Componentes

### Server Component (fetch + render)

```typescript
// app/(dashboard)/gym/[gymId]/(admin)/members/page.tsx
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
// app/(dashboard)/gym/[gymId]/(admin)/members/actions.ts
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
2. **Nunca hacer fetch desde Client Components directamente al backend** con datos sensibles — usar Server Actions o Route Handlers.
3. **Formularios con Server Actions.** Usar `react-hook-form` + Zod en client para UX, y Server Action para la mutación real.
4. **Validar roles en layouts.** Cada sección (`(admin)`, `(coach)`, `platform`) tiene su `layout.tsx` que verifica el rol antes de renderizar.
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
