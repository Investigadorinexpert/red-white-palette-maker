# backend/app/routers/health.py
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["publicos"])

@router.get("/health")
def health():
    return {"ok": True}
