#!/bin/bash
# scripts/deploy.sh
# Deploy SGG al servidor Ubuntu via SSH
#
# Uso:
#   ./scripts/deploy.sh              # Deploy completo (pull + build + restart)
#   ./scripts/deploy.sh --quick      # Solo pull + restart (sin rebuild)
#   ./scripts/deploy.sh --status     # Ver estado de los servicios
#   ./scripts/deploy.sh --logs       # Ver logs en vivo
#   ./scripts/deploy.sh --rollback   # Rollback al commit anterior

set -euo pipefail

# ─── Configuración ────────────────────────────────
# Editar estos valores o setearlos como variables de entorno
SGG_SERVER="${SGG_SERVER:-usuario@tu-servidor}"
SGG_REMOTE_DIR="${SGG_REMOTE_DIR:-/home/ubuntu/sgg}"
SGG_BRANCH="${SGG_BRANCH:-master}"

# ─── Colores ──────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[deploy]${NC} $1"; }
ok()   { echo -e "${GREEN}[  ok  ]${NC} $1"; }
warn() { echo -e "${YELLOW}[ warn ]${NC} $1"; }
err()  { echo -e "${RED}[error ]${NC} $1"; exit 1; }

# ─── Validaciones ─────────────────────────────────
if [[ "$SGG_SERVER" == "usuario@tu-servidor" ]]; then
  err "Configurá SGG_SERVER antes de usar este script.
  Ejemplo: export SGG_SERVER=ubuntu@mi-server.com
  O editá la variable al inicio de scripts/deploy.sh"
fi

remote() {
  ssh -o ConnectTimeout=10 "$SGG_SERVER" "$@"
}

# ─── Comandos ─────────────────────────────────────

cmd_status() {
  log "Estado de servicios en $SGG_SERVER"
  remote "cd $SGG_REMOTE_DIR && docker compose ps && echo '---' && docker compose logs --tail=5"
}

cmd_logs() {
  log "Logs en vivo (Ctrl+C para salir)"
  remote "cd $SGG_REMOTE_DIR && docker compose logs -f --tail=50"
}

cmd_rollback() {
  log "Rollback al commit anterior..."
  remote "cd $SGG_REMOTE_DIR && git log --oneline -3"
  echo ""
  read -p "Confirmar rollback al commit anterior? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warn "Rollback cancelado"
    exit 0
  fi

  remote bash <<EOF
    set -e
    cd $SGG_REMOTE_DIR
    echo "Haciendo backup de BD antes del rollback..."
    ./scripts/backup-db.sh
    git checkout HEAD~1
    docker compose -f docker-compose.yml up --build -d
    echo "Rollback completado"
    docker compose ps
EOF
  ok "Rollback ejecutado"
}

cmd_quick() {
  log "Deploy rápido (sin rebuild) a $SGG_SERVER"

  remote bash <<EOF
    set -e
    cd $SGG_REMOTE_DIR
    echo ">>> git pull..."
    git pull origin $SGG_BRANCH
    echo ">>> Reiniciando servicios..."
    docker compose -f docker-compose.yml restart
    echo ">>> Estado:"
    docker compose ps
EOF
  ok "Deploy rápido completado"
}

cmd_deploy() {
  log "Deploy completo a $SGG_SERVER"

  # Verificar que no hay cambios locales sin commitear
  if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "Hay cambios locales sin commitear. Commiteá antes de deployar."
    git status --short
    read -p "Continuar de todas formas? [y/N] " -n 1 -r
    echo ""
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
  fi

  # Verificar conexión SSH
  log "Verificando conexión SSH..."
  remote "echo 'Conectado'" || err "No se pudo conectar a $SGG_SERVER"

  # Push local al remote git
  log "Pusheando cambios al repositorio..."
  git push origin "$SGG_BRANCH"

  # Deploy en el servidor
  log "Ejecutando deploy en el servidor..."
  remote bash <<EOF
    set -e
    cd $SGG_REMOTE_DIR

    echo ">>> Backup de BD antes del deploy..."
    ./scripts/backup-db.sh || echo "Skip backup (BD no levantada?)"

    echo ">>> git pull..."
    git pull origin $SGG_BRANCH

    echo ">>> Construyendo y levantando servicios..."
    docker compose -f docker-compose.yml up --build -d

    echo ">>> Esperando que la API levante..."
    for i in {1..30}; do
      if curl -sf http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "API lista!"
        break
      fi
      echo "  Intento \$i/30..."
      sleep 2
    done

    echo ""
    echo ">>> Estado final:"
    docker compose ps
EOF

  ok "Deploy completado exitosamente"
  echo ""
  log "Verificá en tu dominio que todo funcione."
}

# ─── Entry point ──────────────────────────────────
case "${1:-}" in
  --status)   cmd_status ;;
  --logs)     cmd_logs ;;
  --rollback) cmd_rollback ;;
  --quick)    cmd_quick ;;
  *)          cmd_deploy ;;
esac
