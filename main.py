# Thin launcher to avoid duplicate apps.
# Delegates to backend/app/main.py (FastAPI app) so /api/_debug exists consistently.

import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", "35669"))
    # Ensure we run the canonical app
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=True)
