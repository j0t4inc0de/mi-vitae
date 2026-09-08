# 🚀 Guía Maestra de Despliegue en Producción — Mi Vitae
> **Infraestructura:** Cloudflare Pages (Edge) + Cloudflare Functions (Serverless API) + Supabase Cloud (PostgreSQL & Auth) + Flow.cl (Chile) + Resend API (Correos)  
> **Costo fijo:** **$0 CLP/mes**  
> **Dominio:** `mi-vitae.wearesamod.com`

---

## 📋 Pasos para Llevar a Producción Hoy Mismo

### Paso 1: Subir los Cambios a GitHub
El repositorio ya está enlazado a `https://github.com/j0t4inc0de/mi-vitae.git`.
Ejecuta en tu terminal:
```bash
git add .
git commit -m "feat(infra): Iteración 6 - Cloudflare Pages, Serverless Functions y Supabase Cloud"
git push origin main
```

---

### Paso 2: Crear el Proyecto en Cloudflare Pages
1. Inicia sesión en tu panel de [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. En el menú lateral, ve a **Workers & Pages** &rarr; **Create application** &rarr; pestaña **Pages**.
3. Selecciona **Connect to Git** y autoriza tu cuenta de GitHub.
4. Elige el repositorio: `j0t4inc0de/mi-vitae`.
5. En la pantalla de configuración de compilación (**Build settings**):
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** *(dejar vacío)*
6. Haz clic en **Save and Deploy**. Cloudflare compilará y desplegará en menos de 60 segundos con URL `*.pages.dev`.

---

### Paso 3: Asignar el Subdominio Personalizado
1. En tu proyecto de Cloudflare Pages, haz clic en la pestaña **Custom domains**.
2. Haz clic en **Set up a custom domain**.
3. Escribe: `mi-vitae.wearesamod.com`.
4. Si tu dominio `wearesamod.com` está gestionado en Cloudflare, se creará el registro CNAME automáticamente con SSL/TLS automático y protección DDoS.

---

### Paso 4: Inicializar la Base de Datos en Supabase Cloud
1. Entra a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Ve al menú lateral **SQL Editor** &rarr; **New Query**.
3. Abre el archivo [`supabase/schema.sql`](file:///D:/Proyectos/Paginas/Ficheros%20Fullstack/mi-vitae/supabase/schema.sql) de este repositorio, copia todo su contenido y pégalo en el editor SQL de Supabase.
4. Haz clic en **Run** (botón verde).
   - Se crearán las tablas `profiles`, `feedbacks`, `subscriptions`, `transactions`.
   - Se activarán las políticas de seguridad RLS (Row Level Security).
   - Se instalará el trigger automático para nuevos usuarios y la función RPC de analíticas.
5. Ve a **Project Settings** &rarr; **API** y copia:
   - `Project URL` (ej. `https://xyzcompany.supabase.co`)
   - `anon public` key
   - `service_role` secret key

---

### Paso 5: Cargar las Variables de Entorno en Cloudflare Pages
En Cloudflare Pages &rarr; Tu Proyecto &rarr; **Settings** &rarr; **Environment variables** &rarr; **Production**:

| Variable | Valor | Tipo |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | Texto |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (Anon public key) | Encriptado / Secret |
| `SUPABASE_SERVICE_ROLE_KEY`| `eyJhbGciOi...` (Service role secret) | Encriptado / Secret |
| `FLOW_API_KEY` | *(Tu API Key de Flow.cl)* | Encriptado / Secret |
| `FLOW_SECRET_KEY` | *(Tu Secret Key de Flow.cl)* | Encriptado / Secret |
| `FLOW_SANDBOX` | `false` (o `true` para pruebas) | Texto |
| `RESEND_API_KEY` | *(Tu API Key de resend.com)* | Encriptado / Secret |
| `RESEND_FROM_EMAIL` | `Mi Vitae <contacto@wearesamod.com>` | Texto |
| `APP_URL` | `https://mi-vitae.wearesamod.com` | Texto |
| `ENVIRONMENT` | `production` | Texto |

> Tras guardar las variables, haz clic en **Deployments** &rarr; **Retry deployment** (o haz un nuevo push a `main`) para que Vite tome las variables `VITE_*`.

---

### Paso 6: Configurar el Webhook en Flow.cl (Chile)
1. Inicia sesión en tu cuenta de comercio de [Flow.cl](https://www.flow.cl).
2. Ve a **Configuración** o **Plataforma de Integración**.
3. En la URL de confirmación (Webhook), ingresa:
   ```
   https://mi-vitae.wearesamod.com/api/flow-webhook
   ```
4. Cada vez que un usuario pague su suscripción por Webpay, Mach o Servipag, Flow notificará a este endpoint serverless, que validará la firma HMAC y activará automáticamente el plan `premium` en Supabase.

---

### Paso 7: Configurar los Secretos de GitHub Actions (Keep-Alive)
Para que Supabase Free Tier nunca se congele por inactividad:
1. En GitHub: `https://github.com/j0t4inc0de/mi-vitae` &rarr; **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
2. Agrega los siguientes secretos:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. El workflow `.github/workflows/supabase-keepalive.yml` ejecutará una petición periódica cada 5 días para mantener el proyecto siempre activo.

---

## 🎯 Verificación Final de Producción
1. Ingresa a `https://mi-vitae.wearesamod.com/api/health` para comprobar el estado de las Functions.
2. Ingresa a `https://mi-vitae.wearesamod.com` y crea una cuenta con 1er Mes Gratis ($0 CLP).
3. Revisa en Supabase Table Editor que el nuevo usuario y perfil se hayan creado en tiempo real.
