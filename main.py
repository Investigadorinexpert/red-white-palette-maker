from fastapi import FastAPI, Request, Response, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx, os, json, datetime, logging, logging.handlers, pathlib
import jwt  # PyJWT
from dotenv import load_dotenv

# --- dotenv (carga backend/.env) -------------------------------------------
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# --- Logging ---------------------------------------------------------------
LOG_DIR = pathlib.Path(BASE_DIR / "logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = os.environ.get("LOG_FILE", str(LOG_DIR / "backend.log"))
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

logger = logging.getLogger("bff")
logger.setLevel(LOG_LEVEL)
if not logger.handlers:
    fh = logging.handlers.RotatingFileHandler(LOG_FILE, maxBytes=2_000_000, backupCount=5)
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

# --- Config ---------------------------------------------------------------
N8N_URL = os.environ.get("N8N_URL", "https://rimac-n8n.yusqmz.easypanel.host/webhook/session")
N8N_JWT = os.environ.get("N8N_JWT")  # fallback estático (no prod)
N8N_JWT_SECRET = os.environ.get("N8N_JWT_SECRET")
N8N_JWT_PRIVATE_KEY = os.environ.get("N8N_JWT_PRIVATE_KEY")
N8N_JWT_ALG = os.environ.get("N8N_JWT_ALG", "HS256")
N8N_JWT_ISS = os.environ.get("N8N_JWT_ISS", "red-white-bff")
N8N_JWT_AUD = os.environ.get("N8N_JWT_AUD", "n8n-webhook")
BFF_DEBUG = os.environ.get("BFF_DEBUG", "false").lower() == "true"

SESSION_COOKIE = os.environ.get("SESSION_COOKIE", "sid")
SESSION_SAMESITE = os.environ.get("SESSION_SAMESITE", "strict")
SESSION_SECURE = os.environ.get("SESSION_SECURE", "true").lower() == "true"

app = FastAPI(title="BFF for n8n session")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[], allow_credentials=True, allow_methods=["POST"],
    allow_headers=["content-type", "x-csrf-token"],
)

def _jwt_mode() -> str:
    if N8N_JWT_SECRET and N8N_JWT_ALG.startswith("HS"): return "HS"
    if N8N_JWT_PRIVATE_KEY and N8N_JWT_ALG.startswith("RS"): return "RS"
    if N8N_JWT: return "STATIC"
    return "NONE"

def _build_jwt() -> str | None:
    now = datetime.datetime.now(datetime.timezone.utc)
    claims = {"iat": now, "nbf": now, "exp": now + datetime.timedelta(minutes=2),
              "iss": N8N_JWT_ISS, "aud": N8N_JWT_AUD}
    mode = _jwt_mode()
    try:
        if mode == "HS":
            return jwt.encode(claims, N8N_JWT_SECRET, algorithm=N8N_JWT_ALG)
        if mode == "RS":
            return jwt.encode(claims, N8N_JWT_PRIVATE_KEY, algorithm=N8N_JWT_ALG)
        if mode == "STATIC":
            return N8N_JWT
    except Exception as e:
        logger.error("JWT build error: %r", e)
    return None

async def call_n8n(payload: dict) -> tuple[int, dict, str]:
    headers = {"content-type": "application/json"}
    token = _build_jwt()
    if token: headers["authorization"] = f"Bearer {token}"
    if BFF_DEBUG:
        logger.debug("[BFF→n8n] url=%s auth=%s payload=%s",
                     N8N_URL, "present" if token else "missing",
                     json.dumps(payload, ensure_ascii=False))
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(N8N_URL, json=payload, headers=headers)
    text = r.text
    try:
        data = r.json()
    except Exception:
        data = {"raw": text}
    if BFF_DEBUG:
        logger.debug("[n8n→BFF] status=%s body=%s", r.status_code, json.dumps(data)[:800])
    return r.status_code, data, text

def _reason_text(val) -> str:
    if isinstance(val, str): return val
    if val is True: return "true"
    if val is False: return "false"
    try: return json.dumps(val)
    except Exception: return str(val)

# --- Endpoints ------------------------------------------------------------
@app.get("/api/_debug")
async def debug_info():
    mode = _jwt_mode()
    token = _build_jwt() or ""
    preview = (token[:16] + "…") if token else ""
    return {"n8n_url": N8N_URL, "jwt_alg": N8N_JWT_ALG, "jwt_mode": mode,
            "auth_header_present": bool(token), "auth_header_preview": preview,
            "cookie": SESSION_COOKIE, "log_file": LOG_FILE, "log_level": LOG_LEVEL}

@app.get("/api/_health")
async def health(): return {"ok": True}

@app.post("/api/login")
async def login(req: Request, res: Response, x_csrf_token: str | None = Header(default=None)):
    body = await req.json()
    email, password = body.get("email"), body.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")
    status, data, raw = await call_n8n({"form": 111, "email": email, "usuario": email, "password": password})
    if status == 200 and data.get("auth") is True and data.get("jsessionid"):
        sid = data["jsessionid"]
        max_age = 86400
        if isinstance(data.get("expires_at"), str):
            try:
                expire_dt = datetime.datetime.fromisoformat(data["expires_at"].replace("Z","+00:00"))
                max_age = max(1, int((expire_dt - datetime.datetime.now(datetime.timezone.utc)).total_seconds()))
            except Exception: pass
        res.set_cookie(key=SESSION_COOKIE, value=sid, max_age=max_age,
                       httponly=True, secure=SESSION_SECURE, samesite=SESSION_SAMESITE, path="/")
        return JSONResponse({"auth": True, "expires_at": data.get("expires_at")})
    reason = _reason_text(data.get("reason") or data.get("error") or data)
    return JSONResponse({"auth": False, "reason": reason}, status_code=(status or 401))

@app.post("/api/session")
async def session(req: Request):
    sid = req.cookies.get(SESSION_COOKIE)
    if not sid:
        try: sid = (await req.json()).get("sessionkey")
        except Exception: sid = None
    if not sid: return {"result": False}
    status, data, raw = await call_n8n({"form": 333, "sessionkey": sid})
    return {"result": bool(data.get("result"))}

@app.post("/api/logout")
async def logout(req: Request, res: Response):
    sid = req.cookies.get(SESSION_COOKIE)
    try: sid = sid or (await req.json()).get("sessionkey")
    except Exception: pass
    if sid: await call_n8n({"form": 222, "sessionkey": sid})
    res.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}
