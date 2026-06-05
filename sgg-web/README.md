# sgg-web — Panel Web de SGG

Panel de administración y gestión para gimnasios, construido con **Next.js 14 App Router**.

---

## Desarrollo local

```bash
npm install
npm run dev        # Corre en http://localhost:3000
```

O vía Docker (stack completo):

```bash
# Desde la raíz del monorepo
docker-compose up
```

---

## Variables de entorno

Copiar `.env.example` en la raíz del monorepo y completar:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL del backend (default: `http://localhost:8080`) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server-side, nunca exponer) |

---

## Tests

```bash
npm test                  # Unit/integration (Vitest)
npm run test:watch        # Watch mode
npm run test:coverage     # Con cobertura
npm run test:e2e          # E2E (Playwright)
npx playwright install chromium  # Instalar browser para E2E (una sola vez)
```

---

## Despliegue a producción

La producción corre en Docker Compose detrás de un tunnel Cloudflared:

```bash
# Desde la raíz del monorepo
docker-compose -f docker-compose.yml up --build -d
```

Ver `docs/infrastructure/INFRA.md` para detalles de infraestructura.
