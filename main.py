#!/usr/bin/env python3
import os, sys, subprocess, signal, time, shlex, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
RUNDIR = ROOT / ".run"
RUNDIR.mkdir(parents=True, exist_ok=True)

def load_ports_env():
    # Prioridad: .run/ports.env > env del shell > defaults
    ports = {
        "API_PORT": os.environ.get("API_PORT"),
        "FRONT_PORT": os.environ.get("FRONT_PORT"),
        "KONG_PROXY_PORT": os.environ.get("KONG_PROXY_PORT"),
        "KONG_ADMIN_PORT": os.environ.get("KONG_ADMIN_PORT"),
        "API_BASE": os.environ.get("API_BASE"),
    }
    pe = RUNDIR / "ports.env"
    if pe.exists():
        for line in pe.read_text().splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                ports[k.strip()] = v.strip()
    # Defaults razonables si faltan
    if not ports["API_PORT"]: ports["API_PORT"] = "3002"
    if not ports["FRONT_PORT"]: ports["FRONT_PORT"] = "5173"
    if not ports["KONG_PROXY_PORT"]: ports["KONG_PROXY_PORT"] = "8000"
    if not ports["KONG_ADMIN_PORT"]: ports["KONG_ADMIN_PORT"] = "8001"
    if not ports["API_BASE"]:
        ports["API_BASE"] = f"http://localhost:{ports['KONG_PROXY_PORT']}/api"
    return ports

def write_pid(pidfile: pathlib.Path, pid: int):
    pidfile.write_text(str(pid))

def kill_pidfile(pidfile: pathlib.Path):
    try:
        if not pidfile.exists(): return
        pid = int(pidfile.read_text().strip() or "0")
        if pid > 0:
            try:
                os.kill(pid, signal.SIGINT)
            except Exception:
                pass
            # espera breve y fuerza si sigue vivo
            for _ in range(20):
                time.sleep(0.2)
                try:
                    os.kill(pid, 0)
                except OSError:
                    break
            else:
                try:
                    os.kill(pid, signal.SIGKILL)
                except Exception:
                    pass
    finally:
        try: pidfile.unlink(missing_ok=True)
        except Exception: pass

def main():
    ports = load_ports_env()
    print("Ports →", " ".join(f"{k}={v}" for k, v in ports.items()))

    env = os.environ.copy()
    # Asegura que el front reciba la base del API
    env["VITE_API_BASE"] = ports["API_BASE"]
    env["VITE_PORT"] = ports["FRONT_PORT"]

    procs = []
    try:
        # Backend (Uvicorn) — host 0.0.0.0 para que Kong (en Docker) pueda alcanzarlo
        backend_cmd = [
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--reload",
            "--port", ports["API_PORT"]
        ]
        backend = subprocess.Popen(
            backend_cmd,
            cwd=str(ROOT / "backend"),
            env=env,
            stdout=(RUNDIR / "backend.out").open("wb"),
            stderr=subprocess.STDOUT,
        )
        write_pid(RUNDIR / "backend.pid", backend.pid)
        procs.append(("backend", backend))

        # Frontend (Vite). Pasamos el puerto explícito para evitar choques.
        # Nota: Vite toma VITE_API_BASE desde env (.env.local o env del proceso).
        frontend_cmd = ["npm", "run", "dev", "--", "--port", ports["FRONT_PORT"]]
        frontend = subprocess.Popen(
            frontend_cmd,
            cwd=str(ROOT / "frontend"),
            env=env,
            stdout=(RUNDIR / "frontend.out").open("wb"),
            stderr=subprocess.STDOUT,
        )
        write_pid(RUNDIR / "frontend.pid", frontend.pid)
        procs.append(("frontend", frontend))

        print("✅ Up & running")
        print(f"Frontend:    http://localhost:{ports['FRONT_PORT']}")
        print(f"API via Kong: {ports['API_BASE']}")
        print(f"Kong Admin:  http://localhost:{ports['KONG_ADMIN_PORT']}")
        print(f"Try: curl -i {ports['API_BASE']}/health")

        # Loop de vida
        while True:
            # si alguno muere, salimos y limpiamos
            for name, p in procs:
                ret = p.poll()
                if ret is not None:
                    print(f"⚠️  {name} exited with code {ret}, shutting down...")
                    return
            time.sleep(1)

    except KeyboardInterrupt:
        pass
    finally:
        # Apaga con cariño y limpia PID files
        for name, p in procs:
            try:
                p.send_signal(signal.SIGINT)
            except Exception:
                pass
        # Espera breve y fuerza
        time.sleep(1.5)
        for name, p in procs:
            if p.poll() is None:
                try:
                    p.kill()
                except Exception:
                    pass
        kill_pidfile(RUNDIR / "backend.pid")
        kill_pidfile(RUNDIR / "frontend.pid")

if __name__ == "__main__":
    main()
