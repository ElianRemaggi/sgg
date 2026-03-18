# Frontend Web — Sección: Admin — Miembros
**Ruta:** `/gym/[gymId]/admin/members`
**Acceso:** ADMIN | ADMIN_COACH | SUPERADMIN

---

## Pantallas

### /admin/members — Lista de Miembros

**Fetch inicial (Server Component):**
```ts
// page.tsx — Server Component
const data = await apiClient<PageResponse<GymMemberDto>>(
  `/api/gyms/${gymId}/admin/members?status=${status}&page=${page}&size=20`
)
```

**Filtros disponibles (query params en la URL):**
- `status`: `ALL | PENDING | ACTIVE | BLOCKED | EXPIRED` (default: `ALL`)
- `role`: `ALL | MEMBER | COACH | ADMIN | ADMIN_COACH` (default: `ALL`)
- `search`: búsqueda por nombre o email (filtrado client-side para MVP)
- `page`: número de página

**Componentes:**
```
MembersPage (Server Component)
├── MembersFilters (Client Component — actualiza searchParams sin recargar)
├── MembersTable (Client Component)
│   ├── MemberRow (por cada miembro)
│   │   ├── Avatar + nombre + email
│   │   ├── RoleBadge (color por rol)
│   │   ├── StatusBadge (color por status)
│   │   ├── Fecha de vencimiento (rojo si < 30 días)
│   │   └── MemberActions (menú desplegable)
│   └── PaginationControls
└── PendingRequestsBanner (si hay pendientes, mostrar contador destacado)
```

**MemberActions — menú por estado:**
```
Si status = PENDING:
  → ✅ Aprobar
  → ❌ Rechazar

Si status = ACTIVE:
  → 🔄 Cambiar rol (submenu: MEMBER, COACH, ADMIN, ADMIN_COACH)
  → 📅 Definir vencimiento
  → 🚫 Bloquear

Si status = BLOCKED:
  → ✅ Desbloquear (= aprobar)
```

**Server Actions:**
```ts
// actions.ts
'use server'

export async function approveMember(gymId: string, memberId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/approve`, { method: 'PUT' })
  revalidatePath(`/gym/${gymId}/admin/members`)
}

export async function rejectMember(gymId: string, memberId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/reject`, { method: 'PUT' })
  revalidatePath(`/gym/${gymId}/admin/members`)
}

export async function blockMember(gymId: string, memberId: number) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/block`, { method: 'PUT' })
  revalidatePath(`/gym/${gymId}/admin/members`)
}

export async function changeMemberRole(gymId: string, memberId: number, role: string) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
  revalidatePath(`/gym/${gymId}/admin/members`)
}

export async function setMemberExpiry(gymId: string, memberId: number, expiresAt: string) {
  await apiClient(`/api/gyms/${gymId}/admin/members/${memberId}/expiry`, {
    method: 'PUT',
    body: JSON.stringify({ expiresAt }),
  })
  revalidatePath(`/gym/${gymId}/admin/members`)
}
```

**Manejo de errores en actions:**
- 409 al cambiar rol (coach con asignaciones activas): mostrar toast con mensaje del backend
- 403 intentar modificar al owner: mostrar toast "No podés modificar al owner del gym"
- Cualquier error: toast de error genérico + log en consola

**Modal: Definir Vencimiento**
- DatePicker con fecha mínima = hoy + 1 día
- Botón "Sin vencimiento" para limpiar `membership_expires_at`
- Confirmar → Server Action `setMemberExpiry`

**Modal: Cambiar Rol**
- Select con opciones: MEMBER, COACH, ADMIN, ADMIN_COACH
- Descripción de cada rol debajo del select
- Si el target es COACH con asignaciones: mostrar advertencia antes de confirmar

---

### /admin/members/[memberId] — Detalle de Miembro

**Fetch:**
```ts
const member = await apiClient<GymMemberDetailDto>(
  `/api/gyms/${gymId}/admin/members/${memberId}`
)
```

**Secciones:**
- Info básica: avatar, nombre, email, rol, status, fecha de unión, vencimiento
- Historial de rutinas asignadas (lista simple con fechas)
- Coach asignado (si tiene)
- Acciones disponibles (mismo menú que en la tabla)

---

## Estados de Carga y Error

```ts
// loading.tsx — skeleton mientras carga
export default function Loading() {
  return <MembersTableSkeleton rows={10} />
}

// error.tsx — si falla el fetch
export default function Error({ error, reset }) {
  return (
    <div>
      <p>Error al cargar los miembros: {error.message}</p>
      <button onClick={reset}>Reintentar</button>
    </div>
  )
}
```

---

## Tests

```
✅ Lista carga con datos del servidor y los renderiza
✅ Filtro por status=PENDING muestra solo pendientes
✅ Filtro por role=COACH muestra solo coaches
✅ Aprobar miembro: llama Server Action, revalida y actualiza la lista
✅ Rechazar miembro: llama Server Action, revalida
✅ Bloquear miembro: pide confirmación, luego ejecuta
✅ Cambiar rol a COACH: modal con select, confirma y actualiza
✅ Cambiar rol de COACH con asignaciones activas: muestra warning 409
✅ Definir vencimiento: DatePicker, confirma, actualiza badge de fecha
✅ Owner del gym: menú de acciones no muestra opciones de modificación
✅ Paginación: navegar a página 2 carga nuevos datos
✅ Estado vacío (sin miembros): muestra mensaje apropiado
✅ Sin permiso (COACH intenta acceder): middleware redirige
```
