from datetime import datetime, timedelta, timezone
from typing import Any, Dict
from fastapi import HTTPException, Request
from .config import settings

ALGO = "HS256"

# Try PyJWT first, then python-jose. If none available, gracefully degrade.
_HAS_PYJWT = False
_HAS_JOSE = False

try:
    import jwt as _pyjwt  # PyJWT
    _HAS_PYJWT = hasattr(_pyjwt, 'encode')
except Exception:  # pragma: no cover
    _pyjwt = None

try:
    from jose import jwt as _josejwt  # python-jose
    _HAS_JOSE = True
except Exception:  # pragma: no cover
    _josejwt = None


def _encode(payload: Dict[str, Any]) -> str:
    if _HAS_PYJWT:
        return _pyjwt.encode(payload, settings.SECRET_KEY, algorithm=ALGO)
    if _HAS_JOSE:
        return _josejwt.encode(payload, settings.SECRET_KEY, algorithm=ALGO)
    # No JWT backend available – return empty string to signal "disabled"
    return ""


def _decode(token: str) -> Dict[str, Any]:
    if _HAS_PYJWT:
        return _pyjwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
    if _HAS_JOSE:
        return _josejwt.decode(token, settings.SECRET_KEY, algorithms=[ALGO])
    raise HTTPException(status_code=401, detail="Token support not available on server")


def create_token(payload: Dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = payload.copy()
    now = datetime.now(timezone.utc)
    to_encode.update({"iat": now, "exp": now + expires_delta})
    return _encode(to_encode)


def verify_token(token: str) -> Dict[str, Any]:
    try:
        return _decode(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_cookie(req: Request, key: str) -> str | None:
    return req.cookies.get(key)


def check_csrf(req: Request):
    cookie_csrf = req.cookies.get("csrf-token")
    header_csrf = req.headers.get("x-csrf-token")
    if not cookie_csrf or not header_csrf or cookie_csrf != header_csrf:
        raise HTTPException(status_code=403, detail="CSRF validation failed")
