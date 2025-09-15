from fastapi import APIRouter, Response, Request, HTTPException
from ..config import settings
from ..security import create_token, verify_token
from ..deps import get_redis
import secrets
import json
import asyncio

try:
    import httpx
except Exception:  # pragma: no cover
    httpx = None

router = APIRouter(prefix="/api", tags=["auth"])

DEMO_USER = {"username": "fiorellamatta", "password": "RIMAC2025$."}

async def _call_webhook(username: str) -> dict:
    if not settings.WEBHOOK_SESSION_VERIFY_URL:
        return {"valid": True, "exists": True, "locked": False}
    if httpx is None:
        raise HTTPException(status_code=500, detail="httpx not installed")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.post(settings.WEBHOOK_SESSION_VERIFY_URL, json={"username": username})
            r.raise_for_status()
            data = r.json()
            return data
    except Exception as e:
        # Fail closed for safety
        raise HTTPException(status_code=502, detail=f"Auth webhook error: {e}")

async def _set_session(username: str):
    r = await get_redis()
    if r is None:
        return
    key = f"sess:{username}"
    await r.set(key, json.dumps({"active": True}), ex=settings.SESSION_TTL)

async def _check_session(username: str) -> bool:
    r = await get_redis()
    if r is None:
        return True
    key = f"sess:{username}"
    return await r.exists(key) == 1

@router.get("/health")
async def health():
    return {"ok": True}

@router.post("/login")
async def login(usuario: str, password: str, response: Response):
    # 1) Demo credentials gate (local dev)
    if not (usuario == DEMO_USER["username"] and password == DEMO_USER["password"]):
        raise HTTPException(status_code=401, detail="Bad credentials")

    # 2) External webhook validation (exists/locked/active)
    data = await _call_webhook(usuario)
    if not data.get("exists", True):
        raise HTTPException(status_code=401, detail="User does not exist")
    if data.get("locked") is True:
        raise HTTPException(status_code=401, detail="User is locked")
    if not data.get("valid", True):
        raise HTTPException(status_code=401, detail="Invalid session")

    # 3) Tokens + session cache
    access = create_token({"sub": usuario}, settings.access_delta)
    refresh = create_token({"sub": usuario, "typ": "refresh"}, settings.refresh_delta)
    csrf = secrets.token_urlsafe(24)
    cookie = {"httponly": True, "samesite": "Lax", "path": "/"}
    response.set_cookie("access_token", access, **cookie)
    response.set_cookie("refresh_token", refresh, **cookie)
    response.set_cookie("csrf-token", csrf, httponly=False, samesite="Lax", path="/")

    await _set_session(usuario)
    return {"ok": True, "user": usuario}

@router.post("/logout")
async def logout(response: Response):
    for c in ["access_token", "refresh_token", "csrf-token"]:
        response.delete_cookie(c, path="/")
    return {"ok": True}

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    claims = verify_token(token)
    if claims.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    # Session must be present in Redis if configured
    if not await _check_session(claims.get("sub", "")):
        raise HTTPException(status_code=401, detail="Session expired")

    new_access = create_token({"sub": claims["sub"]}, settings.access_delta)
    response.set_cookie("access_token", new_access, httponly=True, samesite="Lax", path="/")
    return {"ok": True}
