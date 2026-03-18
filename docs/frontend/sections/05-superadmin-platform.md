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

**PlatformSidebar links:**
- 🏢 Gimnasios → `/platform/gyms`
- 👑 Superadmins → `/platform/admins`

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

**Componentes:**
```
PlatformGymsPage (Server Component)
├── PlatformFilters (Client — actualiza searchParams)
├── CreateGymButton → /platform/gyms/new
└── GymsTable
    └── GymRow (por cada gym)
        ├── Nombre + slug
        ├── Owner (nombre + email)
        ├── Cantidad de miembros activos
        ├── StatusBadge (ACTIVE=verde, SUSPENDED=amarillo, DELETED=gris)
        ├── Fecha de creación
        └── RowActions (menú)
            ├── 👁️ Ver detalle → /platform/gyms/{id}
            ├── ✏️ Editar → /platform/gyms/{id} (modo edición)
            ├── 🏠 Entrar como admin → /gym/{id}/admin/members
            ├── ⏸️ Suspender (si ACTIVE)
            ├── ▶️ Reactivar (si SUSPENDED)
            └── 🗑️ Eliminar (con confirmación fuerte)
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

**Formulario (Client Component):**
```
CreateGymForm
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
- Stats: miembros activos, coaches, plantillas
- Status actual con botón de acción rápida (Suspender / Reactivar)
- Botón "Entrar como admin" → redirect a `/gym/{gymId}/admin/members`
- Zona de peligro: Eliminar gym (con confirmación de slug)

---

## /platform/admins — Gestión de Superadmins

**Fetch:**
```ts
const admins = await apiClient<SuperAdminDto[]>('/api/platform/admins')
```

**Componentes:**
```
PlatformAdminsPage (Server Component)
├── CurrentUserBadge ("Sos uno de X superadmins")
├── PromoteUserSection
│   ├── Input búsqueda de usuario (email o nombre)
│   └── Botón "Promover a Superadmin"
└── AdminsList
    └── AdminRow
        ├── Avatar + nombre + email
        └── Botón "Quitar acceso" (deshabilitado si es el usuario actual)
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

### Gyms
```
✅ Lista paginada de gyms con filtros por status
✅ Buscar por nombre filtra resultados
✅ Suspender gym: confirmación, ejecuta, badge cambia
✅ Suspender gym ya suspendido: acción no disponible en el menú
✅ Reactivar gym suspendido: disponible en el menú, ejecuta
✅ Eliminar gym: input de confirmación con slug, botón deshabilitado hasta match
✅ Eliminar gym con miembros: warning adicional visible
✅ "Entrar como admin": redirect a /gym/{id}/admin/members
✅ Crear gym: auto-generación de slug en tiempo real
✅ Crear gym: slug con caracteres inválidos → error inline
✅ Crear gym: slug duplicado → error 409 del API
✅ Crear gym: éxito → redirect a detalle con toast
```

### Superadmins
```
✅ Lista de superadmins se carga correctamente
✅ Usuario actual aparece destacado y sin botón "Quitar acceso"
✅ Buscar usuario para promover: resultados en tiempo real
✅ Promover usuario: confirmación, ejecuta, aparece en lista
✅ Quitar acceso: confirmación, ejecuta, desaparece de lista
✅ Quitar acceso al último superadmin: toast de error 409
✅ Quitar acceso a sí mismo: botón deshabilitado
```
