import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, publicos, experiments

# ---- Logging config (simple, env-driven) ----
_level = logging.getLevelName(os.getenv('LOG_LEVEL', 'INFO').upper()) if 'os' in globals() else logging.INFO
logging.basicConfig(level=_level, format='%(asctime)s %(levelname)s %(name)s: %(message)s')

app = FastAPI(title="RIMAC API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(publicos.router)
app.include_router(experiments.router)
