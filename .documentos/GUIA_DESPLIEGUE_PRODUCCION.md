# 🚀 Guía Maestra de Despliegue en Producción — Mi Vitae
> **Infraestructura:** Cloudflare Pages (Edge) + Cloudflare Functions (Serverless API) + Supabase Cloud (PostgreSQL & Auth) + Flow.cl (Chile) + Resend API (Correos)  
> **Costo fijo:** **$0 CLP/mes**  
> **Dominio de Producción:** `https://mi-vitae.wearesamod.com`

---

## 📊 Tablero Kanban de Despliegue

```
+---------------------------------------------------------------------------------------------------------+
|                                    ESTADO DEL DESPLIEGUE A PRODUCCIÓN                                   |
+---------------------------------------+-----------------------------+-----------------------------------+
|               ✅ COMPLETADO           |        🚧 EN CURSO          |           📋 POR HACER            |
+---------------------------------------+-----------------------------+-----------------------------------+
| [X] Paso 1: Código en GitHub          | [ ] Paso 8: Verificación    |                                   |
|     (Rama main al día y limpia)       |     E2E en producción       |                                   |
|                                       |     (Health, Auth y Flow)   |                                   |
| [X] Paso 2: Proyecto Cloudflare Pages |                             |                                   |
|     (Build Vite + Functions)          |                             |                                   |
|                                       |                             |                                   |
| [X] Paso 3: Subdominio Personalizado  |                             |                                   |
|     (mi-vitae.wearesamod.com + SSL)   |                             |                                   |
|                                       |                             |                                   |
| [X] Paso 4: Base de Datos Supabase    |                             |                                   |
|     (Tablas, RLS, Triggers y RPCs)    |                             |                                   |
|                                       |                             |                                   |
| [X] Paso 5: Variables de Entorno      |                             |                                   |
|     (Cloudflare Pages cargadas)       |                             |                                   |
|                                       |                             |                                   |
| [X] Paso 6: Integración Flow.cl       |                             |                                   |
|     (API Keys cargadas en Cloudflare) |                             |                                   |
|                                       |                             |                                   |
| [X] Paso 7: GitHub Actions Keep-Alive |                             |                                   |
|     (Cron cada 5 días verificado)     |                             |                                   |
+---------------------------------------+-----------------------------+-----------------------------------+
```

---

## 🎯 Registro de Pasos Completados

### ✅ Paso 1: Subir los Cambios a GitHub (Completado)
- Repositorio: `https://github.com/j0t4inc0de/mi-vitae.git`
- Rama principal: `main`.

### ✅ Paso 2: Crear el Proyecto en Cloudflare Pages (Completado)
- Configuración de compilación:
  - **Framework preset:** `Vite`
  - **Build command:** `npm run build`
  - **Build output directory:** `dist`

### ✅ Paso 3: Asignar el Subdominio Personalizado (Completado)
- Dominio configurado: `mi-vitae.wearesamod.com`
- Certificado SSL/TLS gestionado por Cloudflare.

### ✅ Paso 4: Inicializar la Base de Datos en Supabase Cloud (Completado)
- Script ejecutado: [`supabase/schema.sql`](../supabase/schema.sql)
- Tablas creadas: `profiles`, `feedbacks`, `subscriptions`, `transactions`.
- Políticas RLS y funciones automáticas activadas.

### ✅ Paso 5: Cargar las Variables de Entorno en Cloudflare Pages (Completado)
Variables configuradas en **Cloudflare Pages** &rarr; **Settings** &rarr; **Environment variables**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FLOW_API_KEY`
- `FLOW_SECRET_KEY`
- `FLOW_SANDBOX`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_URL` (`https://mi-vitae.wearesamod.com`)
- `ENVIRONMENT` (`production`)

---

## 📌 Próximos Pasos (Desde el Paso 6)

### ✅ Paso 6: Integración Oficial Flow.cl (Chile) (Completado)
> **¿Por qué no se necesita configurar la URL en el panel de Flow?:** Según la documentación oficial de la API de Flow (`payment/create`), Flow **no requiere** configurar la URL en el panel web. En su lugar, nuestro backend en [`functions/api/create-flow-order.js`](../functions/api/create-flow-order.js) le envía automáticamente a Flow en cada transacción:
> - `urlConfirmation`: `https://mi-vitae.wearesamod.com/api/flow-webhook`
> - `urlReturn`: `https://mi-vitae.wearesamod.com/dashboard?payment=complete&order=...`
> 
> Al haber cargado tus variables `FLOW_API_KEY`, `FLOW_SECRET_KEY` y `FLOW_SANDBOX` en Cloudflare Pages, **este paso queda 100% operativo y listo para cobrar.**

#### ¿Cómo funciona este Webhook?:
- Cuando el cliente paga con Webpay (Transbank), Servipag, Mach, o tarjetas de crédito/débito, Flow realiza una petición `POST` automática a `https://mi-vitae.wearesamod.com/api/flow-webhook`.
- La Cloudflare Function en [`functions/api/flow-webhook.js`](../functions/api/flow-webhook.js) valida la firma criptográfica HMAC-SHA256 para evitar fraudes, consulta el estado del pago con la API de Flow, y actualiza en Supabase el plan a `premium` instantáneamente.

---

### 📋 Paso 7: Configurar los Secretos de GitHub Actions (Keep-Alive Supabase)
Para asegurar que el tier gratuito de Supabase nunca pause el proyecto tras 7 días de inactividad:
1. Abre tu repositorio en GitHub: [https://github.com/j0t4inc0de/mi-vitae](https://github.com/j0t4inc0de/mi-vitae).
2. Ve a **Settings** &rarr; **Secrets and variables** &rarr; **Actions**.
3. Haz clic en **New repository secret** y añade:
   - `VITE_SUPABASE_URL`: La URL de tu proyecto Supabase (ej: `https://xxxx.supabase.co`).
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
4. El workflow automático [`.github/workflows/supabase-keepalive.yml`](../.github/workflows/supabase-keepalive.yml) ejecutará un ping cada 5 días manteniendo tu base de datos siempre activa y despierta ($0 CLP).

---

### 📋 Paso 8: Verificación Final de Producción (E2E)
Una vez configurado el Webhook:
1. **Comprobar la salud de las Serverless Functions:**
   - Abre en tu navegador: `https://mi-vitae.wearesamod.com/api/health`
   - Debe responder un JSON con estado `ok: true`.
2. **Probar el registro y autenticación:**
   - Entra a `https://mi-vitae.wearesamod.com`.
   - Crea una cuenta y verifica que acceda al Dashboard sin errores.
3. **Probar flujo de pago en Flow:**
   - Si `FLOW_SANDBOX="true"`, puedes usar las tarjetas de prueba de Webpay que Flow proporciona en su documentación para simular el pago.
   - Una vez pagado, verifica que tu perfil en Supabase actualice el plan a `premium`.
   - Cuando todo esté validado, cambia `FLOW_SANDBOX="false"` en Cloudflare Pages para recibir pagos reales en Chile.
