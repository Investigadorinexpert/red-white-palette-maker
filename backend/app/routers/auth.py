import logging
from fastapi import APIRouter, Response, Request, HTTPException, Body
from pydantic import BaseModel
from ..config import settings
from ..security import create_token, verify_token
import secrets
import os

try:
    import httpx
except Exception:   # pragma: no cover
    httpx = None

log = logging.getLogger("auth")

router = APIRouter(prefix="/api", tags=["auth"])

# ---- Webhook registry (simple, no-code friendly) ----
def _get_webhook(name: str) -> str:
    if name == "session_verify":
        return os.getenv("WEBHOOK_SESSION_VERIFY_URL",
                         "https://rimac-n8n.yusqmz.easypanel.host/webhook/4eb99137-adc5-47f7-a378-32479bee3842")
    return os.getenv(f"WEBHOOK_{name.upper()}", "")

async def _call_webhook(username: str, password: str) -> dict:
    url = _get_webhook("session_verify")
    if not url:
        return {"valid": True, "exists": True, "locked": False}
    if httpx is None:
        raise HTTPException(status_code=500, detail="httpx not installed")
    try:
        payload = {"username": username, "password": password}
        log.info("auth.webhook.call start", extra={"url": url, "username": username})
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(url, json=payload)
            r.raise_for_status()
            data = r.json()
            # log fields but NEVER the jsessionid value
            log.info("auth.webhook.result", extra={"valid": data.get('valid'), "exists": data.get('exists'), "locked": data.get('locked'), "has_jsessionid": bool(data.get('jsessionid'))})
            return data
    except Exception as e:
        log.exception("auth.webhook.error")
        raise HTTPException(status_code=502, detail=f"Auth webhook error: {e}")

# -------- Models --------
class LoginIn(BaseModel):
    usuario: str
    password: str

@router.get("/health")
async def health():
    return {"ok": True}

@router.get("/session")
async def session_info(request: Request):
    # expose presence (not values) of cookies for debug-ui
    has_jsid = bool(request.cookies.get("jsessionid"))
    has_rt = bool(request.cookies.get("refresh_token"))
    has_at = bool(request.cookies.get("access_token"))
    return {"ok": True, "cookies": {"jsessionid": has_jsid, "refresh": has_rt, "access": has_at}}

@router.post("/login")
async def login(payload: LoginIn = Body(...), response: Response = None):
    usuario = payload.usuario
    # 1) External webhook validation: expects {valid, exists, locked, jsessionid?}
    data = await _call_webhook(usuario, payload.password)
    if not data.get("exists", True):
        raise HTTPException(status_code=401, detail="User does not exist")
    if data.get("locked") is True:
        raise HTTPException(status_code=401, detail="User is locked")
    if not data.get("valid", True):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2) Issue local tokens (optional). Flow works solely with jsessionid if present.
    access = create_token({"sub": usuario}, settings.access_delta) or ""
    refresh = create_token({"sub": usuario, "typ": "refresh"}, settings.refresh_delta) or ""
    csrf = secrets.token_urlsafe(24)
    cookie = {"httponly": True, "samesite": "Lax", "path": "/"}
    if access:
        response.set_cookie("access_token", access, **cookie)
    if refresh:
        response.set_cookie("refresh_token", refresh, **cookie)
    response.set_cookie("csrf-token", csrf, httponly=False, samesite="Lax", path="/")

    # jsessionid from webhook (store httpOnly so the browser auto-sends it)
    jsessionid = data.get("jsessionid")
    if jsessionid:
        response.set_cookie("jsessionid", jsessionid, **cookie)
        log.info("auth.login.set_jsessionid")
    else:
        log.warning("auth.login.no_jsessionid_from_webhook")

    return {"ok": True, "user": usuario}

@router.post("/logout")
async def logout(response: Response):
    for c in ["access_token", "refresh_token", "csrf-token", "jsessionid"]:
        response.delete_cookie(c, path="/")
    return {"ok": True}

@router.post("/refresh")
async def refresh(request: Request, response: Response):
    # 1) Prefer jsessionid presence (n8n is the source of truth)
    if request.cookies.get("jsessionid"):
        log.info("auth.refresh.ok_jsessionid")
        return {"ok": True}

    # 2) Fallback to refresh_token if no jsessionid (still supports legacy flow)
    token = request.cookies.get("refresh_token")
    if not token:
        log.info("auth.refresh.missing_both")
        raise HTTPException(status_code=401, detail="No session")
    claims = verify_token(token)
    if claims.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    new_access = create_token({"sub": claims["sub"]}, settings.access_delta) or ""
    if new_access:
        response.set_cookie("access_token", new_access, httponly=True, samesite="Lax", path="/")
        log.info("auth.refresh.ok_refresh_token")
        return {"ok": True}

    # If token support is disabled, require jsessionid-only flow
    log.info("auth.refresh.needs_jsessionid_only")
    raise HTTPException(status_code=401, detail="Session requires jsessionid")
