# App Móvil — Pantallas: Auth
**Rutas:** `(auth)/login`, `(auth)/register`
**Usuarios:** Todos (pre-autenticación)

---

## login.tsx

**Layout:** pantalla centrada, sin tab bar, logo de la app arriba.

**Opciones:**
1. Login con Google (`expo-auth-session` + Supabase OAuth)
2. Login con email/password

**Componente GoogleLoginButton:**
```ts
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

async function loginWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: AuthSession.makeRedirectUri({ scheme: 'sgg' }),
    },
  })
  if (error) setError("No se pudo iniciar sesión con Google")
}
```

**Requiere en app.json:**
```json
{
  "expo": {
    "scheme": "sgg",
    "ios": { "bundleIdentifier": "com.sgg.app" },
    "android": { "package": "com.sgg.app" }
  }
}
```

**Formulario email/password:**
```ts
const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
})
```

**Estados de la pantalla:**
- `idle` → formulario activo
- `loading` → ActivityIndicator, inputs y botones deshabilitados
- `error` → mensaje de error en rojo debajo del formulario

**Manejo de errores Supabase (mobile):**
```ts
const SUPABASE_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos",
  "Email not confirmed": "Confirmá tu email antes de ingresar",
  "Too many requests": "Demasiados intentos. Esperá unos minutos.",
  "Network request failed": "Sin conexión a internet",
}
```

**Post-login exitoso:**
1. Llamar `POST /api/auth/sync` con los datos de la sesión
2. Cargar membresías del usuario: `GET /api/users/me/memberships`
3. Si tiene un solo gym activo → setear en GymStore → navegar a `(main)`
4. Si tiene múltiples gyms → navegar a `select-gym` modal
5. Si no tiene gyms → navegar a `(main)` con mensaje "Buscá tu gym para unirte"

**Link "¿No tenés cuenta?" → register.tsx**

---

## register.tsx

**Campos:**
- Nombre completo (text, requerido, min 2 chars)
- Email (email, requerido)
- Contraseña (password, requerido, min 6 chars)
- Confirmar contraseña (password, must match)

**Validación Zod:**
```ts
const schema = z.object({
  fullName: z.string().min(2, "Mínimo 2 caracteres").max(200),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})
```

**Flujo:**
1. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
2. Supabase envía email de confirmación
3. Mostrar pantalla: "Revisá tu email para confirmar tu cuenta"
4. Cuando el usuario confirma → el `onAuthStateChange` detecta la sesión → sync + navegar

---

## select-gym.tsx (modal)

**Cuándo aparece:** Al hacer login si el usuario tiene múltiples gyms activos.

**Fetch:**
```ts
const { data: memberships } = useQuery({
  queryKey: ['memberships'],
  queryFn: () => apiClient<UserMembershipDto[]>('/api/users/me/memberships'),
})
```

**Lista de gyms:**
- FlatList con GymCard por cada membresía activa
- GymCard: logo (o inicial del nombre), nombre, rol del usuario

**Al seleccionar:**
```ts
function selectGym(gymId: number, gymName: string) {
  useGymStore.getState().setActiveGym(gymId, gymName)
  router.dismiss()  // cerrar modal
  // El tab de rutina se carga automáticamente con el gymId activo
}
```

**Estado vacío:** "No tenés membresías activas. Buscá tu gym en la app."

---

## Flujo de Navegación Completo (Auth)

```
_layout.tsx
  │
  ├── Sin sesión → (auth)/login
  │     └── Login exitoso
  │           ├── 1 gym → setActiveGym → (main)/tabs
  │           ├── N gyms → select-gym modal → (main)/tabs
  │           └── 0 gyms → (main)/tabs (sin gym activo, pantalla de búsqueda)
  │
  └── Con sesión → (main)/tabs
        └── Sin gym activo → select-gym modal
```

---

## Tests (Jest + React Native Testing Library)

```
✅ login.tsx renderiza opciones Google + email/password
✅ Submit con email inválido: error Zod, sin llamada a Supabase
✅ Submit con credenciales incorrectas: mensaje de error en español
✅ Login exitoso con 1 gym: navega a (main), llama /api/auth/sync
✅ Login exitoso con múltiples gyms: abre select-gym modal
✅ Login exitoso sin gyms: navega a (main) sin gym activo
✅ Sin conexión: mensaje "Sin conexión a internet"
✅ Loading state: inputs deshabilitados, ActivityIndicator visible

✅ register.tsx: contraseñas no coinciden → error inline
✅ register.tsx: registro exitoso → pantalla de confirmación de email

✅ select-gym: lista de gyms cargada correctamente
✅ select-gym: seleccionar gym → setea en store y cierra modal
✅ select-gym: sin gyms activos → estado vacío con instrucciones
```
