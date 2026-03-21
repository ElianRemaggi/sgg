#!/bin/bash
# scripts/server-setup.sh
# Setup inicial del servidor Ubuntu para SGG
#
# Ejecutar EN EL SERVIDOR (no local):
#   curl -sSL <url-raw-de-este-archivo> | bash
#   o copiarlo al servidor y: bash server-setup.sh
#
# Prerequisitos: Ubuntu 22.04+ con acceso SSH y Cloudflared ya configurado

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[setup]${NC} $1"; }
ok()   { echo -e "${GREEN}[  ok ]${NC} $1"; }

# ─── 1. Actualizar sistema ───────────────────────
log "Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
ok "Sistema actualizado"

# ─── 2. Instalar Docker ──────────────────────────
if command -v docker &> /dev/null; then
  ok "Docker ya instalado: $(docker --version)"
else
  log "Instalando Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  ok "Docker instalado. Necesitás hacer logout/login para que el grupo aplique."
fi

# ─── 3. Instalar Docker Compose plugin ───────────
if docker compose version &> /dev/null; then
  ok "Docker Compose ya instalado: $(docker compose version)"
else
  log "Instalando Docker Compose plugin..."
  sudo apt install -y docker-compose-plugin
  ok "Docker Compose instalado"
fi

# ─── 4. Instalar Git ─────────────────────────────
if command -v git &> /dev/null; then
  ok "Git ya instalado: $(git --version)"
else
  log "Instalando Git..."
  sudo apt install -y git
  ok "Git instalado"
fi

# ─── 5. Clonar repo ──────────────────────────────
SGG_DIR="/home/$USER/sgg"
if [[ -d "$SGG_DIR" ]]; then
  ok "Repo ya existe en $SGG_DIR"
else
  log "Clonando repositorio..."
  echo "Ingresá la URL del repo (HTTPS o SSH):"
  read -r REPO_URL
  git clone "$REPO_URL" "$SGG_DIR"
  ok "Repo clonado en $SGG_DIR"
fi

# ─── 6. Crear .env ───────────────────────────────
if [[ -f "$SGG_DIR/.env" ]]; then
  ok ".env ya existe"
else
  log "Creando .env desde template..."
  cp "$SGG_DIR/.env.example" "$SGG_DIR/.env"
  echo ""
  echo "============================================"
  echo "  IMPORTANTE: Editá $SGG_DIR/.env"
  echo "  con los valores reales antes de deployar."
  echo "  nano $SGG_DIR/.env"
  echo "============================================"
  echo ""
fi

# ─── 7. Crear directorio de backups ──────────────
mkdir -p "$SGG_DIR/backups"
ok "Directorio de backups creado"

# ─── 8. Hacer scripts ejecutables ────────────────
chmod +x "$SGG_DIR/scripts/"*.sh
ok "Scripts marcados como ejecutables"

# ─── 9. Configurar cron para backups diarios ─────
CRON_JOB="0 3 * * * cd $SGG_DIR && ./scripts/backup-db.sh >> /var/log/sgg-backup.log 2>&1"
if crontab -l 2>/dev/null | grep -q "sgg.*backup-db"; then
  ok "Cron de backup ya configurado"
else
  log "Configurando backup diario (3 AM)..."
  (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
  ok "Cron de backup configurado"
fi

# ─── 10. Verificar Cloudflared ────────────────────
if command -v cloudflared &> /dev/null; then
  ok "Cloudflared instalado: $(cloudflared --version)"
  if systemctl is-active --quiet cloudflared 2>/dev/null; then
    ok "Cloudflared corriendo como servicio"
  else
    echo ""
    log "Cloudflared instalado pero no corriendo como servicio."
    log "Si ya lo configuraste, inicialo con:"
    log "  sudo systemctl start cloudflared"
    log "  sudo systemctl enable cloudflared"
  fi
else
  echo ""
  log "Cloudflared NO instalado. Instalalo siguiendo docs/infrastructure/INFRA.md"
fi

# ─── Resumen ──────────────────────────────────────
echo ""
echo "============================================"
echo "  Setup completado!"
echo ""
echo "  Próximos pasos:"
echo "  1. nano $SGG_DIR/.env  (completar valores)"
echo "  2. Verificar Cloudflared config"
echo "  3. cd $SGG_DIR && docker compose -f docker-compose.yml up --build -d"
echo "============================================"
