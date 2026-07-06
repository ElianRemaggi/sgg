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

## Loading y Error States — Patrón Canónico

Cada árbol de rutas (`gym/[gymId]/` y `platform/`) tiene un `error.tsx` + `loading.tsx` propio,
sibling de su `layout.tsx`. Cubren automáticamente **todas** las páginas hijas que no definan
los suyos — Next.js usa el boundary más específico si existe (ej. `admin/members/error.tsx`),
y si no, cae al del árbol (`gym/[gymId]/error.tsx`). El `layout.tsx` de cada árbol (sidebar)
queda montado porque el boundary vive un nivel por debajo, no reemplaza el layout.

Con eso ya resuelto, la única decisión por página es **cómo tratar cada fetch**:

- **Un solo fetch, es el contenido de la página:** no envolver en `try/catch` — dejar que tire
  y lo agarre el `error.tsx` del árbol (o uno más específico si la página lo justifica).
- **Varios fetches igual de críticos** (sin ninguno no hay nada que mostrar, ej.
  `coach/assign`: sin templates y sin members no tiene sentido la pantalla): `Promise.all`,
  sin catch — cualquier falla tira al error boundary.
- **Contenido primario + datos secundarios/cosméticos** (ej. `coach/templates`: la lista de
  plantillas es el contenido, `memberships` solo alimenta un flag de copy): `Promise.allSettled`,
  chequear `.status` de cada resultado — si el fetch primario rechaza, re-throw (`if (x.status
  === 'rejected') throw x.reason`) para que siga yendo al error boundary; si el secundario
  rechaza, degradar en silencio (valor default) sin mostrar error. Ver
  `gym/[gymId]/coach/templates/page.tsx` y `gym/[gymId]/member/routine/page.tsx`.
- **Ausencia de datos que es un estado válido, no un error** (ej. historial vacío para un
  usuario nuevo): `try/catch` puntual con fallback a lista vacía — esto es distinto de "el
  fetch falló", es "todavía no hay nada que mostrar". Ver `member/history/page.tsx`.

**Paginación:** usar `PageResponse<T>` (backend) + el componente compartido
`@/components/ui/pagination` (`<Pagination page totalPages totalElements last onPageChange />`)
en vez de reimplementar los botones Anterior/Siguiente en cada vista.

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

Convención general: `kebab-case.tsx` para archivos, componente exportado en PascalCase. Ejemplo real:

```
app/(dashboard)/gym/[gymId]/admin/members/
├── page.tsx              ← Server Component (fetch + layout)
├── loading.tsx           ← Skeleton (automático de Next.js)
├── error.tsx             ← Error boundary (automático de Next.js)
├── actions.ts            ← Server Actions ('use server')
├── members-view.tsx      ← Client Component principal (tabla + filtros)
├── member-actions.tsx    ← Menú de acciones por fila (aprobar/rechazar/bloquear/rol)
└── modals/
    ├── change-role-dialog.tsx
    └── set-expiry-dialog.tsx
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

## Tipos de API — `src/lib/api/types.ts`

Todos los tipos que espejean los DTOs del backend están centralizados en `src/lib/api/types.ts`. Grupos:

| Grupo | Tipos |
|-------|-------|
| Base | `ApiResponse<T>`, `PageResponse<T>` |
| Tenancy | `GymDto`, `GymPublicDto`, `GymMemberDto`, `MembershipDto`, `JoinRequestResponse`, `MemberRole`, `MemberStatus` |
| Platform | `GymSummaryDto`, `GymDetailDto`, `UserSummaryDto`, `SuperAdminDto`, `UserSearchDto`, `UserDto` |
| Training | `RoutineTemplateSummaryDto`, `RoutineTemplateDetailDto`, `TemplateBlockDto`, `TemplateExerciseDto`, `RoutineAssignmentDto`, `MemberRoutineDto` |
| Tracking | `ExerciseCompletionDto`, `TrackingProgressDto` |
| History | `AssignmentHistorySummaryDto`, `AssignmentHistoryDetailDto`, `HistoryBlockDto`, `HistoryExerciseSummaryDto`, `HistoryStatsDto`, `ExerciseProgressDto`, `ExerciseSessionDto`, `ExerciseStatsDto` |
| Schedule | `ScheduleActivityDto` |

`TrackingProgressDto` incluye campos opcionales del backend que no siempre están presentes:
```ts
currentDayNumber?: number
currentBlockName?: string
totalExercisesToday?: number
```

---

## package.json — Dependencias Clave

```json
{
  "dependencies": {
    "next": "14.2.35",
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.99.3",
    "react-hook-form": "^7.71.2",
    "@hookform/resolvers": "^5.2.2",
    "zod": "^4.3.6",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.5.0",
    "lucide-react": "^0.577.0",
    "tailwindcss": "^3.4.1"
  }
}
```
