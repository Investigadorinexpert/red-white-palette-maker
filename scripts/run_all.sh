#!/usr/bin/env bash
# run_all.sh — Full-stack launcher (Backend + Vite + Kong) [ONE_ENTRY only]

set -Eeuo pipefail

# ── Paths & Logs ───────────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"; mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
KONG_LOG="$LOG_DIR/kong.log"
KONG_DIR="$ROOT_DIR/kong"

# ── Puertos fijos ─────────────────────────────────────────────────────────────
export FRONTEND_PORT=45855
export BACKEND_PORT=35669

# ── Defaults ──────────────────────────────────────────────────────────────────
DEBUG_FLAG="${DEBUG_FLAG:-1}"
export PYTHONUNBUFFERED=1
export STRIP_PATH=false                 # el backend ya expone /api
export VITE_PROXY_TARGET="http://127.0.0.1:8000"
export VITE_PORT="$FRONTEND_PORT"
export BFF_DEBUG="${BFF_DEBUG:-$DEBUG_FLAG}"
export LOG_LEVEL="${LOG_LEVEL:-$( [ "$DEBUG_FLAG" = "1" ] && echo DEBUG || echo INFO )}"

fuser -k ${BACKEND_PORT}/tcp 2>/dev/null || true
fuser -k ${VITE_PORT}/tcp 2>/dev/null || true


# Rate limiting (boolean real en YAML)
RAW_RATE="${ENABLE_RATE_LIMITING:-0}"
shopt -s nocasematch
if [[ "$RAW_RATE" == 1 || "$RAW_RATE" == "true" || "$RAW_RATE" == "yes" ]]; then
  RATE_ENABLED=true
else
  RATE_ENABLED=false
fi
shopt -u nocasematch

# ── Carga .env del backend (si existiera) ─────────────────────────────────────
[[ -f "$ROOT_DIR/backend/.env" ]] && { set -a; source "$ROOT_DIR/backend/.env"; set +a; }

# ── Descubre upstream host para Kong (Linux usa gateway Docker) ───────────────
OS_UNAME="$(uname -s || echo Linux)"
if [[ "$OS_UNAME" == "Linux" ]]; then
  GATEWAY_IP="$(ip route 2>/dev/null | awk '/default/ {print $3; exit}')"
  export KONG_UPSTREAM_HOST="host.docker.internal"
fi


# ── kong.yml (DB-less) ────────────────────────────────────────────────────────
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
        strip_path: ${STRIP_PATH}    # false -> backend recibe /api/...

  - name: spa
    url: http://${KONG_UPSTREAM_HOST}:${FRONTEND_PORT}
    routes:
      - name: spa-root
        paths: ["/"]
        strip_path: false
        methods: ["GET", "HEAD"]

plugins:
  - name: request-size-limiting
    config: { allowed_payload_size: 10 }
  - name: rate-limiting
    enabled: ${RATE_ENABLED}
    config: { minute: 600, policy: local }
  - name: request-transformer
    service: spa
    config:
      remove:
        headers: ["cookie"]
EOF

# ── docker-compose.yml (buffers grandes para cookies/headers) ─────────────────
cat > "$KONG_DIR/docker-compose.yml" <<'EOF'
services:
  kong:
    image: kong:3.6
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_LISTEN: "0.0.0.0:8000"
      KONG_ADMIN_LISTEN: "0.0.0.0:8001"

      # Evitar 400 "Request header or cookie too large" en dev:
      # Puedes usar scope http o proxy; habilitamos ambos por si la imagen/scope cambia.
      KONG_NGINX_PROXY_LARGE_CLIENT_HEADER_BUFFERS: "8 32k"
      KONG_NGINX_HTTP_LARGE_CLIENT_HEADER_BUFFERS: "8 32k"
      # Opcional adicional (normalmente no hace falta):
      # KONG_NGINX_PROXY_CLIENT_HEADER_BUFFER_SIZE: "16k"
      # KONG_NGINX_HTTP_CLIENT_HEADER_BUFFER_SIZE: "16k"

    extra_hosts:
      - "host.docker.internal:host-gateway"
    volumes:
      - ./kong.yml:/kong/kong.yml:ro
    ports:
      - "8000:8000"
      - "8001:8001"
    healthcheck:
      test: ["CMD", "kong", "health"]
      interval: 5s
      timeout: 3s
      retries: 40
