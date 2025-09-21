#!/usr/bin/env bash
# run_all.sh — Full-stack launcher (Backend + Vite + Kong) [ONE_ENTRY only]
# SPA + API behind Kong (same-origin). Dev-friendly, Linux-safe.

set -Eeuo pipefail

# ─── Paths & Logs ─────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$ROOT_DIR/logs/frontend.log"
KONG_LOG="$ROOT_DIR/logs/kong.log"

# ─── Defaults (override with env) ─────────────────────────────────────────────
DEBUG_FLAG="${DEBUG_FLAG:-1}"
export PYTHONUNBUFFERED=1
export FRONTEND_PORT="${FRONTEND_PORT:-45855}"
export BACKEND_PORT="${BACKEND_PORT:-35669}"
export STRIP_PATH="${STRIP_PATH:-false}"     # backend ya sirve con /api
export VITE_PROXY_TARGET="${VITE_PROXY_TARGET:-http://localhost:8000}"
export VITE_PORT="${VITE_PORT:-$FRONTEND_PORT}"
export BFF_DEBUG="${BFF_DEBUG:-$DEBUG_FLAG}"
export LOG_LEVEL="${LOG_LEVEL:-$( [ "$DEBUG_FLAG" = "1" ] && echo DEBUG || echo INFO )}"
export ENABLE_RATE_LIMITING="${ENABLE_RATE_LIMITING:-0}"   # evita 429 en dev

# ─── Load backend .env (si existe) ────────────────────────────────────────────
[[ -f "$ROOT_DIR/backend/.env" ]] && { set -a; source "$ROOT_DIR/backend/.env"; set +a; }

# ─── Upstream host para Kong (Linux usa gateway Docker) ───────────────────────
OS_UNAME="$(uname -s || echo Linux)"
if [[ "$OS_UNAME" == "Linux" ]]; then
  GATEWAY_IP="$(ip route | awk '/default/ {print $3; exit}')"
  export KONG_UPSTREAM_HOST="${GATEWAY_IP:-172.17.0.1}"
else
  export KONG_UPSTREAM_HOST="host.docker.internal"
fi

# ─── Generar kong.yml (ONE_ENTRY) ─────────────────────────────────────────────
KONG_DIR="$ROOT_DIR/kong"
mkdir -p "$KONG_DIR"
echo "[$(date -Is)] [INFO] Generating kong.yml (UPSTREAM=$KONG_UPSTREAM_HOST, STRIP_PATH=$STRIP_PATH)" | tee -a "$KONG_LOG"
cat > "$KONG_DIR/kong.yml" <<EOF
_format_version: "3.0"
_transform: true

services:
  - name: bff
    url: http://${KONG_UPSTREAM_HOST}:${BACKEND_PORT}
    routes:
      - name: bff-api
        paths: ["/api"]
        strip_path: ${STRIP_PATH}

  - name: spa
    url: http://${KONG_UPSTREAM_HOST}:${FRONTEND_PORT}
    routes:
      - name: spa-root
        paths: ["/"]
        strip_path: false
        methods: ["GET"]

plugins:
  - name: request-size-limiting
    config: { allowed_payload_size: 10 }
  - name: rate-limiting
    enabled: ${ENABLE_RATE_LIMITING}
    config: { minute: 600, policy: local }
EOF

# ─── Lanzar backend ───────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Backend :$BACKEND_PORT → $BACKEND_LOG" | tee -a "$BACKEND_LOG"
( cd "$ROOT_DIR" && stdbuf -oL -eL uvicorn backend.app.main:app \
  --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) >>"$BACKEND_LOG" 2>&1 &

# ─── Lanzar frontend (Vite) ──────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Frontend :$VITE_PORT (proxy=$VITE_PROXY_TARGET) → $FRONTEND_LOG" | tee -a "$FRONTEND_LOG"
( cd "$ROOT_DIR" && stdbuf -oL -eL npm run dev -- \
  --host 0.0.0.0 --port "$VITE_PORT" --strictPort ) >>"$FRONTEND_LOG" 2>&1 &

# ─── Kong (docker compose) ────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Kong up (docker-compose) → $KONG_LOG" | tee -a "$KONG_LOG"
( cd "$KONG_DIR" && docker compose up -d --remove-orphans ) >>"$KONG_LOG" 2>&1 || true

# Reload por si ya estaba arriba
docker exec -it kong-kong-1 kong reload >/dev/null 2>&1 || true

# ─── Health checks (concretos) ────────────────────────────────────────────────
# 1) Backend directo
echo "[$(date -Is)] [INFO] Waiting backend @:$BACKEND_PORT /api/_debug" | tee -a "$BACKEND_LOG"
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/_debug" >/dev/null; then
    echo "[$(date -Is)] [OK] Backend ready" | tee -a "$BACKEND_LOG"; break
  fi
  sleep 0.8
done

# 2) Kong → Backend
echo "[$(date -Is)] [INFO] Waiting kong proxy @:8000 /api/_debug" | tee -a "$KONG_LOG"
for i in $(seq 1 40); do
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/_debug" || true)"
  case "$code" in
    200) echo "[$(date -Is)] [OK] Kong→Backend ready" | tee -a "$KONG_LOG"; break ;;
    502) echo "[$(date -Is)] [WARN] 502 (upstream not ready) – retrying..." | tee -a "$KONG_LOG" ;;
    429) echo "[$(date -Is)] [WARN] 429 (rate-limited) – backing off..." | tee -a "$KONG_LOG"; sleep 2 ;;
    *)   echo "[$(date -Is)] [INFO] Kong probe http_code=$code" | tee -a "$KONG_LOG" ;;
  esac
  sleep 0.8
done

# Dump resultado si está disponible
curl -s "http://127.0.0.1:8000/api/_debug" >>"$KONG_LOG" 2>&1 || true
echo | tee -a "$KONG_LOG"

# ─── Tips seguridad prod (solo log) ───────────────────────────────────────────
if [[ "$DEBUG_FLAG" != "1" ]]; then
  echo "[$(date -Is)] [SEC] Prod: no expongas Admin (8001) a 0.0.0.0 y usa TLS/HSTS" | tee -a "$KONG_LOG"
fi

# ─── Tail centralizado ────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Tailing logs (Ctrl+C para cortar)" | tee -a "$KONG_LOG"
tail -n+1 -F "$BACKEND_LOG" "$FRONTEND_LOG" "$KONG_LOG"
