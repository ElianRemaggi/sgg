# Setup Inicial — SGG

Seguí este documento la primera vez que clonás el repo o configurás el entorno.

---

## Requisitos Previos (WSL2)

```bash
# Verificar que estás en WSL2 (no en /mnt/c/)
pwd   # debe mostrar algo como /home/tu-usuario/...

# Java 21
java -version   # debe mostrar openjdk 21

# Maven
mvn -version

# Node 20+
node -version

# Docker (via Docker Desktop con integración WSL2)
docker -version
docker-compose -version

# Expo CLI
npm install -g eas-cli
```

Si falta alguno:
```bash
# Java 21 en WSL2 Ubuntu
sudo apt install openjdk-21-jdk

# Maven
sudo apt install maven

# Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Primer Setup del Proyecto

```bash
# 1. Clonar en filesystem WSL2 (NO en /mnt/c/)
mkdir -p ~/projects
cd ~/projects
git clone <tu-repo-url> sgg
cd sgg

# 2. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales de Supabase

# 3. Levantar la base de datos
docker-compose up postgres -d

# 4. Verificar que la BD está lista
docker-compose logs postgres
# Esperar mensaje: "database system is ready to accept connections"

# 5. Levantar el backend (primera vez: descarga dependencias ~3-5 min)
docker-compose up api

# 6. En otra terminal: levantar el frontend web
docker-compose up web

# 7. En otra terminal: iniciar la app móvil
cd sgg-app
npm install
npx expo start
# Si hay problemas de red: npx expo start --tunnel
```

---

## Configurar Supabase (Cloud)

1. Ir a https://supabase.com y crear un proyecto nuevo
2. En **Authentication → Providers**: habilitar Google OAuth
   - Necesitás un Client ID y Secret de Google Cloud Console
3. En **Project Settings → API**: copiar
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. En **Project Settings → API → JWT Settings**: copiar
   - La URL JWKS: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` → `SUPABASE_JWKS_URI`

---

## Crear el Primer SUPERADMIN

Después de que el sistema esté corriendo:

```bash
# 1. Registrarte en la app o panel web con tu cuenta
# 2. Buscar tu supabase_uid en la BD
docker exec -it sgg-postgres-1 psql -U sgg_admin -d sgg -c \
  "SELECT id, email, supabase_uid FROM users WHERE email = 'tu@email.com';"

# 3. Asignarte SUPERADMIN directamente en BD (primera vez)
docker exec -it sgg-postgres-1 psql -U sgg_admin -d sgg -c \
  "UPDATE users SET platform_role = 'SUPERADMIN' WHERE email = 'tu@email.com';"

# 4. Verificar
docker exec -it sgg-postgres-1 psql -U sgg_admin -d sgg -c \
  "SELECT email, platform_role FROM users WHERE platform_role = 'SUPERADMIN';"
```

A partir de acá, podés promover otros superadmins desde el panel web en `/platform/admins`.

---

## Verificar que Todo Funciona

```bash
# API health check
curl http://localhost:8080/api/public/health
# Respuesta esperada: {"status": "UP"}

# Panel web
# Abrir http://localhost:3000 en el browser de Windows

# App móvil
# Escanear el QR de Expo Go desde tu teléfono
# O usar el emulador: presionar 'a' para Android, 'i' para iOS

# BD
# Conectarse con DBeaver: host=localhost, port=5432, db=sgg, user=sgg_admin
```

---

## Estructura de Desarrollo Diario

```bash
# Terminal 1: Stack completo
docker-compose up

# Terminal 2: App móvil
cd sgg-app && npx expo start

# Terminal 3: Comandos varios (git, migraciones, tests)
cd ~/projects/sgg

# Correr tests del backend
cd sgg-api && mvn test

# Ver logs de la API en tiempo real
docker-compose logs -f api
```

---

## Flyway — Migraciones

Las migraciones se ejecutan automáticamente al iniciar el backend.
El orden es el siguiente para la primera vez:

```
V1  → users
V2  → auth_identities
V3  → gyms
V4  → gym_members
V5  → coach_assignments
V6  → routine_templates
V7  → template_blocks
V8  → template_exercises
V9  → routine_assignments
V10 → exercise_completions
V11 → schedule_activities
V12 → indexes
```

Para agregar una nueva migración:
```bash
# Crear el archivo con el siguiente número
touch sgg-api/src/main/resources/db/migration/V13__descripcion.sql
# Editar el SQL
# Reiniciar la API: docker-compose restart api
```

---

## Troubleshooting

**La API no arranca:**
```bash
docker-compose logs api
# Buscar "APPLICATION FAILED TO START"
# Verificar variables de entorno en .env
# Verificar que postgres está healthy: docker-compose ps
```

**Flyway falla:**
```bash
# Ver el error específico
docker-compose logs api | grep -A 5 "FlywayException"
# Nunca editar migraciones ya ejecutadas
# Si el error es de una migración nueva: revisar el SQL
```

**Puerto ya en uso:**
```bash
# Verificar qué ocupa el puerto
sudo lsof -i :8080
sudo lsof -i :5432
# Matar el proceso o cambiar el puerto en override.yml
```

**Expo no conecta en WSL2:**
```bash
npx expo start --tunnel
# Si falla el tunnel: npm install -g @expo/ngrok
```
