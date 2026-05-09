# Frontend Testing — sgg-web

## Stack

| Capa | Herramienta | Por qué |
|------|-------------|---------|
| Test runner | Vitest 1.x | Compatible con esbuild de Next, TS estricto sin Babel, ESM nativo |
| DOM | jsdom | Estándar para Testing Library |
| Component testing | @testing-library/react + user-event + jest-dom | Testing por comportamiento, no implementación |
| Backend mock | MSW 2.x (Node + Browser) | Intercepta fetch a nivel de network; handlers reutilizables entre Vitest y Playwright |
| E2E | @playwright/test | Multi-browser, fixtures, traces, auto-waits |
| Cobertura | @vitest/coverage-v8 | Line/branch coverage |

## Cómo correr

```bash
cd sgg-web

# Unit / integration (una vez)
npm test

# Unit / integration (modo watch)
npm run test:watch

# Con cobertura
npm run test:coverage

# E2E (requiere next dev corriendo o lo levanta Playwright)
npm run test:e2e

# E2E con UI interactiva
npm run test:e2e:ui
```

## Estructura de archivos

```
sgg-web/
├── vitest.config.ts          — config Vitest (jsdom, paths, coverage)
├── vitest.setup.ts           — jest-dom + MSW lifecycle
├── playwright.config.ts      — config Playwright (webServer, globalSetup)
├── tests/
│   ├── msw/
│   │   ├── handlers.ts       — handlers MSW default por endpoint
│   │   ├── server.ts         — setupServer para Vitest (Node)
│   │   └── browser.ts        — setupWorker para browser (opcional)
│   ├── utils/
│   │   ├── render.tsx        — render con ToastProvider
│   │   ├── factories.ts      — factories tipadas de DTOs
│   │   └── playwright-fixtures.ts — loginAsMember / loginAsCoach
│   ├── fixtures/
│   │   ├── users.ts
│   │   ├── assignments.ts
│   │   └── progress.ts
│   └── e2e/
│       ├── global-setup.ts   — mock API server Node.js en puerto 4001
│       ├── auth.spec.ts
│       ├── member-routine.spec.ts
│       ├── member-history.spec.ts
│       └── coach-history.spec.ts
└── src/
    ├── lib/api/__tests__/client.test.ts
    ├── middleware.test.ts
    ├── app/api/auth/native/route.test.ts
    ├── app/(auth)/login/login-form.test.tsx
    └── components/history/__tests__/
        ├── history-list-view.test.tsx
        ├── assignment-detail-view.test.tsx
        └── exercise-progress-view.test.tsx
```

**Convención**: tests unitarios/integración colocalizados con el archivo que testean (en `__tests__/` adyacente o `*.test.ts(x)` al lado). Tests E2E siempre en `tests/e2e/`.

## MSW: handlers y overrides por test

Los `handlers.ts` definen respuestas happy-path para todos los endpoints críticos. Para sobrescribir en un test específico:

```typescript
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/msw/server' // o ruta relativa

it('maneja error 500', async () => {
  server.use(
    http.get('http://localhost:8080/api/gyms/:gymId/member/routine', () =>
      HttpResponse.json({ message: 'Error interno' }, { status: 500 })
    )
  )
  // ... el handler se resetea automáticamente después del test (afterEach)
})
```

`afterEach(() => server.resetHandlers())` está configurado en `vitest.setup.ts`.

## Factories

Usar las factories de `tests/utils/factories.ts` para crear DTOs con defaults razonables y solo sobrescribir lo relevante:

```typescript
import { aAssignmentSummary, aExerciseProgress } from '@/tests/utils/factories'

const active = aAssignmentSummary({ isActive: true, templateName: 'Mi Rutina' })
const past = aAssignmentSummary({ isActive: false, id: 2 })
```

## Convenciones RTL

- Queries por rol semántico: `getByRole`, `getByLabelText`, `getByText`
- Evitar `getByTestId` salvo que no haya alternativa semántica
- Usar `userEvent` (no `fireEvent`) para simular interacciones reales
- Para acciones asíncronas: `await waitFor(...)` o `await user.click(...)` (auto-act)

```typescript
const user = userEvent.setup()
await user.type(screen.getByLabelText(/email/i), 'test@test.com')
await user.click(screen.getByRole('button', { name: /ingresar/i }))
await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/select-gym'))
```

## Cómo escribir un E2E

1. Usar `loginAsMember(page)` o `loginAsCoach(page)` de `tests/utils/playwright-fixtures.ts`
2. Usar `page.route()` para sobrescribir respuestas del mock server para casos específicos del browser
3. El mock API server (puerto 4001, arrancado en `global-setup.ts`) maneja el SSR server-side

```typescript
import { test, expect } from '@playwright/test'
import { loginAsMember } from '../utils/playwright-fixtures'

test('mi flujo', async ({ page }) => {
  await loginAsMember(page)
  await page.goto('/gym/1/member/routine')
  await page.waitForLoadState('networkidle')

  // Override browser-side call para este test
  await page.route('**/tracking/complete', route =>
    route.fulfill({ json: { success: true } })
  )

  await page.getByRole('button', { name: /completar/i }).click()
  await expect(page.getByText(/ejercicio completado/i)).toBeVisible()
})
```

## Agregar coverage para áreas nuevas

1. Crear el test colocalizdo con el archivo (`src/mi-modulo/__tests__/mi-modulo.test.ts`)
2. Importar factories de `tests/utils/factories.ts` y agregar el DTO si no existe
3. Si el componente hace fetch: agregar el handler en `tests/msw/handlers.ts`
4. Si es server-only (usa `next/headers`, `cookies()`): mockear con `vi.mock('next/headers', ...)`

## Variables de entorno en tests

| Variable | Valor en tests unitarios | Valor en E2E |
|----------|-------------------------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` (MSW intercepta) | `http://localhost:4001` (mock server real) |
| `API_INTERNAL_URL` | — | `http://localhost:4001` |
| `NEXT_PUBLIC_SUPABASE_URL` | — | `http://localhost:54321` (fake) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | — | `fake-anon-key-for-e2e` |
