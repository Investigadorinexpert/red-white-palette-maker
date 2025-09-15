from fastapi import APIRouter, Response, Request, HTTPException
from ..config import settings
from ..security import create_token, verify_token
import secrets

router = APIRouter(prefix="/api", tags=["auth"])

DEMO_USER = {"username": "fiorellamatta", "password": "RIMAC2025$."}

@router.post("/login")
def login(usuario: str, password: str, response: Response):
    if not (usuario == DEMO_USER["username"] and password == DEMO_USER["password"]):
        raise HTTPException(status_code=401, detail="Bad credentials")
    access = create_token({"sub": usuario}, settings.access_delta)
    refresh = create_token({"sub": usuario, "typ": "refresh"}, settings.refresh_delta)
    csrf = secrets.token_urlsafe(24)
    cookie = {"httponly": True, "samesite": "Lax", "path": "/"}
    response.set_cookie("access_token", access, **cookie)
    response.set_cookie("refresh_token", refresh, **cookie)
    response.set_cookie("csrf-token", csrf, httponly=False, samesite="Lax", path="/")
    return {"ok": True, "user": usuario}

@router.post("/logout")
def logout(response: Response):
    for c in ["access_token", "refresh_token", "csrf-token"]:
        response.delete_cookie(c, path="/")
    return {"ok": True}

@router.post("/refresh")
def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    claims = verify_token(token)
    if claims.get("typ") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")
    from ..security import create_token
    new_access = create_token({"sub": claims["sub"]}, settings.access_delta)
    response.set_cookie("access_token", new_access, httponly=True, samesite="Lax", path="/")
    return {"ok": True}
