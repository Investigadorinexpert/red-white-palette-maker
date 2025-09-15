from pydantic import BaseModel
from datetime import timedelta
import os
from typing import List

class Settings(BaseModel):
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-me-super-secret')
    ACCESS_TOKEN_EXPIRES: int = int(os.getenv('ACCESS_TOKEN_EXPIRES', '30'))
    REFRESH_TOKEN_EXPIRES: int = int(os.getenv('REFRESH_TOKEN_EXPIRES', '43200'))

    # Ports injected by run_all.sh (random per deploy)
    FRONT_PORT: int = int(os.getenv('FRONT_PORT', '5173'))
    SERVER_IP: str = os.getenv('SERVER_IP', 'localhost')

    # Compat and extensions
    LEGACY_CORS_ORIGIN: str = os.getenv('CORS_ORIGIN', 'http://localhost:5173')
    EXTRA_CORS: str = os.getenv('EXTRA_CORS', '')  # CSV extra origins

    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins = [
            self.LEGACY_CORS_ORIGIN,
            f'http://localhost:{self.FRONT_PORT}',
            f'http://127.0.0.1:{self.FRONT_PORT}',
            f'http://{self.SERVER_IP}:{self.FRONT_PORT}',
            'http://75.119.157.31',
        ]
        if self.EXTRA_CORS:
            origins += [o.strip() for o in self.EXTRA_CORS.split(',') if o.strip()]
        seen = set()
        return [o for o in origins if not (o in seen or seen.add(o))]

    @property
    def access_delta(self):
        return timedelta(minutes=self.ACCESS_TOKEN_EXPIRES)

    @property
    def refresh_delta(self):
        return timedelta(minutes=self.REFRESH_TOKEN_EXPIRES)

settings = Settings()
