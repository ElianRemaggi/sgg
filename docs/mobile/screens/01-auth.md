# App Móvil — Pantallas: Auth
**Rutas:** `(auth)/login`, `(auth)/register`, `select-gym`
**Usuarios:** Todos (pre-autenticación)

---

## login.tsx

**Layout:** pantalla centrada con `Screen` (SafeAreaView + fondo blanco/dark). Sin tab bar.

**Opciones:**
1. Login nativo con usuario/email + contraseña (principal)
2. Login con Google (OAuth via Supabase)

**Usa `react-hook-form` + `zodResolver`:**
```ts
const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Campo requerido'),
  password: z.string().min(1, 'Campo requerido'),
})
```

**Flujo login nativo:**
```ts
await nativeLogin(data.usernameOrEmail, data.password)
// nativeLogin llama POST /api/public/auth/login
// guarda el JWT en SecureStore('sgg.jwt')
await navigateAfterAuth()
// navigateAfterAuth() resuelve hacia (main)/(routine) o /select-gym
```

> No requiere llamada a `/api/auth/sync` — solo el flujo Google la necesita.

**Flujo Google OAuth (PKCE + implícito):**
```ts
const redirectUrl = makeRedirectUri({ scheme: 'sgg', path: 'auth/callback' })
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
})
const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

if (result.type === 'success') {
  // Soporta PKCE (code en query params) y flujo implícito (tokens en hash)
  if (code) await supabase.auth.exchangeCodeForSession(code)
  else await supabase.auth.setSession({ access_token, refresh_token })
  await syncSupabaseUser()     // POST /api/auth/sync
  await navigateAfterAuth()
}
```

**Errores:** mostrados como toast (`toast.error(...)`). Si el error es `ApiError`, se usa `err.message`. Si no, mensaje genérico.

**Requiere en app.config.js:**
```js
scheme: 'sgg',
ios: { bundleIdentifier: 'com.sgg.app' },
android: { package: 'com.sgg.app' },
```

**Link "¿No tenés cuenta?" → `(auth)/register`**

---

## register.tsx

**Campos (en orden):**
- Nombre completo (min 2 chars)
- Email (email válido)
- Usuario (min 3 chars, solo `[a-z0-9_]`)
- Contraseña (min 8 chars)
- Confirmar contraseña (debe coincidir)

**Validación Zod:**
```ts
const schema = z.object({
  fullName: z.string().min(2, 'Nombre demasiado corto'),
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9_]+$/, 'Solo letras, números y _'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})
```

**Flujo:**
1. `nativeRegister({ fullName, email, username, password })`  
   → `POST /api/public/auth/register`  
   → `POST /api/public/auth/login` (auto-login)  
   → guarda JWT en SecureStore
2. `router.replace('/')` — el BootstrapGate redirige automáticamente

> Sin confirmación de email — el registro es inmediato.

**Link "¿Ya tenés cuenta?" → vuelve atrás (router.back())**

---

## select-gym.tsx (pantalla fullscreen)

**Cuándo aparece:**
- Al bootstrap si el usuario no tiene gym seleccionado o válido
- Cuando el usuario toca "Cambiar gym" en perfil (si tiene múltiples membresías)
- Si `(main)/_layout.tsx` detecta `selectedGymId === null`

**Fetch:**
```ts
const { data } = useQuery({
  queryKey: queryKeys.memberships(),
  queryFn: () => apiClient<ApiResponse<MembershipDto[]>>('/api/users/me/memberships'),
})
const memberships = data?.data?.filter((m) => m.status === 'ACTIVE') ?? []
```

**Si tiene membresías activas:** FlatList con card por gym.
```ts
// Card muestra: nombre del gym, rol, gymSlug
// Al tocar:
setGym(String(gymId))
router.replace('/(main)/(routine)')
```

**Si no tiene membresías activas:** muestra búsqueda por slug + join request.
```ts
// Buscar gym:
queryKeys.gymSearch(submittedSlug)
// → GET /api/gyms/search?slug=...

// Unirse:
POST /api/gyms/${gymId}/join-request
// onSuccess: toast("Solicitud enviada a {gymName}")
```

**Estado vacío sin membresías:** "No tenés membresías activas. Buscá un gym por su slug."

---

## BootstrapGate (app/_layout.tsx)

No es una pantalla pero define el flujo de inicio:

```
App abre (_layout.tsx)
  └── BootstrapGate
        ├── Lee 'sgg.jwt' de SecureStore
        ├── Lee sesión de Supabase
        ├── Si nada → router.replace('/(auth)/login')
        └── Si hay sesión → navigateAfterAuth()
              ├── 0 membresías activas → /select-gym
              ├── 1 membresía         → setGym() → /(main)/(routine)
              └── N membresías        → /select-gym
        
        Timeout global: 12s → fallback a /(auth)/login
        Error 401/403: limpia JWT + signOut + login
```

Muestra un overlay con `ActivityIndicator` y texto del paso actual mientras carga.

---

## Flujo de Navegación Completo (Auth)

```
_layout.tsx (BootstrapGate)
  │
  ├── Sin sesión → (auth)/login
  │     ├── Login nativo exitoso → navigateAfterAuth()
  │     └── Google OAuth exitoso → syncSupabaseUser() → navigateAfterAuth()
  │
  └── Con sesión → navigateAfterAuth()
        ├── 0 gyms → /select-gym
        ├── 1 gym  → setGym() → (main)/(routine)
        └── N gyms → /select-gym
              └── Seleccionar gym → setGym() → (main)/(routine)

(main)/_layout.tsx
  └── selectedGymId === null → <Redirect href="/select-gym" />
```

---

## Tests (Jest + React Native Testing Library)

```
✅ login.tsx: renderiza campo "Usuario o email" + contraseña + botón Google
✅ Submit vacío: errores Zod inline, sin llamada a API
✅ Login nativo exitoso: llama nativeLogin → navigateAfterAuth
✅ Login falla (credenciales): muestra toast de error
✅ Google OAuth: abre WebBrowser → syncSupabaseUser → navigateAfterAuth
✅ Loading state: botón con spinner durante submit

✅ register.tsx: validación de usuario (regex) y contraseñas no coinciden
✅ register.tsx: registro exitoso → nativeRegister → router.replace('/')

✅ select-gym: lista membresías activas
✅ select-gym: seleccionar gym → setGym → replace a (main)/(routine)
✅ select-gym: sin membresías → muestra buscador de slug
✅ select-gym: join request exitoso → toast de confirmación
```
