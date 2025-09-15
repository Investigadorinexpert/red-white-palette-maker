from fastapi import Depends, HTTPException, Request
from .security import verify_token, get_cookie, check_csrf

def auth_required(req: Request):
    token = get_cookie(req, "access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Missing access token")
    if req.method in {"POST", "PUT", "PATCH", "DELETE"}:
        check_csrf(req)
    claims = verify_token(token)
    return {"user": claims.get("sub")}
