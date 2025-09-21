#!/usr/bin/env bash
# run_all.sh — Full-stack launcher (Backend + Vite + Kong)
# Modes:
#   MODE=ONE_ENTRY (default): SPA y API vía Kong (same-origin; CORS casi no aplica)
#   MODE=SPLIT: SPA en Vite (FRONTEND_PORT) y API vía Kong (:8000/api) con CORS en Kong
# Strip path:
#   STRIP_PATH=false por defecto; pon true si tu backend NO usa prefijo /api en sus rutas

set -Eeuo pipefail

### ───── Paths & Logs ──────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

### ───── Defaults (override con env) ──────────────────────────────────────────
DEBUG_FLAG="${DEBUG_FLAG:-1}"
export PYTHONUNBUFFERED=1

export FRONTEND_PORT="${FRONTEND_PORT:-45855}"
export BACKEND_PORT="${BACKEND_PORT:-35669}"

export MODE="${MODE:-ONE_ENTRY}"          # ONE_ENTRY | SPLIT
export STRIP_PATH="${STRIP_PATH:-false}"   # true si el backend no tiene /api
export ENABLE_CORS_CREDENTIALS="${ENABLE_CORS_CREDENTIALS:-1}" # SPLIT only

# CORS extras (separadas por coma) solo si MODE=SPLIT
# ejemplo: EXTRA_ORIGINS="https://staging.tuapp.com,https://app.tuempresa.com"
export EXTRA_ORIGINS="${EXTRA_ORIGINS:-}"

# Vite proxy siempre hacia Kong para /api (consistente en ambos modos)
export VITE_PROXY_TARGET="${VITE_PROXY_TARGET:-http://localhost:8000}"
export VITE_PORT="${VITE_PORT:-$FRONTEND_PORT}"

# Logging
export BFF_DEBUG="${BFF_DEBUG:-$DEBUG_FLAG}"
export LOG_FILE="${LOG_FILE:-$LOG_DIR/backend.log}"
export LOG_LEVEL="${LOG_LEVEL:-$( [ "$DEBUG_FLAG" = "1" ] && echo DEBUG || echo INFO )}"

### ───── Load backend .env si existe ──────────────────────────────────────────
if [[ -f "$ROOT_DIR/backend/.env" ]]; then
  set -a; source "$ROOT_DIR/backend/.env"; set +a
fi

### ───── Generate kong.yml dinámico ───────────────────────────────────────────
KONG_DIR="$ROOT_DIR/kong"
mkdir -p "$KONG_DIR"

echo "[run] generating kong/kong.yml (MODE=$MODE, STRIP_PATH=$STRIP_PATH)"

if [[ "$MODE" == "ONE_ENTRY" ]]; then
  # Navega a http://localhost:8000/ (Kong sirve / y /api)
  cat > "$KONG_DIR/kong.yml" <<EOF
_format_version: "3.0"
_transform: true

services:
  - name: bff
    url: http://host.docker.internal:${BACKEND_PORT}
    routes:
      - name: bff-api
        paths: ["/api"]
        strip_path: ${STRIP_PATH}

  - name: spa
    url: http://host.docker.internal:${FRONTEND_PORT}
    routes:
      - name: spa-root
        paths: ["/"]
        strip_path: false
        methods: ["GET"]

plugins:
  - name: request-size-limiting
    config: { allowed_payload_size: 10 }
  # - name: rate-limiting
  #   enabled: false
  #   config: { minute: 600, policy: local }
EOF

else
  # MODE=SPLIT → SPA en http://localhost:${FRONTEND_PORT}, API en http://localhost:8000/api
  # CORS en Kong con allowlist exacta
  CORS_CREDENTIALS=$( [[ "$ENABLE_CORS_CREDENTIALS" == "1" ]] && echo "true" || echo "false" )
  # Construir lista de origins
  ORIGINS_YAML="- \"http://localhost:${FRONTEND_PORT}\""
  if [[ -n "$EXTRA_ORIGINS" ]]; then
    IFS=',' read -ra ORS <<< "$EXTRA_ORIGINS"
    for o in "${ORS[@]}"; do
      ORIGINS_YAML="${ORIGINS_YAML}\n        - \"${o}\""
    done
  fi

  cat > "$KONG_DIR/kong.yml" <<EOF
