# Infraestructura — Docker + WSL2 + Cloudflared

---

## Estructura de Archivos

```
sgg/
├── docker-compose.yml              # Producción (base)
├── docker-compose.override.yml     # Desarrollo (se aplica automáticamente)
├── .env.example                    # Plantilla de variables
├── .env                            # Variables reales (en .gitignore)
├── sgg-api/Dockerfile
└── sgg-web/Dockerfile
```

---

## docker-compose.yml (Producción)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sgg
      POSTGRES_USER: sgg_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg-data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U sgg_admin -d sgg"]
      interval: 10s
      timeout: 5s
      retries: 5
    # NO expone puerto en producción

  api:
    build:
      context: ./sgg-api
      dockerfile: Dockerfile
      target: production
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/sgg
      SPRING_DATASOURCE_USERNAME: sgg_admin
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      SUPABASE_JWKS_URI: ${SUPABASE_JWKS_URI}
      APP_CORS_WEB_ORIGIN: https://web.tudominio.com
      SPRING_PROFILES_ACTIVE: prod
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  web:
    build:
      context: ./sgg-web
      dockerfile: Dockerfile
      target: production
    environment:
      NEXT_PUBLIC_API_URL: https://api.tudominio.com
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  pg-data:
```

---

## docker-compose.override.yml (Desarrollo)

Se aplica AUTOMÁTICAMENTE cuando corrés `docker-compose up` sin flags.

```yaml
version: '3.8'

services:
  postgres:
    ports:
      - "5432:5432"   # Exponer para conectarse con DBeaver / IntelliJ

  api:
    build:
      target: development
    volumes:
      - ./sgg-api:/workspace
      - ~/.m2:/root/.m2   # Cachear dependencias Maven entre rebuilds
    environment:
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DEVTOOLS_RESTART_ENABLED: "true"
      APP_CORS_WEB_ORIGIN: http://localhost:3000
      APP_CORS_ALLOWED_ORIGINS: http://localhost:8081,exp://localhost:8081

  web:
    volumes:
      - ./sgg-web:/app
      - /app/node_modules         # Previene que el bind mount pise node_modules
      - /app/.next
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080
```

---

## sgg-api/Dockerfile

```dockerfile
# Stage: dependencias (se cachea si pom.xml no cambia)
FROM maven:3.9-eclipse-temurin-21 AS deps
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Stage: build (producción)
FROM deps AS builder
COPY src ./src
RUN mvn package -DskipTests -q

# Stage: runtime (imagen final liviana)
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app
COPY --from=builder /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]

# Stage: desarrollo (con Maven para hot reload)
FROM deps AS development
WORKDIR /workspace
EXPOSE 8080
CMD ["mvn", "spring-boot:run", \
     "-Dspring-boot.run.jvmArguments=-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"]
```

---

## sgg-web/Dockerfile

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time env vars (las NEXT_PUBLIC_ se embeben en el build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**Requiere en `next.config.js`:**
```javascript
module.exports = { output: 'standalone' }
```

---

## .env.example

```bash
# Base de datos
DB_PASSWORD=

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWKS_URI=https://xxx.supabase.co/auth/v1/.well-known/jwks.json

# Dominio (producción)
WEB_DOMAIN=web.tudominio.com
API_DOMAIN=api.tudominio.com
```

---

## Cloudflared

Instalar en el servidor Ubuntu:

```bash
# Instalar cloudflared
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Autenticar con cuenta Cloudflare
cloudflared tunnel login

# Crear tunnel
cloudflared tunnel create sgg-tunnel

# Configurar (~/.cloudflared/config.yml)
tunnel: <TUNNEL_ID>
credentials-file: /home/ubuntu/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.tudominio.com
    service: http://localhost:8080
  - hostname: web.tudominio.com
    service: http://localhost:3000
  - service: http_status:404

# Instalar como servicio systemd
cloudflared service install

# Iniciar
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## Comandos de Operación

```bash
# DESARROLLO — levantar todo (con override automático)
cd ~/projects/sgg
docker-compose up

# Solo la BD (cuando desarrollás la API fuera de Docker)
docker-compose up postgres

# Reconstruir un servicio específico
docker-compose up --build api

# PRODUCCIÓN — deploy completo
git pull
docker-compose -f docker-compose.yml up --build -d

# Ver logs
docker-compose logs -f api
docker-compose logs -f web

# Bajar y limpiar (cuidado: sin -v no borra volúmenes)
docker-compose down
docker-compose down -v   # ⚠️ borra la BD también

# Backup de BD
docker exec sgg-postgres-1 pg_dump -U sgg_admin sgg > backup_$(date +%Y%m%d).sql

# Restaurar BD
cat backup_20260101.sql | docker exec -i sgg-postgres-1 psql -U sgg_admin -d sgg
```

---

## WSL2 — Configuraciones Recomendadas

### .wslconfig (en C:\Users\TuUsuario\.wslconfig)
```ini
[wsl2]
memory=8GB
processors=4
swap=4GB
```

### Ubicación del repo
```bash
# ✅ Correcto: filesystem de WSL2
~/projects/sgg

# ❌ Incorrecto: filesystem de Windows (muy lento para I/O)
/mnt/c/Users/TuUsuario/projects/sgg
```

### Docker Desktop
- Habilitar: Settings → Resources → WSL Integration → Ubuntu
- Habilitar: Settings → General → Use the WSL 2 based engine

---

## Scripts de Deploy

### Setup inicial del servidor

Ejecutar **en el servidor** Ubuntu:
```bash
bash server-setup.sh
```

Instala Docker, Docker Compose, Git, clona el repo, crea `.env`, configura cron de backups diarios (3 AM), y verifica Cloudflared.

### Deploy desde máquina local

```bash
# Configurar (una sola vez)
export SGG_SERVER=ubuntu@tu-servidor
export SGG_REMOTE_DIR=/home/ubuntu/sgg

# Deploy completo: push → pull → build → restart → health check
./scripts/deploy.sh

# Deploy rápido (sin rebuild de imágenes Docker)
./scripts/deploy.sh --quick

# Ver estado de servicios
./scripts/deploy.sh --status

# Ver logs en vivo
./scripts/deploy.sh --logs

# Rollback al commit anterior (con backup de BD automático)
./scripts/deploy.sh --rollback
```

**Flujo del deploy completo:**
1. Verifica que no hay cambios locales sin commitear
2. `git push` al repositorio
3. SSH al servidor → `git pull`
4. Backup automático de BD
5. `docker compose -f docker-compose.yml up --build -d`
6. Health check: espera hasta 60s que `/actuator/health` responda
7. Muestra estado final de servicios

---

## Problemas Comunes WSL2

| Problema | Causa | Solución |
|---------|-------|---------|
| `docker: command not found` | Docker Desktop sin integración WSL2 | Settings → WSL Integration |
| Permisos 777 en todos los archivos | Repo en `/mnt/c/` | Mover a `~/projects/` |
| Expo no conecta al dispositivo | Red WSL2 aislada | `npx expo start --tunnel` |
| API lenta en dev | Bind mount en `/mnt/c/` | Usar filesystem WSL2 |
| Puerto 5432 ocupado | PostgreSQL local en Windows | `sudo service postgresql stop` en WSL o cambiar puerto en override |
