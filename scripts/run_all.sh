#!/usr/bin/env bash
set -Eeuo pipefail

# Resolve project root (works even if executed from scripts/)
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

DEBUG_FLAG=${DEBUG_FLAG:-1}
export PYTHONUNBUFFERED=1

export FRONTEND_PORT=${FRONTEND_PORT:-45855}
export BACKEND_PORT=${BACKEND_PORT:-35669}

export BFF_DEBUG=${BFF_DEBUG:-$DEBUG_FLAG}
export LOG_FILE=${LOG_FILE:-$LOG_DIR/backend.log}
export LOG_LEVEL=${LOG_LEVEL:-$( [ "$DEBUG_FLAG" = "1" ] && echo DEBUG || echo INFO )}

# Load backend .env if exists
if [[ -f "$ROOT_DIR/backend/.env" ]]; then
  set -a; source "$ROOT_DIR/backend/.env"; set +a
fi

# Backend
echo "[run] backend :$BACKEND_PORT (logs -> $LOG_FILE)"
( cd "$ROOT_DIR" && stdbuf -oL -eL uvicorn backend.app.main:app \
  --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) \
  2>&1 | tee -a "$LOG_FILE" &

# Frontend (Vite)
echo "[run] frontend :$FRONTEND_PORT (logs -> $ROOT_DIR/logs/frontend.log)"
( cd "$ROOT_DIR" && stdbuf -oL -eL npm run dev -- \
  --host 0.0.0.0 --port "$FRONTEND_PORT" --strictPort ) \
  2>&1 | tee -a "$ROOT_DIR/logs/frontend.log" &

# Kong (use repo config)
echo "[run] kong using kong/docker-compose.yml (logs -> $ROOT_DIR/logs/kong.log)"
( cd "$ROOT_DIR/kong" && docker compose up -d --remove-orphans ) \
  2>&1 | tee -a "$ROOT_DIR/logs/kong.log"

# Health and debug via Kong proxy at :8000
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:8000/api/_debug" >/dev/null; then
    echo "[run] kong+backend ready"; break; fi; sleep 0.5; done

curl -s "http://127.0.0.1:8000/api/_debug" || true; echo

# Tail logs (Ctrl+C to stop)
echo "[run] tailing logs (Ctrl+C to stop)"
tail -n+1 -F "$LOG_DIR/backend.log" "$ROOT_DIR/logs/frontend.log" "$ROOT_DIR/logs/kong.log"