EOF

# ── Backend ───────────────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Backend :$BACKEND_PORT → $BACKEND_LOG" | tee -a "$BACKEND_LOG"
( cd "$ROOT_DIR" && stdbuf -oL -eL uvicorn backend.app.main:app \
  --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) >>"$BACKEND_LOG" 2>&1 &

# ── Frontend (Vite) ───────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Frontend :$VITE_PORT (proxy=$VITE_PROXY_TARGET) → $FRONTEND_LOG" | tee -a "$FRONTEND_LOG"
( cd "$ROOT_DIR" && stdbuf -oL -eL npm run dev -- --host 0.0.0.0 --port "$VITE_PORT" --strictPort ) >>"$FRONTEND_LOG" 2>&1 &

# ── Kong up ───────────────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Kong up (docker-compose) → $KONG_LOG" | tee -a "$KONG_LOG"
( cd "$KONG_DIR" && docker compose up -d --remove-orphans ) >>"$KONG_LOG" 2>&1 || true
docker compose -f "$KONG_DIR/docker-compose.yml" ps >>"$KONG_LOG" 2>&1 || true

# Reload si ya estaba
docker exec -it $(docker compose -f "$KONG_DIR/docker-compose.yml" ps -q kong) kong reload >/dev/null 2>&1 || true

# ── Health checks ─────────────────────────────────────────────────────────────
echo "[$(date -Is)] [INFO] Waiting backend @:$BACKEND_PORT /api/_echo" | tee -a "$BACKEND_LOG"
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/_echo" >/dev/null; then
    echo "[$(date -Is)] [OK] Backend ready" | tee -a "$BACKEND_LOG"; break
  fi; sleep 0.8
done

echo "[$(date -Is)] [INFO] Waiting kong proxy @:8000 /api/_debug" | tee -a "$KONG_LOG"
COOKIE_ERR_HINT_SHOWN=0
for i in $(seq 1 90); do
  code="$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/_debug" || true)"
  case "$code" in
    200) echo "[$(date -Is)] [OK] Kong→Backend ready" | tee -a "$KONG_LOG"; break ;;
    400)
      echo "[$(date -Is)] [INFO] Kong probe http_code=400" | tee -a "$KONG_LOG"
      if [[ "$COOKIE_ERR_HINT_SHOWN" -eq 0 ]]; then
        MSG="$(curl -s http://127.0.0.1:8000/api/_debug | head -c 400 || true)"
        if echo "$MSG" | grep -qi "cookie too large"; then
          echo "[$(date -Is)] [HINT] Cookies grandes → borra cookies de 'localhost' y de tu IP en DevTools (Application/Storage) y recarga." | tee -a "$KONG_LOG"
          COOKIE_ERR_HINT_SHOWN=1
        fi
      fi
      ;;
    502) echo "[$(date -Is)] [WARN] 502 (upstream no listo) – reintento..." | tee -a "$KONG_LOG" ;;
    000) echo "[$(date -Is)] [INFO] Kong aún arrancando (code=000)..." | tee -a "$KONG_LOG" ;;
    *)   echo "[$(date -Is)] [INFO] Kong probe http_code=$code" | tee -a "$KONG_LOG" ;;
  esac; sleep 0.8
done

curl -s "http://127.0.0.1:8000/api/_debug" >>"$KONG_LOG" 2>&1 || true
echo | tee -a "$KONG_LOG"

[[ "$DEBUG_FLAG" != "1" ]] && echo "[$(date -Is)] [SEC] Prod: no expongas 8001 públicamente y usa TLS/HSTS" | tee -a "$KONG_LOG"

echo "[$(date -Is)] [INFO] Tailing logs (Ctrl+C para cortar)" | tee -a "$KONG_LOG"
tail -n+1 -F "$BACKEND_LOG" "$FRONTEND_LOG" "$KONG_LOG"
