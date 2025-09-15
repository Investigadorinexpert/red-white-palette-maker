#!/usr/bin/env python3
import subprocess, sys, os, time, signal

ROOT = os.path.dirname(os.path.abspath(__file__))

procs = []
try:
    env = os.environ.copy()
    # Backend
    backend = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--port", "3000"],
        cwd=os.path.join(ROOT, "backend"),
        env=env
    )
    procs.append(backend)
    # Frontend (assumes npm i done)
    frontend = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(ROOT, "frontend"),
        env=env
    )
    procs.append(frontend)

    while True:
        time.sleep(1)
except KeyboardInterrupt:
    pass
finally:
    for p in procs:
        try: p.send_signal(signal.SIGINT)
        except Exception: pass
