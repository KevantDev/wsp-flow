# Guía de Despliegue 100% Gratuito en la Nube (Supabase + Render + Vercel)

## 1. Paso 1: Base de Datos PostgreSQL en Supabase

1. Crea una cuenta y un proyecto en [Supabase](https://supabase.com).
2. Ve a **Project Settings ➔ Database** y copia la cadena de conexión en modo URI (Pooler o Direct):
   ```text
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
3. Inicializa las tablas desde tu entorno local:
   ```bash
   DATABASE_URL="tu_url_de_supabase" npx prisma db push
   DATABASE_URL="tu_url_de_supabase" npm run prisma:seed
   ```

---

## 2. Paso 2: Backend NestJS en Render.com

1. En [Render](https://render.com), crea un nuevo **Web Service** conectado a tu repositorio GitHub.
2. Configuración:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma db push && npm run start:prod`
3. Variables de Entorno requeridas en Render:
   - `DATABASE_URL`: Connection string de Supabase.
   - `JWT_ACCESS_SECRET`: Clave aleatoria de 32 caracteres.
   - `JWT_REFRESH_SECRET`: Clave aleatoria de 32 caracteres.
   - `OPENAI_API_KEY`: Clave de OpenAI.
   - `OPENAI_MODEL`: `gpt-4o-mini` o `gpt-5.6-luna`.
   - `MERCADOPAGO_ACCESS_TOKEN`: Token de acceso de Mercado Pago.
   - `MERCADOPAGO_PUBLIC_KEY`: Clave pública de Mercado Pago.
   - `MERCADOPAGO_CLIENT_ID`: App ID en developers.mercadopago.com.
   - `MERCADOPAGO_CLIENT_SECRET`: Clave secreta OAuth.
   - `MERCADOPAGO_REDIRECT_URI`: URL de callback en Render (`https://tu-api.onrender.com/api/v1/payments/mercadopago/callback`).
   - `FRONTEND_URL`: URL del frontend en Vercel.
   - `CORS_ORIGIN`: `*` o dominio de Vercel.

---

## 3. Paso 3: Frontend Angular en Vercel

1. En [Vercel](https://vercel.com), crea un nuevo proyecto apuntando a tu repositorio.
2. Configuración:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Angular`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/wsp-frontend/browser`
3. Vercel asignará un dominio HTTPS gratuito (ej: `https://wsp-flow.vercel.app`).
4. Introduce este dominio en la configuración de Mercado Pago para los retornos de Checkout Pro.
