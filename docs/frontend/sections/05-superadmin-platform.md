# Frontend Web — Sección: Superadmin — Panel /platform
**Ruta base:** `/platform`
**Acceso:** SUPERADMIN únicamente

---

## Layout /platform

```ts
// platform/layout.tsx — Server Component
export default async function PlatformLayout({ children }) {
  const user = await apiClient<UserDto>('/api/users/me')

  if (user.platformRole !== 'SUPERADMIN') {
    redirect('/select-gym')  // no exponer que la ruta existe
  }

  return (
    <div>
      <PlatformSidebar />  {/* Sidebar distinto al del panel de gym */}
      <main>{children}</main>
    </div>
  )
}
```

**PlatformSidebar links** (`src/components/platform-sidebar.tsx`):
- 🏢 Gimnasios → `/platform/gyms`
- 👑 Superadmins → `/platform/admins`
- 📥 Solicitudes → `/platform/gym-requests`

---

## /platform/gyms — Lista de Gyms

**Fetch (Server Component):**
```ts
const data = await apiClient<PageResponse<GymSummaryDto>>(
  `/api/platform/gyms?status=${status}&search=${search}&page=${page}&size=20`
)
```

**Filtros:**
- `status`: `ALL | ACTIVE | SUSPENDED | DELETED`
- `search`: texto libre (nombre o slug)
- `page`

**Componentes reales** (`app/(dashboard)/platform/gyms/`):
```
page.tsx                ← Server Component: fetch + pasa a GymsView
gyms-view.tsx           ← GymsView: filtros + tabla (nombre/slug, owner, miembros activos,
                           status badge, fecha, menú de acciones por fila)
delete-gym-dialog.tsx   ← DeleteGymDialog: confirmación con input de slug
actions.ts              ← suspendGym, reactivateGym, deleteGym
new/page.tsx            ← CreateGymPage (form inline, sin componente separado)
[gymId]/
├── page.tsx            ← Detalle
└── gym-detail-actions.tsx  ← GymDetailActions: suspender/reactivar/eliminar/entrar como admin
```

**Confirmación para Suspender:**
```
"¿Suspender el gym '{nombre}'?
Todos sus miembros perderán acceso hasta que lo reactives."
[Cancelar] [Suspender]
```

**Confirmación para Eliminar:**
```
"¿Eliminar el gym '{nombre}'?
Esta acción es permanente. Escribí el slug del gym para confirmar:"
[input: slug del gym para confirmar]
[Cancelar] [Eliminar permanentemente]
```
- El botón Eliminar se habilita solo cuando el input coincide exactamente con el slug.
- Si el gym tiene miembros activos, aparece warning adicional: "Este gym tiene X miembros activos."

**Server Actions:**
```ts
'use server'

export async function suspendGym(gymId: number) {
  await apiClient(`/api/platform/gyms/${gymId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'SUSPENDED' }),
  })
  revalidatePath('/platform/gyms')
}

