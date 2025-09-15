from fastapi import Depends, HTTPException, Request
from .security import verify_token, get_cookie, check_csrf
from .config import settings

# Optional Redis (async). If REDIS_URL not set or lib missing, returns None.
try:
    from redis.asyncio import Redis  # type: ignore
except Exception:  # pragma: no cover
    Redis = None

_redis_client = None

async def get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not settings.REDIS_URL or Redis is None:
        _redis_client = None
    else:
        _redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client

# --- Existing auth dependency ---

def auth_required(req: Request):
    token = get_cookie(req, "access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing access token")
    if req.method in {"POST", "PUT", "PATCH", "DELETE"}:
        check_csrf(req)
    claims = verify_token(token)
    return {"user": claims.get("sub")}
