# 🚀 Plan de Implementación — Mi Vitae (Metodología XP)
**Proyecto:** Mi Vitae — Tu CV Online como Portafolio Web Profesional  
**Dominio Oficial:** `mi-vitae.wearesamod.com`  
**Ubicación:** `D:\Proyectos\Paginas\Ficheros Fullstack\mi-vitae`  
**Autor:** Juan Erices (We Are Samod)  
**Metodología:** Extreme Programming (XP) — Iteraciones Cortas, Simplicidad (KISS/YAGNI), Feedback Continuo y Despliegues Frecuentes.  
**Estado General:** 🟩 **5 de 5 Iteraciones COMPLETADAS (100% de Avance — Producto Certificado para Producción)**

---

## 🎯 1. Visión y Objetivos del Producto

### El Problema
El 90% de los profesionales y estudiantes en Chile y Latinoamérica siguen enviando currículums en PDF estáticos que no destacan, se pierden en WhatsApp y quedan desactualizados. Construir un portafolio web tradicional requiere contratar programadores o pagar planes costosos de $15-25 USD/mes en plataformas en inglés (Wix, Squarespace). Tras el cierre de *Read.cv* y *Bento.me*, el mercado hispanohablante carece de una plataforma rápida, bonita y accesible.

### La Solución
**Mi Vitae** permite a cualquier persona crear un portafolio web profesional e interactivo en menos de 5 minutos con:
1. **Link personal único:** `mi-vitae.wearesamod.com/[username]`
2. **5 Temas visuales especializados:** Minimalista, Creativo, Técnico, Cálido y Ejecutivo.
3. **Herramientas de conversión:** Botón flotante de WhatsApp directo, código QR descargable para tarjetas físicas, exportador a PDF y badge "Disponible para trabajar".
4. **Precio imbatible:** **$3.490 CLP/mes** (con 1er mes gratis al completar formulario de feedback).

---

## 🛠️ 2. Stack Tecnológico & Arquitectura

| Capa | Tecnología | Justificación XP / Rendimiento |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite** | Velocidad de desarrollo extrema, HMR instantáneo y bundle ultra ligero. |
| **Estilos & UI** | **Tailwind CSS + Lucide Icons** | Diseño responsivo moderno, paleta polimórfica para los 5 temas. |
| **Estado Global** | **Zustand** | Estado reactivo minimalista con persistencia local (`persist`), sin boilerplate. |
| **Utilidades de Conversión** | **QRCode Canvas + Print CSS** | Generación de QR en PNG 1024x1024 y descarga de CV PDF directamente en el cliente a costo $0 de servidor. |
| **Optimización de Imágenes**| **HTML5 Canvas Compression** | Compresión nativa de avatares y fotos de proyectos (< 200 KB) con 0 dependencias externas. |
| **Persistencia Local / Cloud**| **LocalStorage + Supabase Ready** | Modo offline inmediato con esquema listo para sincronizar con backend/DB. |
| **Contenerización** | **Docker + Nginx Alpine** | Despliegue contenerizado multi-stage para `jota-server` con gzip y caché inmutable. |

---

## 🔄 3. Ciclo de Iteraciones XP (User Stories & Acceptance Criteria)

```
                                  ┌─── [✅ COMPLETADA] Iteración 1: Core Arquitectónico & 5 Temas Polimórficos
                                  ├─── [✅ COMPLETADA] Iteración 2: Landing Page de Alta Conversión & Live Demo
MI VITAE (Plan de Iteraciones) ───┼─── [✅ COMPLETADA] Iteración 3: Portafolios Públicos (/[username]) & Extras Virales
                                  ├─── [✅ COMPLETADA] Iteración 4: Live Studio / Editor en Tiempo Real
                                  └─── [✅ COMPLETADA] Iteración 5: Autenticación, Super Admin, Pagos & Despliegue
```

---

### 📦 Iteración 1: Core Arquitectónico & Sistema de 5 Temas — [✅ COMPLETADA]
*Objetivo:* Establecer la base del proyecto, sistema de rutas y los 5 motores visuales de portafolio.

* **US-1.1: Inicialización y Router Modular** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Proyecto Vite + React 19 + Tailwind CSS configurado limpiamente.
    - Router SPA que soporte `/` (Landing), `/[username]` (Portafolio Público), `/dashboard` (Editor) y `/admin` (Super Admin).
