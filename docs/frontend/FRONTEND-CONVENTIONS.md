# Frontend Web — Convenciones y Patrones
**Ref rápida para Claude Code al trabajar en sgg-web/**

---

## Reglas Absolutas

| Regla | Correcto | Incorrecto |
|-------|----------|-----------|
| JWT storage | httpOnly cookies via `@supabase/ssr` | `localStorage` |
| Fetch en Server Component | `await apiClient(...)` directo | `useEffect` + `fetch` |
| Mutaciones | Server Actions con `revalidatePath` | fetch desde Client Component |
| Variables de entorno públicas | `NEXT_PUBLIC_*` | Acceso server-side desde cliente |
| Validación de forms | React Hook Form + Zod | Validación manual |
| Verificar rol en ruta protegida | En `layout.tsx` del segmento | En cada `page.tsx` |

---

## Cuándo usar 'use client'

```
✅ Necesita useState o useReducer
✅ Necesita useEffect
✅ Maneja eventos del browser (onClick, onChange, etc.)
✅ Usa hooks de terceros (useQuery, useForm, etc.)
✅ Necesita animaciones o acceso al DOM

❌ Solo renderiza HTML estático
❌ Solo hace fetch de datos
❌ Solo aplica formato a datos
```

---

## Patrón de Página Estándar (Server + Client)

```ts
// page.tsx — Server Component (fetch + pasa datos al Client)
export default async function MembersPage({ params, searchParams }) {
  const data = await apiClient<PageResponse<GymMemberDto>>(
    `/api/gyms/${params.gymId}/admin/members?status=${searchParams.status ?? 'ALL'}`
  )
  return <MembersClientView initialData={data} gymId={params.gymId} />
}

// MembersClientView.tsx — Client Component (interactividad)
'use client'
export function MembersClientView({ initialData, gymId }) {
  // React Query con initialData del servidor (evita flash de loading)
  const { data } = useQuery({
    queryKey: ['members', gymId],
    queryFn: () => fetch(`/api/members?gymId=${gymId}`).then(r => r.json()),
    initialData,
  })
  // ...
}
```

---

## Server Actions — Patrón Completo

```ts
// actions.ts
'use server'
import { apiClient } from '@/lib/api/client'
import { revalidatePath } from 'next/cache'

export async function myAction(gymId: string, payload: MyPayload) {
  try {
    await apiClient(`/api/gyms/${gymId}/...`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    revalidatePath(`/gym/${gymId}/...`)
    return { success: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.body.message, status: error.status }
    }
    return { success: false, error: 'Error inesperado' }
  }
}

// En el componente cliente:
const result = await myAction(gymId, payload)
if (!result.success) {
  if (result.status === 409) toast.error(result.error)
  else toast.error('Error al guardar')
}
```

---

## Manejo de Errores HTTP en API Client

```ts
// lib/api/client.ts
export class ApiError extends Error {
  constructor(public status: number, public body: { message?: string; errors?: string[] }) {
    super(body.message ?? `HTTP ${status}`)
  }
}

// Mapeo de errores a mensajes para el usuario
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 409) return error.body.message ?? "Conflicto al procesar la solicitud"
    if (error.status === 403) return "No tenés permiso para realizar esta acción"
    if (error.status === 404) return "El recurso no existe o fue eliminado"
    return error.body.message ?? "Error al procesar la solicitud"
  }
  return "Error de conexión"
}
```

---

## Zod — Esquemas Comunes

```ts
// lib/validations.ts
import { z } from 'zod'

export const gymMemberRoleSchema = z.enum(['MEMBER', 'COACH', 'ADMIN', 'ADMIN_COACH'])

export const dateTimeSchema = z.string().datetime()
  .or(z.date())
  .transform(d => new Date(d))

export const slugSchema = z
  .string()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones")

export const urlOrEmptySchema = z
  .string()
  .url("URL inválida")
  .or(z.literal(''))
  .nullable()
  .optional()
```

---

## Estructura de Archivos por Sección

```
app/(dashboard)/gym/[gymId]/(admin)/members/
├── page.tsx              ← Server Component (fetch + layout)
├── loading.tsx           ← Skeleton (automático de Next.js)
├── error.tsx             ← Error boundary (automático de Next.js)
├── actions.ts            ← Server Actions ('use server')
├── MembersTable.tsx      ← Client Component principal
├── MemberRow.tsx         ← Sub-componente
├── MemberActions.tsx     ← Menú desplegable
└── modals/
    ├── ChangeRoleModal.tsx
    └── SetExpiryModal.tsx
```

---

## Componentes shadcn/ui a Instalar

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog       # modales
npx shadcn-ui@latest add dropdown-menu # menús de acciones
npx shadcn-ui@latest add badge        # roles y status
npx shadcn-ui@latest add table        # listas de miembros
npx shadcn-ui@latest add toast        # notificaciones
npx shadcn-ui@latest add skeleton     # loading states
npx shadcn-ui@latest add calendar     # date picker
npx shadcn-ui@latest add popover      # container para calendar
npx shadcn-ui@latest add alert        # mensajes de error/warning
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add card
```

---

## package.json — Dependencias Clave

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/ssr": "^0.3.0",
    "@supabase/supabase-js": "^2.44.0",
    "react-hook-form": "^7.52.0",
    "@hookform/resolvers": "^3.6.0",
    "zod": "^3.23.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "lucide-react": "^0.400.0",
    "@tanstack/react-query": "^5.0.0",   // si se usa en Client Components
    "date-fns": "^3.6.0"                 // formateo de fechas
  }
}
```
