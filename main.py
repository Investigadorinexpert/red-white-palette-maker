#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import subprocess, sys, os

# Orquesta backend (FastAPI) y frontend (Vite) en paralelo.
# Para producción se recomienda usar supervisord/systemd o Docker Compose.

ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT, 'backend')
FRONTEND_DIR = os.path.join(ROOT, 'frontend')

processes = []

try:
    # Backend
    processes.append(subprocess.Popen([sys.executable, '-m', 'uvicorn', 'main:app', '--reload', '--port', '3000'], cwd=BACKEND_DIR))

    # Frontend
    npm = 'npm.cmd' if os.name == 'nt' else 'npm'
    processes.append(subprocess.Popen([npm, 'run', 'dev'], cwd=FRONTEND_DIR))

    for p in processes:
        p.wait()
except KeyboardInterrupt:
    pass
finally:
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
