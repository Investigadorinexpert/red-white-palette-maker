#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNDIR="$ROOT/.run"
mkdir -p "$RUNDIR"

# ----------------- helpers -----------------
pick_port() {
  python3 - "$@" <<'PY'
import socket
for _ in range(100):
    with socket.socket() as s:
        s.bind(('',0))
        p = s.getsockname()[1]
        if 1024 <= p <= 65535:
            print(p)
            break
PY
}

write_file() { # $1 path, $2 content
  mkdir -p "$(dirname "$1")"
  printf "%s" "$2" > "$1"
}

# docker / sudo autodetect
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
elif sudo -n docker info >/dev/null 2>&1; then
  DOCKER="sudo docker"
else
  echo "❌ Docker no accesible. Corre: sudo systemctl enable --now docker && agrega tu usuario al grupo docker"
  exit 1
fi

# ----------------- random ports -----------------
FRONT_PORT="${FRONT_PORT:-$(pick_port)}"
API_PORT="${API_PORT:-$(pick_port)}"
KONG_PROXY_PORT="${KONG_PROXY_PORT:-$(pick_port)}"
KONG_ADMIN_PORT="${KONG_ADMIN_PORT:-$(pick_port)}"

# Detect server IP if not provided
if [[ -z "${SERVER_IP:-}" ]]; then
  if command -v hostname >/dev/null 2>&1; then
    SERVER_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  fi
  [[ -z "${SERVER_IP:-}" ]] && SERVER_IP="127.0.0.1"
fi
export SERVER_IP FRONT_PORT API_PORT KONG_PROXY_PORT KONG_ADMIN_PORT

# API base visible para clientes (no localhost)
API_BASE="http://$SERVER_IP:${KONG_PROXY_PORT}/api"

cat > "$RUNDIR/ports.env" <<ENV
FRONT_PORT=${FRONT_PORT}
API_PORT=${API_PORT}
KONG_PROXY_PORT=${KONG_PROXY_PORT}
KONG_ADMIN_PORT=${KONG_ADMIN_PORT}
SERVER_IP=${SERVER_IP}
API_BASE=${API_BASE}
ENV

echo "Ports → $(tr '
' ' ' < "$RUNDIR/ports.env")"

# ----------------- kong declarative (CORS + upstream dinámico) -----------------
# strip_path=true: el backend recibe rutas SIN /api (si tu backend ya sirve en /api, cámbialo a false)
KONG_YML_CONTENT="$(cat <<YAML
_format_version: "3.0"
_transform: true

services:
  - name: rimac-api
    url: http://host.docker.internal:${API_PORT}
    routes:
      - name: rimac-api-route
        paths: ["/api"]
        strip_path: true

plugins:
  - name: cors
    config:
      origins:
        - http://localhost:${FRONT_PORT}
        - http://127.0.0.1:${FRONT_PORT}
        - http://${SERVER_IP}:${FRONT_PORT}
      credentials: true
      methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"]
      headers: ["*"]
  - name: request-size-limiting
    config: { allowed_payload_size: 50 }
  - name: rate-limiting
    config: { minute: 600, policy: local }
YAML
)"
write_file "$RUNDIR/kong.generated.yml" "$KONG_YML_CONTENT"

# ----------------- docker compose -----------------
EXTRA_HOSTS=""
if [[ "$(uname -s)" == "Linux" ]]; then
  EXTRA_HOSTS='extra_hosts:
      - "host.docker.internal:host-gateway"'
fi

COMPOSE_CONTENT="$(cat <<YML
services:
  kong:
    image: kong:3.6
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_LISTEN: "0.0.0.0:8000"
      KONG_ADMIN_LISTEN: "0.0.0.0:8001"
    volumes:
      - ${RUNDIR}/kong.generated.yml:/kong/kong.yml
    ports:
      - "${KONG_PROXY_PORT}:8000"
      - "${KONG_ADMIN_PORT}:8001"
    ${EXTRA_HOSTS}
YML
)"
write_file "$RUNDIR/docker-compose.generated.yml" "$COMPOSE_CONTENT"

# ----------------- frontend env (Vite) -----------------
write_file "$ROOT/frontend/.env.local" "VITE_API_BASE=${API_BASE}
VITE_PORT=${FRONT_PORT}
"

# ----------------- start backend -----------------
pushd "$ROOT/backend" >/dev/null
    (python3 -m uvicorn app.main:app --host 0.0.0.0 --reload --port "${API_PORT}" \
    > "$RUNDIR/backend.out" 2>&1 & echo $! > "$RUNDIR/backend.pid")
popd >/dev/null

# ----------------- start frontend -----------------
pushd "$ROOT/frontend" >/dev/null
  (npm run dev -- --host 0.0.0.0 --port "${FRONT_PORT}" \
    > "$RUNDIR/frontend.out" 2>&1 & echo $! > "$RUNDIR/frontend.pid")
popd >/dev/null

# ----------------- start kong -----------------
pushd "$RUNDIR" >/dev/null
  $DOCKER compose -f docker-compose.generated.yml up -d
  $DOCKER compose -f docker-compose.generated.yml ps -q > "$RUNDIR/kong.cid"
popd >/dev/null

# ----------------- resumen -----------------
echo "✅ Up & running"
echo "Frontend:   http://$SERVER_IP:${FRONT_PORT}   (local: http://localhost:${FRONT_PORT})"
echo "API via Kong: http://$SERVER_IP:${KONG_PROXY_PORT}/api   (local: http://localhost:${KONG_PROXY_PORT}/api)"
echo "Kong Admin: http://$SERVER_IP:${KONG_ADMIN_PORT}   (local: http://localhost:${KONG_ADMIN_PORT})"
echo "Try: curl -i http://$SERVER_IP:${KONG_PROXY_PORT}/api/health || true"
