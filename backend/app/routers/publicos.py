from fastapi import APIRouter, Depends
from ..deps import auth_required

router = APIRouter(prefix="/api", tags=["publicos"])

@router.get("/publicos")
def get_publicos(_=Depends(auth_required)):
    return [
        {"id": "1", "nombre": "Equipo A", "estado": "activo"},
        {"id": "2", "nombre": "Equipo B", "estado": "inactivo"},
        {"id": "3", "nombre": "Equipo C", "estado": "pendiente"},
    ]
