# backend/app/sse.py
import asyncio, json, os, time
from typing import AsyncGenerator
from fastapi import APIRouter, Request, Response, HTTPException, Header
from starlette.responses import StreamingResponse

router = APIRouter()

# Conexiones activas (cada conexión es una asyncio.Queue)
_connections: set[asyncio.Queue] = set()

# Ping interval para mantener viva la conexión por proxies
PING_EVERY_SEC = 20
BROADCAST_SECRET = os.getenv("SSE_BROADCAST_SECRET", "change-me")  # setéalo en env

async def _event_stream() -> AsyncGenerator[bytes, None]:
    """
    Genera chunks SSE. Mantiene un Queue por cliente.
    """
    q: asyncio.Queue = asyncio.Queue()
    _connections.add(q)
    try:
        last_ping = time.time()
        while True:
            try:
                # Espera evento o hace ping cada PING_EVERY_SEC
                timeout = max(0.0, PING_EVERY_SEC - (time.time() - last_ping))
                event = await asyncio.wait_for(q.get(), timeout=timeout)
                yield f"data: {json.dumps(event)}\n\n".encode("utf-8")
            except asyncio.TimeoutError:
                # comentario/ping SSE (no data) para evitar timeouts de proxy
                yield b": ping\n\n"
                last_ping = time.time()
    finally:
        _connections.discard(q)

@router.get("/events")
async def events(request: Request):
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        # Desactiva buffering intermedio (Kong/Nginx suelen respetar esto)
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(_event_stream(), media_type="text/event-stream", headers=headers)

@router.post("/internal/broadcast")
async def internal_broadcast(payload: dict, authorization: str = Header(default="")):
    # Seguridad simple por header (Bearer):
    token = authorization.replace("Bearer ", "")
    if token != BROADCAST_SECRET:
        raise HTTPException(status_code=401, detail="unauthorized")
    # Fan-out
    if not _connections:
        return {"broadcasted": 0}
    for q in list(_connections):
        try:
            q.put_nowait(payload)
        except Exception:
            pass
    return {"broadcasted": len(_connections)}
