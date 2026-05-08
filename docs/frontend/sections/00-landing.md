# Frontend Web — Landing Page
**Ruta:** `/landing`
**Dominio:** `dev.drinklen.com.ar` (puerto 3001)
**Acceso:** Público — sin autenticación requerida

---

## Propósito

Página de marketing pública que presenta SGG a potenciales clientes. No requiere Supabase ni credenciales. Es el punto de entrada de `dev.drinklen.com.ar`.

---

## Archivo

```
sgg-web/src/app/landing/page.tsx   ← todo en un único Client Component
```

Es un `'use client'` completo porque usa GSAP, estado local (tab de roles, menú mobile) y refs del DOM.

---

## Stack específico

| Lib | Uso |
|-----|-----|
| `gsap` + `ScrollTrigger` | Animaciones de entrada y parallax |
| `next/font/google` (Anton + Outfit) | Tipografía display + body |
| `lucide-react` | Íconos |
| Tailwind CSS | Layout y utilidades |

Sin shadcn/ui, sin llamadas a la API, sin Supabase.

---

## Secciones

| Sección | `data-section` | Descripción |
|---------|---------------|-------------|
| Nav fijo | — | Logo + links + CTA. Fondo transparente → oscuro al hacer scroll |
| Hero | `hero` | Título gigante (Anton), cards flotantes animadas, CTAs |
| Stats | — | 4 contadores animados con GSAP (500+ gimnasios, etc.) |
| Features | `features` | Grilla 3×2 de funcionalidades con íconos |
| Roles | `roles` | Panel con tabs ADMIN / COACH / MEMBER |
| Cómo funciona | `steps` | 3 pasos numerados |
| CTA final | `cta` | Call to action con gradiente dorado |
| Footer | — | Logo + copyright + links legales |

---

## Sistema de animaciones

Todas las animaciones usan atributos `data-anim="*"` como selectores GSAP, registradas en un único `useEffect` con `gsap.context()` (limpieza automática en `ctx.revert()`).

| `data-anim` | Efecto |
|-------------|--------|
| `hero-badge` | Fade + slide up, delay 0.1s |
| `hero-line` | Slide desde abajo (y: 130), stagger por línea |
| `hero-sub` | Fade + slide up |
| `hero-cta` | Fade + slide up |
| `float-card` | Slide desde abajo con `back.out`, stagger |
| `orb-1`, `orb-2` | Parallax scroll (scrub) |
| `feature-card` | Slide desde abajo, stagger al entrar en viewport |
| `section-title` | Fade + slide up al entrar en viewport |
| `roles-content` | Fade + slide up al entrar en viewport |
| `step` | Slide desde la izquierda, stagger |
| `cta-content` | Fade + slide up al entrar en viewport |
| `nav` | Fondo dinámico por scroll (no GSAP, manipulación directa de style) |

Los contadores de stats usan `data-count` y `data-suffix` directamente en el elemento.

---

## Paleta y tipografía

```css
--gold: #D4A843          /* dorado principal */
--gold-light: #ECC96A    /* dorado claro */
bg: #070707              /* negro profundo */
text: #F0EDE8            /* blanco cálido */
teal: #2DD4BF            /* adherencia / accent */
violet: #A78BFA          /* rol MEMBER */
```

Fuente display: **Anton** (headings grandes, `var(--font-display)`)
Fuente body: **Outfit** (`var(--font-body)`)

---

## Middleware — rutas públicas

La landing no pasa por el flujo de autenticación de Supabase. El middleware tiene dos reglas que la protegen:

```typescript
// middleware.ts
if (request.nextUrl.pathname === '/') {
  return NextResponse.redirect(new URL('/landing', request.url))
}

const isPublicPage = request.nextUrl.pathname.startsWith('/landing')
if (isPublicPage) return NextResponse.next({ request: { headers: request.headers } })
```

El root `/` redirige a `/landing` antes de que el middleware intente crear el cliente de Supabase, lo que permite que el servidor en `dev.drinklen.com.ar` funcione sin variables de entorno de Supabase.

---

## Infraestructura

- Cloudflare Tunnel (`16a4701f-8a7d-4403-80ac-e3cb4b1fe947`) rutea `dev.drinklen.com.ar` → `http://localhost:3001`
- Config: `/etc/cloudflared/config.yml`
- El proceso Next.js en puerto 3001 se levanta con `npm run dev` desde `sgg-web/`

---

## Variables de entorno

La landing **no requiere** ninguna variable de entorno. Funciona sin `.env.local`.
Si en el futuro se agregan formularios de contacto u otras integraciones, documentarlas aquí.
