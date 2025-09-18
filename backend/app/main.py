from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx, os, json, datetime
import jwt  # PyJWT

# --- Config ---------------------------------------------------------------
N8N_URL = os.environ.get("N8N_URL", "https://rimac-n8n.yusqmz.easypanel.host/webhook/session")
# Prefer signing per-request with SECRET/PRIVATE_KEY; fallback to static token if provided
N8N_JWT = os.environ.get("N8N_JWT")  # optional pre-signed token (not recommended for public)
N8N_JWT_SECRET = os.environ.get("N8N_JWT_SECRET")
N8N_JWT_PRIVATE_KEY = os.environ.get("N8N_JWT_PRIVATE_KEY")
N8N_JWT_ALG = os.environ.get("N8N_JWT_ALG", "HS256")  # HS256 or RS256
N8N_JWT_ISS = os.environ.get("N8N_JWT_ISS", "red-white-bff")
N8N_JWT_AUD = os.environ.get("N8N_JWT_AUD", "n8n-webhook")

SESSION_COOKIE = os.environ.get("SESSION_COOKIE", "sid")
SESSION_SAMESITE = os.environ.get("SESSION_SAMESITE", "strict")
SESSION_SECURE = os.environ.get("SESSION_SECURE", "true").lower() == "true"

app = FastAPI(title="BFF for n8n session")

# Same-origin expected via reverse proxy; keep CORS minimal
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["content-type", "x-csrf-token"],
)


def _build_jwt() -> str | None:
    """Create a short-lived JWT for n8n verification.
    If neither SECRET nor PRIVATE_KEY are present, fallback to N8N_JWT (static).
    """
    now = datetime.datetime.utcnow()
    claims = {
        "iat": now,
        "nbf": now,
        "exp": now + datetime.timedelta(minutes=2),
        "iss": N8N_JWT_ISS,
        "aud": N8N_JWT_AUD,
    }
    try:
        if N8N_JWT_SECRET and N8N_JWT_ALG.startswith("HS"):
            return jwt.encode(claims, N8N_JWT_SECRET, algorithm=N8N_JWT_ALG)
        if N8N_JWT_PRIVATE_KEY and N8N_JWT_ALG.startswith("RS"):
            return jwt.encode(claims, N8N_JWT_PRIVATE_KEY, algorithm=N8N_JWT_ALG)
    except Exception:
        pass
    return N8N_JWT  # as last resort


async def call_n8n(payload: dict) -> dict:
    headers = {
        "content-type": "application/json",
    }
    token = _build_jwt()
    if token:
        headers["authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(N8N_URL, json=payload, headers=headers)
    try:
        return r.json()
    except Exception:
        return {"error": True, "status": r.status_code, "text": r.text}

# --- Routes ---------------------------------------------------------------
@app.post("/api/login")
async def login(req: Request, res: Response):
    body = await req.json()
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        raise HTTPException(status_code=400, detail="email and password required")

    payload = {"form": 111, "email": email, "usuario": email, "password": password}
    data = await call_n8n(payload)
    if data.get("auth") is True and data.get("jsessionid"):
        sid = data["jsessionid"]
        # compute ttl
        max_age = 86400
        if isinstance(data.get("expires_at"), str):
            try:
                expire_dt = datetime.datetime.fromisoformat(data["expires_at"].replace('Z','+00:00'))
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
        return JSONResponse({"auth": True, "expires_at": data.get("expires_at")})
    reason = data.get("reason") or data.get("error") or "invalid_credentials"
    return JSONResponse({"auth": False, "reason": reason}, status_code=401)


@app.post("/api/session")
async def session(req: Request):
    sid = req.cookies.get(SESSION_COOKIE)
    if not sid:
        try:
            body = await req.json()
            sid = body.get("sessionkey")
        except Exception:
            sid = None
    if not sid:
        return {"result": False}
    data = await call_n8n({"form": 333, "sessionkey": sid})
    return {"result": bool(data.get("result"))}


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
    return {"ok": True}
