# backend/app/main.py
from __future__ import annotations

from fastapi import FastAPI, Request, Response, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx, os, json, datetime, time, uuid, logging
import jwt  # PyJWT
from typing import Callable

# --- Config ---------------------------------------------------------------
N8N_URL = os.environ.get("N8N_URL", "https://rimac-n8n.yusqmz.easypanel.host/webhook/sesion")
N8N_JWT = os.environ.get("N8N_JWT")  # optional pre-signed token
N8N_JWT_SECRET = os.environ.get("N8N_JWT_SECRET")
N8N_JWT_PRIVATE_KEY = os.environ.get("N8N_JWT_PRIVATE_KEY")
N8N_JWT_ALG = os.environ.get("N8N_JWT_ALG", "HS256")  # HS256 or RS256
N8N_JWT_ISS = os.environ.get("N8N_JWT_ISS", "red-white-bff")
N8N_JWT_AUD = os.environ.get("N8N_JWT_AUD", "n8n-webhook")

SESSION_COOKIE   = os.environ.get("SESSION_COOKIE", "jsessionid")
SESSION_SAMESITE = os.environ.get("SESSION_SAMESITE", "Lax")     # dev: Lax
SESSION_SECURE   = os.environ.get("SESSION_SECURE", "false").lower() == "true"  # dev: false

BFF_DEBUG = os.environ.get("BFF_DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FRONTEND_PORT = os.getenv("FRONTEND_PORT", "45855")

# HTTP client tuning (fast, low overhead)
N8N_TIMEOUT = float(os.getenv("N8N_TIMEOUT", "6.0"))  # seconds
MAX_CONN    = int(os.getenv("HTTP_MAX_CONNECTIONS", "50"))
MAX_KEEP    = int(os.getenv("HTTP_MAX_KEEPALIVE", "10"))

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("bff")

# --- Lifespan: create a single AsyncClient (connection pool) --------------
_client: httpx.AsyncClient | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _client
    _client = httpx.AsyncClient(
        timeout=N8N_TIMEOUT,
        limits=httpx.Limits(max_connections=MAX_CONN, max_keepalive_connections=MAX_KEEP),
        http2=False,
    )
    try:
        yield
    finally:
        await _client.aclose()
        _client = None

app = FastAPI(title="BFF for n8n session", lifespan=lifespan)

# CORS solo en debug local (no prod)
if BFF_DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[f"http://localhost:{FRONTEND_PORT}"],
        allow_credentials=True,
        allow_methods=["POST", "OPTIONS", "GET"],
        allow_headers=["content-type", "x-csrf-token"],
    )

# --- Utilities -------------------------------------------------------------
def _jwt_mode() -> str:
    if N8N_JWT_SECRET and N8N_JWT_ALG.startswith("HS"): return "HS"
    if N8N_JWT_PRIVATE_KEY and N8N_JWT_ALG.startswith("RS"): return "RS"
    if N8N_JWT: return "STATIC"
    return "NONE"

def _build_jwt() -> str | None:
    mode = _jwt_mode()
    now = datetime.datetime.utcnow()
    claims = {
        "iat": now, "nbf": now,
        "exp": now + datetime.timedelta(minutes=2),
        "iss": N8N_JWT_ISS, "aud": N8N_JWT_AUD,
    }
    try:
        if mode == "HS":
            return jwt.encode(claims, N8N_JWT_SECRET, algorithm=N8N_JWT_ALG)
        if mode == "RS":
            return jwt.encode(claims, N8N_JWT_PRIVATE_KEY, algorithm=N8N_JWT_ALG)
        if mode == "STATIC":
            return N8N_JWT
    except Exception as e:
        if BFF_DEBUG: log.warning("JWT build error: %r", e)
    return None

def _reason_text(val) -> str:
    if isinstance(val, str): return val
    if val is True: return "true"
    if val is False: return "false"
    try: return json.dumps(val)
    except Exception: return str(val)

def _rid() -> str: return uuid.uuid4().hex[:12]

# Request logging middleware (muy barato; útil en debug)
@app.middleware("http")
async def _reqlog(request: Request, call_next: Callable):
    rid = request.headers.get("x-request-id") or _rid()
    t0 = time.perf_counter()
    if BFF_DEBUG:
        try:
            ck = list(request.cookies.keys())
            log.info("[%s] req %s %s cookies=%s", rid, request.method, request.url.path, ck)
        except Exception:
            pass
    resp = await call_next(request)
    if BFF_DEBUG:
        dt = int((time.perf_counter() - t0) * 1000)
        log.info("[%s] res %s %s %dms", rid, request.method, request.url.path, dt)
    resp.headers["x-request-id"] = rid
    return resp

