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

```
src/app/
│
├── (auth)/                          # Sin sidebar, sin auth requerida
│   ├── login/page.tsx
│   └── layout.tsx
│
├── (dashboard)/                     # Con sidebar, requiere auth
│   ├── layout.tsx                   # Shell: sidebar + gym selector
│   │
│   ├── select-gym/page.tsx          # Elegir gym activo si el user tiene varios
│   │
│   ├── gym/[gymId]/
│   │   ├── layout.tsx               # GymProvider: carga gym, verifica status
│   │   │
│   │   ├── (admin)/                 # Rutas de ADMIN | ADMIN_COACH
│   │   │   ├── members/
│   │   │   │   ├── page.tsx         # Lista de miembros con filtros
│   │   │   │   └── [memberId]/page.tsx
│   │   │   ├── coaches/page.tsx
│   │   │   ├── schedule/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── (coach)/                 # Rutas de COACH | ADMIN_COACH
│   │       ├── my-members/page.tsx
│   │       ├── templates/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [templateId]/edit/page.tsx
│   │       ├── assign/page.tsx
│   │       └── progress/[memberId]/page.tsx
│   │
│   └── platform/                    # Rutas de SUPERADMIN únicamente
│       ├── layout.tsx               # Verifica platform_role = SUPERADMIN
│       ├── gyms/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [gymId]/page.tsx
│       └── admins/page.tsx
│
├── api/                             # Route Handlers (BFF / proxy a Spring)
│   └── [...proxy]/route.ts          # Opcional: proxy transparente con JWT injection
│
└── middleware.ts                    # Auth check global
```

---

## Autenticación

### middleware.ts

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* getter/setter de cookies */ } }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Rutas protegidas: redirigir a login si no hay sesión
  if (!session && request.nextUrl.pathname.startsWith('/gym')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Ruta platform: verificar platform_role (se lee del user en BD)
  // Esta verificación más granular se hace en el layout de /platform

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
```

### Supabase Clients

```typescript
// lib/supabase/server.ts — para Server Components y Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

// lib/supabase/client.ts — para Client Components
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## API Client

```typescript
// lib/api/client.ts
import { createClient } from '@/lib/supabase/server'

const API_BASE = process.env.NEXT_PUBLIC_API_URL

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
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

## Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|---------|-----------|---------|
| Páginas | kebab-case folder + page.tsx | `members/page.tsx` |
| Componentes | PascalCase | `MembersTable.tsx` |
| Server Actions | camelCase en `actions.ts` | `approveMember()` |
| API Types | PascalCase con sufijo Dto | `GymMemberDto` |
| Hooks client | `use` prefix | `useGymContext()` |
