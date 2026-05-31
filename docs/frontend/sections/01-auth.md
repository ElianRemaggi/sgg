# Frontend Web — Sección: Auth
**Rutas:** `/login`, `/register`, `/select-gym`
**Usuarios:** Todos (pre-autenticación)

---

## /login

**Comportamiento:**
- Si el usuario ya tiene sesión (nativa o Supabase) → redirect a `/select-gym` (middleware)
- Dos métodos: Google OAuth y email/password nativo
- Campo: `identifier` (acepta email O username)

**Componentes:**
```
LoginPage (Server Component — redirect si ya logueado)
└── LoginForm (Client Component)
    ├── Botón "Continuar con Google"
    └── Formulario email/password nativo
```

**Flujo login nativo:**
```ts
// 1. POST al backend
const res = await fetch(`${API_URL}/api/public/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ identifier, password }),  // identifier = email o username
})

// 2. Guardar JWT en cookie httpOnly via BFF
await fetch('/api/auth/native', {
  method: 'POST',
  body: JSON.stringify({ token: data.data.token }),
})

// 3. Redirect
router.push('/select-gym')
router.refresh()
```

**Flujo Google OAuth:**
```ts
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: `${window.location.origin}/auth/callback` },
})
// Supabase maneja el redirect. El auth/callback de Supabase crea la sesión.
// No hay llamada manual a /api/auth/sync desde el frontend web —
// el backend la procesa automáticamente en el primer request autenticado.
```

**Errores manejados:**
- "Esta cuenta usa Google para ingresar" → mensaje específico
- Otros → `data.message` del backend o "Email o contraseña incorrectos"
- Error de red → "Error de conexión"

**No usa Zod** — validación mínima con atributos HTML (`required`, `minLength`).

---

## /register

**Comportamiento:**
- Registro nativo via backend (el backend auto-genera el `username` desde el email)
- Tras registro exitoso → guarda JWT → redirect a `/select-gym`

**Campos:**
- Nombre completo (`minLength=2`)
- Email (`type=email`)
- Contraseña (`minLength=6`)
- Confirmar contraseña (validación client-side)

> **Nota:** El formulario web no expone el campo `username` — el backend lo genera automáticamente desde el email via `UsernameGenerator`. Distinto al formulario móvil que sí pide username.

**Flujo:**
```ts
// 1. Validar contraseñas coinciden (client-side)
if (password !== confirmPassword) setError('Las contraseñas no coinciden')

// 2. POST al backend
await fetch(`${API_URL}/api/public/auth/register`, {
  body: JSON.stringify({ email, fullName, password }),
  // no incluye username — backend lo genera
})

// 3. Guardar JWT + redirect (mismo flow que login)
```

---

## /select-gym

**Comportamiento:**
- Lista membresías activas del usuario
- Redirect automático si tiene un solo gym activo
- Si no tiene gyms → muestra estado vacío con búsqueda por slug

**Fetch (Server Component via `apiClient`):**
```ts
GET /api/users/me/memberships
```

**Redirect por rol:**
```ts
switch (role) {
  case 'ADMIN':
  case 'ADMIN_COACH': return `/gym/${gymId}/admin/members`
  case 'COACH':       return `/gym/${gymId}/coach/templates`
  default:            return `/gym/${gymId}/member/routine`  // MEMBER
}
```

---

## middleware.ts — Flujo completo

```
Request entrante
  ├── pathname === '/' → redirect /landing
  ├── pathname.startsWith('/landing') o '/privacy' → pasar (público)
  ├── No autenticado + ruta protegida → redirect /login
  └── Autenticado + /login o /register → redirect /select-gym
```

**Autenticación detectada:**
- Cookie `sgg-token` (JWT nativo, httpOnly)
- Sesión Supabase (cookies del SSR client)

---

## Route Handler: `/api/auth/native`

```
POST  /api/auth/native  { token }  → setea cookie sgg-token (httpOnly, 24h)
DELETE /api/auth/native            → borra cookie sgg-token
```

Usado solo por el flujo de login/register nativo. El logout Supabase se hace via `supabase.auth.signOut()`.

---

## Tests

### login-form.test.tsx (Vitest + Testing Library)
```
✅ Renderiza campo "Email o usuario" y "Contraseña"
✅ Submit con campos vacíos: no llama a la API (required HTML)
✅ Login nativo exitoso: llama /api/public/auth/login → /api/auth/native → push /select-gym
✅ Error "Esta cuenta usa Google para ingresar": muestra mensaje específico
✅ Error del backend (credenciales): muestra data.message
✅ Error de red: muestra "Error de conexión"
✅ Loading state: botón deshabilitado durante fetch
```

### middleware.test.ts
```
✅ / → redirect /landing
✅ /landing → pasa sin auth
✅ /gym/1/... sin auth → redirect /login
✅ /login con sgg-token → redirect /select-gym
✅ /login con Supabase session → redirect /select-gym
✅ /gym/1/... con sgg-token → pasa
```
