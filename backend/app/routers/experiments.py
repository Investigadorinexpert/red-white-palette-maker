from fastapi import APIRouter, Depends, HTTPException
from ..deps import auth_required

router = APIRouter(prefix="/api/experimentos", tags=["experimentos"])
DB = [{"id": "1", "nombre": "Pricing A/B", "estado": "activo"}]

@router.get("/")
def list_(_=Depends(auth_required)):
    return DB

@router.post("/")
def create(nombre: str, estado: str = "pendiente", _=Depends(auth_required)):
    if not nombre:
        raise HTTPException(status_code=400, detail="Nombre requerido")
    new = {"id": str(len(DB) + 1), "nombre": nombre, "estado": estado}
    DB.append(new)
    return new
