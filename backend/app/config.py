from pydantic import BaseModel
from datetime import timedelta
import os

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-super-secret")
    ACCESS_TOKEN_EXPIRES: int = int(os.getenv("ACCESS_TOKEN_EXPIRES", "30"))      # minutes
    REFRESH_TOKEN_EXPIRES: int = int(os.getenv("REFRESH_TOKEN_EXPIRES", "43200")) # 30 days in minutes
    CORS_ORIGINS: list[str] = [os.getenv("CORS_ORIGIN", "http://localhost:5173")]

    @property
    def access_delta(self): return timedelta(minutes=self.ACCESS_TOKEN_EXPIRES)
    @property
    def refresh_delta(self): return timedelta(minutes=self.REFRESH_TOKEN_EXPIRES)

settings = Settings()
