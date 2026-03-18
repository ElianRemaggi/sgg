#!/bin/bash
# scripts/new-migration.sh
# Uso: ./scripts/new-migration.sh "descripcion_de_la_migracion"

set -e

if [ -z "$1" ]; then
  echo "❌ Uso: $0 <descripcion>"
  echo "   Ejemplo: $0 add_notes_to_exercises"
  exit 1
fi

MIGRATION_DIR="sgg-api/src/main/resources/db/migration"

# Encontrar el próximo número de versión
LAST=$(ls "$MIGRATION_DIR"/V*.sql 2>/dev/null | \
  grep -oP 'V\K[0-9]+' | sort -n | tail -1)

if [ -z "$LAST" ]; then
  NEXT=1
else
  NEXT=$((LAST + 1))
fi

FILENAME="${MIGRATION_DIR}/V${NEXT}__${1}.sql"

cat > "$FILENAME" << EOF
-- Migración V${NEXT}: ${1}
-- Fecha: $(date +%Y-%m-%d)

-- TODO: Escribir el SQL aquí

EOF

echo "✅ Migración creada: $FILENAME"
echo "   Editá el archivo y reiniciá la API para aplicarla."
