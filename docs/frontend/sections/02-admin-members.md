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

**Filtros disponibles (query params en la URL, select en `members-view.tsx`):**
- `status`: `ALL | PENDING | ACTIVE | BLOCKED | EXPIRED` (default: `ALL`)
- `role`: `ALL | MEMBER | COACH | ADMIN | ADMIN_COACH` (default: `ALL`)
- `search`: búsqueda por nombre o email (filtrado client-side para MVP)
- `page`: número de página

> **Inconsistencia real (no corregida):** el select de status en el frontend ofrece
> `EXPIRED`, pero `GymMemberStatus` en el backend no tiene ese valor (es
> `PENDING|ACTIVE|REJECTED|BLOCKED|INACTIVE`, y tampoco tiene `REJECTED` como opción de filtro
> en el select). Elegir "Expirados" no rompe nada — el backend hace `Enum.valueOf` con manejo
> seguro de valor inválido (trata cualquier status no reconocible como "sin filtro" y devuelve
> todos) — pero tampoco filtra por nada útil.

**Componentes reales** (todo en `app/(dashboard)/gym/[gymId]/admin/members/`):
```
page.tsx                  ← Server Component: lee searchParams, fetch, pasa a members-view
members-view.tsx          ← Client Component principal: filtros + tabla + paginación +
                             banner de pendientes inline (no es un componente separado)
member-actions.tsx        ← Menú de acciones por fila (dropdown-menu de shadcn/ui)
modals/
├── change-role-dialog.tsx
└── set-expiry-dialog.tsx
actions.ts                ← Server Actions
loading.tsx / error.tsx
```

No existe una ruta de detalle `/admin/members/[memberId]` — todo el flujo vive en la lista.

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
- 403 intentar modificar al owner: mostrar toast "No podés modificar al owner del gym"
- Cualquier error: toast de error genérico + log en consola

**Modal: Definir Vencimiento (`set-expiry-dialog.tsx`)**
- DatePicker con fecha mínima = hoy + 1 día
- Botón "Sin vencimiento" para limpiar `membership_expires_at`
- Confirmar → Server Action `setMemberExpiry`

**Modal: Cambiar Rol (`change-role-dialog.tsx`)**
- Select con opciones: MEMBER, COACH, ADMIN, ADMIN_COACH
- Descripción de cada rol debajo del select
- **No hay bloqueo ni warning por asignaciones de coach activas.** Si el target deja de ser
  COACH/ADMIN_COACH, el backend publica `CoachDeactivatedEvent` y auto-desasigna sus
  `coach_assignments` silenciosamente (ver `docs/backend/modules/02-tenancy.md` y
  `03-coaching.md`) — no hay 409 ni confirmación adicional en el frontend para este caso.

---

## Estados de Carga y Error

`loading.tsx` (`MembersLoading`) renderiza skeletons (`animate-pulse`) para filtros + 10 filas
inline, sin un componente `Skeleton` reutilizable separado. `error.tsx` sigue el patrón estándar
de Next (boundary con `error`/`reset`) — ver `docs/frontend/FRONTEND-CONVENTIONS.md` para el
patrón general.

---

## Tests

**No hay test file para esta sección** (`members-view.tsx`, `member-actions.tsx`, los dialogs)
— a diferencia de `admin/coaches` (`coaches-view.test.tsx`) o `coach/my-members`
(`my-members-view.test.tsx`), que sí tienen cobertura Vitest + Testing Library. La lista de
casos de abajo describe comportamiento esperado/manual, no verificado por CI.

```
- Lista carga con datos del servidor y los renderiza
- Filtro por status=PENDING muestra solo pendientes
- Filtro por role=COACH muestra solo coaches
- Aprobar/Rechazar/Bloquear miembro: llama Server Action, revalida
- Cambiar rol a COACH: modal con select, confirma y actualiza
- Definir vencimiento: DatePicker, confirma, actualiza badge de fecha
- Owner del gym: menú de acciones no muestra opciones de modificación
- Paginación: navegar a página 2 carga nuevos datos
- Estado vacío (sin miembros): muestra mensaje apropiado
```

> COACH sí puede acceder a esta pantalla (el backend permite `isAdmin OR isCoach OR
> SUPERADMIN` en `GET .../admin/members`) — no hay redirect de middleware para COACH acá.
