#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNDIR="$ROOT/.run"

# autodetect DOCKER / sudo
if docker info >/dev/null 2>&1; then
  DOCKER="docker"
else
  DOCKER="sudo docker"
fi

kill_pidfile() { # $1 pidfile
  local f="$1"
  [[ -f "$f" ]] || { rm -f "$f" 2>/dev/null || true; return 0; }
  local pid
  pid="$(cat "$f" 2>/dev/null || true)"
  if [[ -n "${pid:-}" ]] && kill -0 "$pid" 2>/dev/null; then
    # graceful
    kill "$pid" 2>/dev/null || true
    for i in {1..20}; do
      sleep 0.2
      kill -0 "$pid" 2>/dev/null || break
    done
    # hard kill si sigue vivo
    kill -9 "$pid" 2>/dev/null || true
  fi
  rm -f "$f" 2>/dev/null || true
}

# bajar Kong primero (libera puertos rápido)
if [[ -f "$RUNDIR/docker-compose.generated.yml" ]]; then
  (cd "$RUNDIR" && $DOCKER compose -f docker-compose.generated.yml down || true)
fi
rm -f "$RUNDIR/kong.cid" 2>/dev/null || true

# matar backend y frontend (aunque los PID estén stale, se borran)
kill_pidfile "$RUNDIR/backend.pid"
kill_pidfile "$RUNDIR/frontend.pid"

# opcional: borra env y configs generadas para run limpio
rm -f "$RUNDIR/ports.env" "$RUNDIR/kong.generated.yml" "$RUNDIR/docker-compose.generated.yml" 2>/dev/null || true

echo "🧹 stopped. Logs siguen en $RUNDIR/*.out (si necesitas revisar)"
