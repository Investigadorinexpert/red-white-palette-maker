# Backend BFF (FastAPI)

Protege el webhook de n8n sin exponer secretos en el navegador. Firma un JWT efímero por request y establece cookie HttpOnly de sesión.

## Endpoints
- `POST /api/login` → reenvía a n8n `{ form: 111, email, usuario: email, password }` y setea cookie `sid` (HttpOnly, Secure, SameSite).
- `POST /api/session` → reenvía a n8n `{ form: 333, sessionkey }` y devuelve `{ result: true|false }`.
- `POST /api/logout` → reenvía a n8n `{ form: 222, sessionkey }` y borra cookie.

## Variables de entorno (colócalas junto al `backend/app/main.py`)
Crea un archivo `.env` o exporta variables en tu servicio. Para referencia, usa esto:

```env
# --- n8n webhook JWT verification ---
# Opción 1: HMAC (HS256) - recomendada
N8N_JWT_ALG=HS256
N8N_JWT_SECRET=super-secret-hmac-key-change-me

# Opción 2: RSA (RS256) - si n8n verifica con clave pública
# N8N_JWT_ALG=RS256
# N8N_JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
# ...
# -----END PRIVATE KEY-----

# Fallback (no recomendado para público): token pre-firmado
# N8N_JWT=eyJhbGciOi...

# Webhook de n8n (Switch 111/222/333/444)
N8N_URL=https://rimac-n8n.yusqmz.easypanel.host/webhook/session

# Cookie de sesión
SESSION_COOKIE=sid
SESSION_SAMESITE=strict
SESSION_SECURE=true

# Puertos si usas el runner de `main.py` en la raíz
# FRONT_PORT=5173
# API_PORT=8000
# KONG_PROXY_PORT=8001
# KONG_ADMIN_PORT=8002
```

> **Nota**: si usas HS256, `N8N_JWT_SECRET` debe ser **el mismo secreto** configurado en la credencial **JWT Auth** de n8n. Si usas RS256, pon la **clave privada** aquí y configura en n8n la **clave pública**.

## Flujo
1. Front `POST /api/login` → BFF firma JWT (2 min) y llama a n8n → si `{auth:true, jsessionid}` entonces setea cookie `sid`.
2. Front `POST /api/session` (o en mount) → BFF llama a n8n con `form:333` y responde `{result:true|false}`.
3. Front `POST /api/logout` → BFF llama `form:222` y borra cookie.

## Kong / routing (alineación)
- Ruta `/api` → servicio **backend** (FastAPI)
- Resto (`/`) → **frontend** (Vite/estático)
- Habilita `strip_path` si expones `/api` como prefijo.
- Forward de cookies y headers: `Authorization` (servidor→n8n), `x-csrf-token`.

## Seguridad mínima
- Rate limiting en `/api/login` (por IP/email) y backoff.
- Lockout temporal tras N fallos.
- CORS en n8n puede cerrarse (ya no se llama desde el browser).

## Dev tips
- `.env` **no** se commitea. Carga variables en el servicio (systemd, docker env, etc.).
- Si cambias HS↔RS, reinicia el BFF y actualiza credenciales en n8n.