* **US-1.2: Motor de 5 Temas Polimórficos** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - `Minimalista:` Fondo blanco/marfil, serif/sans moderna, líneas sutiles (ideal abogados, consultores).
    - `Creativo:` Dark glassmorphism, orbes de luz, acentos violeta/cyan (ideal diseñadores, artistas).
    - `Técnico:` Estilo terminal/hacker, verde neón/cyan sobre negro puro, badges de código (ideal desarrolladores, ingenieros).
    - `Cálido:` Tonos tierra, tarjetas acogedoras, fotos circulares grandes (ideal profesores, psicólogos, coaches).
    - `Ejecutivo:` Azul corporativo `#0B132B`, métricas destacadas, líneas de tiempo formales (ideal gerentes, B2B).
* **US-1.3: Modelo de Datos & Zustand Store** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Store reactivo con 5 perfiles mock completos para validar los 5 temas al instante.

---

### 📦 Iteración 2: Landing Page de Alta Conversión & Live Demo — [✅ COMPLETADA]
*Objetivo:* Crear una vitrina pública que explique el valor, permita probar los temas en vivo y valide usernames.

* **US-2.1: Hero Interactivo con Live Demo** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Hero principal con título de alto impacto y demostrador interactivo que cambia de tema con 1 clic en tiempo real.
* **US-2.2: Validador de Username en Tiempo Real** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Input de verificación con debounce de 200ms que comprueba disponibilidad y muestra el link final `mi-vitae.wearesamod.com/[username]`.
* **US-2.3: Showcase de Temas, Precios & FAQ** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Sección explicativa en 3 pasos: *1. Crea tu cuenta -> 2. Llena tu info -> 3. Comparte tu link*.
    - Tarjeta de precio clara: **$3.490 CLP/mes** con badge destacado *"1er mes gratis con feedback"*.
    - Sección de Preguntas Frecuentes (FAQ) y footer con marca de agua oficial.

---

### 📦 Iteración 3: Portafolio Público `/[username]` & Extras Virales — [✅ COMPLETADA]
*Objetivo:* Renderizar el portafolio público de cualquier usuario con herramientas de contacto y viralidad.

* **US-3.1: Vista de Portafolio Dinámica** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Secciones completas: Header, Bio, Experiencia (Timeline), Educación, Habilidades con barras visuales, Proyectos con links e imágenes, Idiomas y Certificaciones.
* **US-3.2: Botón Flotante Personalizable** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Botón de acción rápida multicanal: WhatsApp directo con mensaje predefinido, LinkedIn, Teléfono o Email.
* **US-3.3: Código QR Dinámico Descargable** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Modal con código QR generado en Canvas en tiempo real con el link del usuario, listo para descargar en alta resolución (1024x1024 px PNG) para tarjetas de presentación.
* **US-3.4: Exportador de CV a PDF** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Reglas `@media print` para generación limpia de PDF con 1 clic adaptada a formato ejecutivo.
* **US-3.5: Badge "Disponible para Trabajar" & Footer Viral** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Badge verde pulsante opcional y footer con enlace de captación viral (*"Creado con Mi Vitae"*).

---

### 📦 Iteración 4: Live Studio / Editor en Tiempo Real — [✅ COMPLETADA]
*Objetivo:* Permitir al usuario crear y modificar su portafolio viendo los cambios al instante.

* **US-4.1: Editor Split-Screen con Live Preview** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Pantalla dividida: Formulario modular estructurado a la izquierda y visualización en vivo a la derecha.
    - Toggle de vista previa para simular dispositivos móviles (smartphone notch frame) y pantallas de escritorio.
* **US-4.2: CRUD Modular de Secciones** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Edición ágil de datos personales, experiencia, educación, habilidades, proyectos, idiomas y botón flotante con persistencia en Zustand y LocalStorage.
* **US-4.3: Compresión de Fotos en Cliente (0 Dependencias)** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Procesamiento de imágenes mediante Canvas nativo que escala y comprime avatares y fotos de proyectos a menos de 200 KB antes de persistir.
* **US-4.4: Panel de Analytics Básicos** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Métricas de visitas totales, clics en WhatsApp/contacto y descargas de CV con tasa de conversión estimada.

---

### 📦 Iteración 5: Autenticación, Super Admin, Pagos & Despliegue — [✅ COMPLETADA]
*Objetivo:* Gestión de acceso, administración de usuarios, pasarela de pago y empaquetado para despliegue.

