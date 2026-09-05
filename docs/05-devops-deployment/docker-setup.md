# Orquestación Docker y Variables de Entorno

## 1. Archivo `.env.example` (Backend)

```env
# Servidor
PORT=3000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:4200

# Base de Datos PostgreSQL
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/wsp_system_db?schema=public"

# Seguridad JWT
JWT_ACCESS_SECRET="super-secret-access-key-wsp-2026-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="super-secret-refresh-key-wsp-2026-change-in-production"
JWT_REFRESH_EXPIRATION="7d"

# WhatsApp Baileys Configuration
BAILEY_SESSION_DIR="./auth_info_baileys"
BAILEY_AUTO_RECONNECT=true
DEFAULT_COUNTRY_CODE="51"

# Motor de Inteligencia Artificial (OpenAI)
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_MODEL="gpt-4o-mini"

# Pasarela de Pagos Mercado Pago (OAuth Connect & Checkout Pro)
MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxxxxxxxxxxxxx"
MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxxxxxxxxxxxxx"
MERCADOPAGO_CLIENT_ID="xxxxxxxxxxxx"
MERCADOPAGO_CLIENT_SECRET="xxxxxxxxxxxx"
MERCADOPAGO_REDIRECT_URI="http://localhost:3000/api/v1/payments/mercadopago/callback"
```

---

## 2. Docker Compose (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  postgres_db:
    image: postgres:16-alpine
    container_name: wsp_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: wsp_system_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - wsp_network

  backend_api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: wsp_backend
    restart: always
    depends_on:
      - postgres_db
    environment:
      DATABASE_URL: "postgresql://postgres:postgrespassword@postgres_db:5432/wsp_system_db?schema=public"
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - baileys_auth_data:/app/auth_info_baileys
    networks:
      - wsp_network

  frontend_app:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: wsp_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend_api
    networks:
      - wsp_network

volumes:
  postgres_data:
  baileys_auth_data:

networks:
  wsp_network:
    driver: bridge
```
