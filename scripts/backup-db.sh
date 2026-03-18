#!/bin/bash
# scripts/backup-db.sh
# Hace un backup de la BD y lo guarda en backups/

set -e

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="${BACKUP_DIR}/sgg_${TIMESTAMP}.sql"

echo "🔄 Haciendo backup de la BD..."

docker exec sgg-postgres-1 pg_dump \
  -U sgg_admin \
  -d sgg \
  --no-password \
  > "$FILENAME"

echo "✅ Backup guardado en: $FILENAME"
echo "   Tamaño: $(du -h "$FILENAME" | cut -f1)"

# Mantener solo los últimos 10 backups
ls -t "$BACKUP_DIR"/*.sql | tail -n +11 | xargs -r rm
echo "   Backups anteriores limpiados (se mantienen los últimos 10)"