* **US-5.1: Flujo de Auth & Registro con 1er Mes Gratis ($0 CLP)** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Modal de registro en 3 pasos con validación de handle en tiempo real, formulario de feedback cualitativo (área profesional, obstáculos de CV, origen), animación de confeti a 60 FPS y voucher de activación inmediata.
* **US-5.2: Panel Super Admin con KPIs Globales** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Dashboard de métricas globales (Total de portafolios, usuarios activos, MRR proyectado en CLP, tráfico acumulado, tasa de conversión global), filtros dinámicos, creación de demos en 1 clic y exportación de base de datos a CSV.
* **US-5.3: Integración de Pagos Flow.cl (Chile)** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Modal de pasarela de pago para medios chilenos (Webpay Plus, Mach/Chek, Servipag, Banco Estado) con simulación interactiva, generación de orden/código de autorización y descarga de comprobante en TXT.
* **US-5.4: Dockerización y Despliegue en Producción** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - `Dockerfile` multi-stage con Node 20 y Nginx Alpine.
    - `docker-compose.yml` configurado con red externa `samod-network` y variables de proxy virtual para `mi-vitae.wearesamod.com`.
    - `nginx.conf` optimizado con compresión Gzip, headers de seguridad HTTP, caché inmutable de 1 año para assets Vite y soporte SPA fallback.

---

### ☁️ Iteración 6: Infraestructura Serverless, Cloudflare Pages & Supabase Cloud — [✅ Completada]
*Objetivo:* Migración desde el entorno local/contenedor a la infraestructura serverless $0/mes global de alta disponibilidad.

* **US-6.1: Repositorio GitHub & Despliegue en Cloudflare Pages** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Repositorio Git inicializado y vinculado a GitHub (`j0t4inc0de/mi-vitae`).
    - Despliegue continuo (CI/CD) conectado a **Cloudflare Pages** apuntando al subdominio `mi-vitae.wearesamod.com`.
    - SPA Fallback con `public/_redirects` y políticas de cabecera de seguridad/caché Edge con `public/_headers`.
    - Distribución global Edge a < 100ms sin depender de la red doméstica.
* **US-6.2: Backend Cloud con Supabase (Auth + PostgreSQL)** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Proyecto configurado en Supabase (Tier gratuito).
    - Tablas de base de datos relacionales completas: `profiles`, `feedbacks`, `subscriptions` y `transactions` con RLS y triggers en `supabase/schema.sql`.
    - Persistencia reactiva mediante `@supabase/supabase-js` con fallback fluido en `profileStore.js`.
    - GitHub Action cron (cada 5 días) en `.github/workflows/supabase-keepalive.yml` para prevenir el congelamiento por inactividad de Supabase.
* **US-6.3: Webhooks de Flow.cl con Cloudflare Functions** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Endpoint serverless `/api/flow-webhook` en Cloudflare Pages Functions (`functions/api/flow-webhook.js`) para recibir confirmaciones de pago reales.
    - Validación de seguridad HMAC-SHA256 con Edge Web Crypto API de Flow.cl antes de autorizar planes.
    - Actualización automática del estado del usuario a `premium` en Supabase Cloud.
    - Creación de órdenes serverless segura con `/api/create-flow-order`.
* **US-6.4: Envío de Correos Transaccionales con Resend API** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Endpoint serverless `/api/send-email` (`functions/api/send-email.js`) y cliente `src/lib/emailService.js`.
    - Plantillas HTML de alto impacto: bienvenida con voucher de activación 1er mes gratis, comprobante de pago Flow y recordatorio de vencimiento de prueba.
* **US-6.5: Cloudflare R2 para Almacenamiento de Fotos & Portafolios** `[✅ Completada]`
  * *Criterios de Aceptación:*
    - Endpoint serverless `/api/upload-avatar` (`functions/api/upload-avatar.js`) para guardar avatares en bucket R2 sin costo de salida (0 egress fees).

---

## 📈 4. Métricas de Éxito del Producto

1. **Tiempo de carga inicial:** $< 0.5\text{ s}$ en móvil y desktop servido globalmente por la red Anycast de Cloudflare Pages.
2. **Tiempo de creación de portafolio:** $< 5\text{ minutos}$ para un usuario nuevo con el Live Studio.
3. **Costo de infraestructura inicial:** **$0 CLP fijo mensual** ejecutado sobre Cloudflare Pages + Supabase Free Tier + R2 + Resend.
4. **Conversión a pago:** Ratio objetivo $> 15\%$ tras finalizar el mes de prueba bonificado mediante Flow.cl.