# --- n8n call (rápido: usa pool y logs mínimos) --------------------------
async def call_n8n(payload: dict) -> tuple[int, dict, str]:
    assert _client is not None, "HTTP client not initialized"
    headers = {"content-type": "application/json"}
    tok = _build_jwt()
    if tok: headers["authorization"] = f"Bearer {tok}"

    t0 = time.perf_counter()
    r = await _client.post(N8N_URL, json=payload, headers=headers)
    dt = int((time.perf_counter() - t0) * 1000)

    # Parse body una sola vez, sin copias pesadas
    try:
        data = r.json()
    except Exception:
        data = {"raw": (r.text[:160] if r.text else "")}

    if BFF_DEBUG:
        # Log ultra compacto (sin secretos)
        flags = {k: data.get(k) for k in ("auth", "valid", "result", "error", "reason")}
        log.info("[n8n] %s %dms flags=%s", r.status_code, dt, flags)

    return r.status_code, data, r.text

# --- Routes ---------------------------------------------------------------
@app.post("/api/login")
async def login(req: Request, res: Response, x_csrf_token: str | None = Header(default=None)):
    body = await req.json()
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")

    status, data, _ = await call_n8n({"form": 111, "email": email, "usuario": email, "password": password})

    if status == 200 and data.get("auth") is True and data.get("jsessionid"):
        sid = data["jsessionid"]
        max_age = 86400
        if isinstance(data.get("expires_at"), str):
            try:
                expire_dt = datetime.datetime.fromisoformat(data["expires_at"].replace("Z", "+00:00"))
                max_age = max(1, int((expire_dt - datetime.datetime.now(datetime.timezone.utc)).total_seconds()))
            except Exception:
                pass

        res.set_cookie(
            key=SESSION_COOKIE,
            value=sid,
            max_age=max_age,
            httponly=True,
            secure=SESSION_SECURE,
            samesite=SESSION_SAMESITE,
            path="/",
        )
        if BFF_DEBUG:
            log.info("[/api/login] set_cookie name=%s samesite=%s secure=%s", SESSION_COOKIE, SESSION_SAMESITE, SESSION_SECURE)
        return JSONResponse({"auth": True, "expires_at": data.get("expires_at")})

    reason = _reason_text(data.get("reason") or data.get("error") or data)
    return JSONResponse({"auth": False, "reason": reason}, status_code=(status or 401))

@app.post("/api/session")
async def session(req: Request):
    # Lee cookie; si no hay, intenta body.sessionkey (legacy)
    sid = req.cookies.get(SESSION_COOKIE)
    body = {}
    try:
        body = await req.json()
    except Exception:
        pass
    if BFF_DEBUG:
        log.info("[/api/session] cookie_name=%s has_cookie=%s body_has_key=%s",
                 SESSION_COOKIE, bool(sid), bool(body.get("sessionkey")))

    if not sid:
        sid = body.get("sessionkey")

    if not sid:
        # Early false: sin cookie
        if BFF_DEBUG: log.info("[/api/session] early_false (no sid)")
        return {"result": False}

    status, data, _ = await call_n8n({"form": 333, "sessionkey": sid})
    ok = bool(data.get("result") or data.get("auth") or data.get("valid"))
    if BFF_DEBUG:
        log.info("[/api/session] n8n_status=%s ok=%s", status, ok)
    return {"result": ok}

@app.post("/api/logout")
async def logout(req: Request, res: Response):
    sid = req.cookies.get(SESSION_COOKIE)
    try:
        body = await req.json()
        sid = sid or body.get("sessionkey")
    except Exception:
        pass
    if sid:
        await call_n8n({"form": 222, "sessionkey": sid})
    res.delete_cookie(SESSION_COOKIE, path="/")
    if BFF_DEBUG:
        log.info("[/api/logout] del_cookie name=%s had_sid=%s", SESSION_COOKIE, bool(sid))
    return {"ok": True}

@app.get("/api/_debug")
async def debug_info():
    if not BFF_DEBUG:
        raise HTTPException(status_code=404)
    mode = _jwt_mode()
    token = _build_jwt() or ""
    preview = (token[:16] + "…") if token else ""
    return {
        "n8n_url": N8N_URL,
        "jwt_alg": N8N_JWT_ALG,
        "jwt_mode": mode,
        "auth_header_present": bool(token),
        "auth_header_preview": preview,
        "cookie": SESSION_COOKIE,
        "timeout_s": N8N_TIMEOUT,
        "pool": {"max_connections": MAX_CONN, "max_keepalive": MAX_KEEP},
    }

# Útil en debug local para ver si la cookie llega realmente
@app.get("/api/_echo")
async def echo(req: Request):
    return {
        "cookie_name": SESSION_COOKIE,
        "cookies_present": list(req.cookies.keys()),
        "has_cookie": bool(req.cookies.get(SESSION_COOKIE)),
        "headers_subset": {
            "host": req.headers.get("host"),
            "origin": req.headers.get("origin"),
            "cookie": "present" if "cookie" in req.headers else "absent",
            "x-forwarded-proto": req.headers.get("x-forwarded-proto"),
        },
    }
