#!/bin/bash
# ─── Reset BD de desarrollo ───────────────────────
# Elimina todos los datos y re-ejecuta Flyway migrations
# Uso: ./scripts/reset-dev-db.sh

set -e

DB_CONTAINER="sgg-postgres-1"
DB_NAME="sgg_dev"
DB_USER="sgg_admin"

echo "⚠️  Esto va a BORRAR todos los datos de la BD de desarrollo ($DB_NAME)"
read -p "¿Continuar? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado."
    exit 0
fi

echo "→ Dropeando y recreando $DB_NAME..."
docker exec $DB_CONTAINER psql -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" > /dev/null 2>&1
docker exec $DB_CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
docker exec $DB_CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "→ Reiniciando API para que Flyway re-ejecute las migraciones..."
docker restart sgg-api-1

echo "→ Esperando a que la API arranque..."
sleep 5
for i in $(seq 1 30); do
    if docker logs sgg-api-1 2>&1 | tail -5 | grep -q "Started SggApplication"; then
        echo "✓ API lista"
        break
    fi
    sleep 2
done

echo "✓ BD de desarrollo reseteada. Flyway habrá recreado las tablas."
echo "  Ahora podés ejecutar: ./scripts/seed-dev-db.sh"