export async function reactivateGym(gymId: number) {
  await apiClient(`/api/platform/gyms/${gymId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ACTIVE' }),
  })
  revalidatePath('/platform/gyms')
}

export async function deleteGym(gymId: number, force = false) {
  await apiClient(`/api/platform/gyms/${gymId}${force ? '?force=true' : ''}`, {
    method: 'DELETE',
  })
  revalidatePath('/platform/gyms')
}
```

---

## /platform/gyms/new — Crear Gym

**Formulario (`CreateGymPage`, Client Component en `new/page.tsx`):**
```
├── Nombre (text, requerido, max 200)
├── Slug (text, requerido, max 100)
│   └── Auto-generado desde el nombre (kebab-case, en tiempo real)
│   └── Editable manualmente
│   └── Validación inline: solo letras minúsculas, números, guiones
├── Descripción (textarea, opcional)
├── Logo URL (text, opcional, validación URL)
├── Ciclo de rutina (select: Semanal / Mensual)
├── Owner (select con búsqueda de usuarios)
│   └── Busca usuarios via GET /api/platform/users?search=...
│   └── Muestra nombre + email de cada resultado
└── [Cancelar] [Crear gym]
```

**Auto-generación de slug:**
```ts
function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // quitar acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}
```

**Post-creación:** redirect a `/platform/gyms/{id}` con toast "Gym creado exitosamente".

---

## /platform/gyms/[gymId] — Detalle de Gym

**Fetch:**
```ts
const gym = await apiClient<GymDetailDto>(`/api/platform/gyms/${gymId}`)
```

**Secciones:**
- Info del gym (nombre, slug, ciclo, logo) + botón Editar inline
- Owner: nombre, email, link al perfil
- Stats: miembros activos, coaches, plantillas — el conteo de **plantillas siempre muestra 0**
  (`GymStatsDto.templates` es un placeholder hardcodeado en el backend que nunca se conectó al
  módulo training real, ver `docs/backend/modules/07-platform.md`)
- Status actual con botón de acción rápida (Suspender / Reactivar)
- Botón "Entrar como admin" → redirect a `/gym/{gymId}/admin/members`
- Zona de peligro: Eliminar gym (con confirmación de slug)

---

## /platform/gym-requests — Solicitudes de Gimnasio

Bandeja de las solicitudes enviadas desde el formulario público de la landing (`POST
/api/public/gym-requests` — ver `docs/backend/modules/07-platform.md`). Componentes reales:
`page.tsx` (Server Component) + `gym-requests-view.tsx` (`GymRequestsView`) + `actions.ts`
(`updateGymRequestStatus`).

**Fetch:**
```ts
GET /api/platform/gym-requests?status={status}&page={page}&size=20
```

**Tabla:** nombre del gym, contacto, email, teléfono, mensaje, badge de status con color, fecha,
menú de acciones (`DropdownMenu`) con las transiciones válidas.

**Transiciones de status — restricción solo en el frontend:**
```ts
const statusTransitions: Record<string, string[]> = {
  PENDING:   ['CONTACTED', 'REJECTED'],
  CONTACTED: ['APPROVED', 'REJECTED'],
  APPROVED:  ['REJECTED'],
  REJECTED:  ['CONTACTED'],
}
```
El backend (`PATCH /api/platform/gym-requests/{id}/status`) acepta cualquiera de los 4 valores
sin validar la transición — este mapa es puramente de UX (qué opciones mostrar en el menú), no
un espejo de una regla de negocio del backend.

**`APPROVED` no crea un gym automáticamente.** Marcar una solicitud como aprobada es solo un
cambio de estado — el superadmin todavía tiene que ir a `/platform/gyms/new` y crear el gym
manualmente con los datos del contacto.

---

## /platform/admins — Gestión de Superadmins

**Fetch:**
```ts
const admins = await apiClient<SuperAdminDto[]>('/api/platform/admins')
```

**Componentes reales** (`app/(dashboard)/platform/admins/`):
```
page.tsx          ← Server Component: fetch + pasa a AdminsView
admins-view.tsx   ← AdminsView: búsqueda de usuario para promover + lista de superadmins
                     con botón "Quitar acceso"
actions.ts        ← searchUsers (Server Action, migrada de fetch directo — ver docs/DEUDA.md DT-07),
                     promoteUser, demoteUser
```

**Promover usuario — flujo:**
1. Input de búsqueda: escribe email → fetch `GET /api/platform/users?search=email`
2. Muestra resultado: nombre + email
3. Confirma: "¿Darle acceso de superadmin a {nombre}?"
4. Ejecuta `POST /api/platform/admins/{userId}/promote`

**Quitar acceso — confirmación:**
```
"¿Quitarle el acceso de superadmin a {nombre}?
Ya no podrá acceder a este panel."
[Cancelar] [Confirmar]
```
- Si es el último superadmin: error 409 → toast "No podés quitar el último superadmin"
- El botón del usuario actual aparece deshabilitado con tooltip "No podés quitarte el acceso"

---

## Tests

**No hay test files para ninguna pantalla de `/platform`** (ni gyms, ni admins, ni
gym-requests). Todo lo de abajo es comportamiento esperado, no verificado por CI.

### Gym Requests
```
- Lista paginada con filtro por status
- Cambiar status: solo ofrece las transiciones del mapa statusTransitions (frontend-only)
- Aprobar una solicitud NO crea el gym — sigue siendo manual desde /platform/gyms/new
```

### Gyms
```
- Lista paginada de gyms con filtros por status
- Buscar por nombre filtra resultados
- Suspender gym: confirmación, ejecuta, badge cambia
- Suspender gym ya suspendido: acción no disponible en el menú
- Reactivar gym suspendido: disponible en el menú, ejecuta
- Eliminar gym: input de confirmación con slug, botón deshabilitado hasta match
- Eliminar gym con miembros: warning adicional visible
- "Entrar como admin": redirect a /gym/{id}/admin/members
- Crear gym: auto-generación de slug en tiempo real
- Crear gym: slug con caracteres inválidos → error inline
- Crear gym: slug duplicado → error 409 del API
- Crear gym: éxito → redirect a detalle con toast
```

### Superadmins
```
- Lista de superadmins se carga correctamente
- Usuario actual aparece destacado y sin botón "Quitar acceso"
- Buscar usuario para promover: resultados en tiempo real
- Promover usuario: confirmación, ejecuta, aparece en lista
- Quitar acceso: confirmación, ejecuta, desaparece de lista
- Quitar acceso al último superadmin: toast de error 409
- Quitar acceso a sí mismo: botón deshabilitado
```
