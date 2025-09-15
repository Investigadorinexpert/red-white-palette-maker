from datetime import datetime, timedelta, timezone
from typing import Any, Dict
import jwt  # PyJWT
from fastapi import HTTPException, Request
from .config import settings

ALGO = "HS256"

def create_token(payload: Dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({"iat": now, "exp": now + expires_delta})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGO)

def verify_token(token: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_cookie(req: Request, key: str) -> str | None:
    return req.cookies.get(key)

def check_csrf(req: Request):
    cookie_csrf = req.cookies.get("csrf-token")
    header_csrf = req.headers.get("x-csrf-token")
    if not cookie_csrf or not header_csrf or cookie_csrf != header_csrf:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