_format_version: "3.0"
_transform: true

services:
  - name: bff
    url: http://host.docker.internal:${BACKEND_PORT}
    routes:
      - name: bff-api
        paths: ["/api"]
        strip_path: ${STRIP_PATH}

plugins:
  - name: cors
    config:
      origins:
        ${ORIGINS_YAML}
      credentials: ${CORS_CREDENTIALS}
      methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
      headers: ["content-type","x-csrf-token","authorization"]
      exposed_headers: ["x-request-id"]
      max_age: 600

  - name: request-size-limiting
    config: { allowed_payload_size: 10 }
  - name: rate-limiting
    config: { minute: 600, policy: local }
EOF
fi

### ───── Backend ──────────────────────────────────────────────────────────────
echo "[run] backend :$BACKEND_PORT (logs -> $LOG_FILE)"
( cd "$ROOT_DIR" && stdbuf -oL -eL uvicorn backend.app.main:app \
  --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) \
  2>&1 | tee -a "$LOG_FILE" &

### ───── Frontend (Vite) ─────────────────────────────────────────────────────
echo "[run] frontend :$VITE_PORT (logs -> $ROOT_DIR/logs/frontend.log)"
( cd "$ROOT_DIR" && stdbuf -oL -eL npm run dev -- \
  --host 0.0.0.0 --port "$VITE_PORT" --strictPort ) \
  2>&1 | tee -a "$ROOT_DIR/logs/frontend.log" &

### ───── Kong (Docker Compose en ./kong) ──────────────────────────────────────
# Asegúrate que kong/docker-compose.yml expone 8000 (proxy) y 8001 (admin) y monta ./kong.yml
echo "[run] kong using kong/docker-compose.yml (logs -> $ROOT_DIR/logs/kong.log)"
( cd "$KONG_DIR" && docker compose up -d --remove-orphans ) \
  2>&1 | tee -a "$ROOT_DIR/logs/kong.log"

### ───── Health checks ────────────────────────────────────────────────────────
# 1) Backend directo (evita diagnosticar mal Kong si el backend aún no está)
echo "[run] waiting for backend @ :$BACKEND_PORT"
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${BACKEND_PORT}/api/_debug" >/dev/null; then
    echo "[run] backend ready"; break; fi; sleep 0.5
done

# 2) Kong → Backend
echo "[run] waiting for kong proxy @ :8000"
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/_debug" || true)
  if [[ "$code" == "200" ]]; then
    echo "[run] kong+backend ready"; break
  elif [[ "$code" == "502" ]]; then
    echo "[warn] 502 from Kong → backend o routing aún no listos; reintentando..."
  elif [[ "$code" == "429" ]]; then
    echo "[warn] 429 (rate-limited) → esperando para no spamear..."
    sleep 2
  fi
  sleep 0.5
done

# Mostrar resultado (si está)
curl -s "http://127.0.0.1:8000/api/_debug" || true; echo

# En modo SPLIT, prueba preflight de CORS
if [[ "$MODE" == "SPLIT" ]]; then
  echo "[run] preflight check (Origin: http://localhost:${FRONTEND_PORT})"
  curl -i -X OPTIONS \
    -H "Origin: http://localhost:${FRONTEND_PORT}" \
    -H "Access-Control-Request-Method: POST" \
    "http://127.0.0.1:8000/api/_debug" | sed -n '1,20p' || true
fi

### ───── Tips de seguridad (log) ─────────────────────────────────────────────
if [[ "${DEBUG_FLAG}" == "0" ]]; then
  echo "[sec] Recuerda: en prod no expongas el Admin (8001) a 0.0.0.0 y usa TLS/HSTS" >&2
fi

### ───── Tail logs (Ctrl+C para cortar) ───────────────────────────────────────
echo "[run] tailing logs (Ctrl+C to stop)"
tail -n+1 -F "$LOG_DIR/backend.log" "$ROOT_DIR/logs/frontend.log" "$ROOT_DIR/logs/kong.log"
