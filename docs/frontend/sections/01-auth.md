# Frontend Web — Sección: Auth
**Ruta base:** `/login`, `/select-gym`
**Usuarios:** Todos (pre-autenticación)

---

## Pantallas

### /login

**Comportamiento:**
- Si el usuario ya tiene sesión activa → redirect a `/select-gym`
- Dos métodos de login: Google OAuth y email/password
- Tras login exitoso → llamar `POST /api/auth/sync` para crear/actualizar el user en la BD → redirect a `/select-gym`

**Componentes:**
```
LoginPage (Server Component — verifica sesión, redirect si ya logueado)
└── LoginForm (Client Component)
    ├── GoogleLoginButton
    └── EmailPasswordForm
```

**EmailPasswordForm:**
- Campos: `email` (type=email), `password` (type=password)
- Validación client-side con Zod:
  ```ts
  const schema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres")
  })
  ```
- Estados:
  - `idle` → formulario habitual
  - `loading` → botón deshabilitado + spinner
  - `error` → mensaje de error inline (ej: "Credenciales incorrectas")

**Manejo de errores Supabase:**
```ts
// Mapear errores de Supabase a mensajes en español
const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos",
  "Email not confirmed": "Debés confirmar tu email antes de ingresar",
  "Too many requests": "Demasiados intentos. Esperá unos minutos.",
}
```

**Post-login — sync con backend:**
```ts
// Después de supabase.auth.signInWithPassword() exitoso:
async function syncUser(session: Session) {
  await apiClient('/api/auth/sync', {
    method: 'POST',
    body: JSON.stringify({
      supabaseUid: session.user.id,
      email: session.user.email,
      fullName: session.user.user_metadata.full_name,
      avatarUrl: session.user.user_metadata.avatar_url,
      provider: session.user.app_metadata.provider,
      providerUid: session.user.user_metadata.provider_id,
    })
  })
}
```

---

### /select-gym

**Comportamiento:**
- Lista los gyms del usuario autenticado (llama `GET /api/users/me/memberships`)
- Solo muestra membresías con `status = ACTIVE`
- Al seleccionar un gym → guarda `gymId` en cookie de sesión → redirect a `/gym/{gymId}/...` según el rol
- Si el usuario no tiene gyms activos → mostrar estado vacío con instrucciones para buscar un gym
- Si el usuario tiene un solo gym activo → redirect automático sin mostrar la pantalla de selección

**Redirect por rol:**
```ts
function getHomeForRole(gymId: number, role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'ADMIN_COACH':
      return `/gym/${gymId}/admin/members`
    case 'COACH':
      return `/gym/${gymId}/coach/my-members`
    default:
      return `/gym/${gymId}/admin/members` // fallback
  }
}
```

**Estados de la pantalla:**
- `loading` → skeleton de cards
- `empty` → "No tenés membresías activas. Pedile al admin de tu gym el slug para unirte."
- `loaded` → grilla de GymCard

**GymCard muestra:** logo, nombre, rol del usuario, estado de la membresía.

---

## middleware.ts

```ts
// Rutas protegidas y redirects globales
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/public).*)',
  ],
}

export async function middleware(request: NextRequest) {
  // 1. Verificar sesión Supabase
  // 2. Sin sesión + ruta protegida → /login
  // 3. Con sesión + /login → /select-gym
  // 4. Ruta /platform → verificar platform_role (fetch a /api/users/me)
  // 5. El gym seleccionado activo se guarda en cookie 'active-gym-id'
}
```

---

## Tests (Playwright o Vitest + Testing Library)

```
✅ /login — renderiza form de email/password y botón Google
✅ /login — submit con email inválido: muestra error Zod sin llamar a Supabase
✅ /login — credenciales incorrectas: muestra "Email o contraseña incorrectos"
✅ /login — login exitoso: llama /api/auth/sync y redirige a /select-gym
✅ /login — usuario ya logueado: redirige a /select-gym sin mostrar el form
✅ /select-gym — un solo gym activo: redirige automáticamente
✅ /select-gym — múltiples gyms: muestra lista y permite seleccionar
✅ /select-gym — sin gyms activos: muestra estado vacío con instrucciones
✅ /select-gym — seleccionar gym ADMIN: redirige a /admin/members
✅ /select-gym — seleccionar gym COACH: redirige a /coach/my-members
```
