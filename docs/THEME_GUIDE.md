# 🎨 Guía Maestra de Creación y Arquitectura de Temas en Mi Vitae

Esta guía documenta los estándares, contrato de datos, buenas prácticas y checklist paso a paso para crear nuevos temas y estilos visuales en **Mi Vitae**, garantizando **100% de compatibilidad con cualquier perfil profesional** (desarrolladores, médicos, abogados, diseñadores, directivos, etc.).

---

## 1. Filosofía de Diseño Universal (*Anti-AI Slop & Be Lazy*)

1. **Cero textos hardcodeados de industrias o cargos:**
   - ❌ **Prohibido:** Subtítulos fijos como *"Proyectos de transformación digital y M&A"* o *"Hitos ejecutivos y responsabilidades directivas"*.
   - ✅ **Correcto:** Títulos semánticos puros como `"Experiencia Laboral"`, `"Proyectos"`, `"Educación"`. El tema aporta la **estética visual y la atmósfera tipográfica**, no el texto ni la profesión del usuario.

2. **Tolerancia absoluta a campos vacíos o nulos:**
   - Un usuario puede no tener idiomas, o no tener experiencia formal, o no tener proyectos cargados.
   - Si una sección tiene 0 elementos (`projects.length === 0`), la sección entera **no debe renderizarse**, o debe mostrar un estado sutil si el portafolio está completamente nuevo.
   - Si un campo opcional no existe (`item.achievements`, `item.description`, `personalInfo.avatar`, `personalInfo.bio`), el tema jamás debe fallar ni dejar espacios en blanco rotos.

3. **Independencia del contenido:**
   - El mismo perfil exacto debe verse impecable si se conmuta entre `Minimalist`, `Creative`, `Tech`, `Warm`, `Executive` o cualquier nuevo tema.

---

## 2. Contrato de Props y Datos

Cada tema es un componente React funcional que se ubica en `src/components/Themes/NombreTheme.jsx` y recibe dos props:

```jsx
export default function MiNuevoTheme({ profile, onRecordClick }) { ... }
```

| Prop | Tipo | Descripción |
| :--- | :--- | :--- |
| `profile` | `Object` | Objeto de perfil ya **sanitizado, ordenado y normalizado** por `ThemeRenderer`. |
| `onRecordClick` | `Function(username, channel)` | Callback opcional para analíticas en tiempo real (ej. clics en WhatsApp, LinkedIn, GitHub, email). |

### 2.1. Estructura de Datos Normalizada (`profile`)

`ThemeRenderer.jsx` se encarga de preprocesar los datos antes de entregarlos al tema. Tu componente recibirá:

```javascript
{
  username: "juan-perez",
  theme: "mi_nuevo_tema",
  personalInfo: {
    name: "Juan Pérez",
    title: "Especialista en Operaciones",
    bio: "Breve reseña personal...",
    avatar: "data:image/webp;base64,... o URL",
    location: "Santiago, Chile",
    email: "juan@ejemplo.com",
    phone: "+56912345678",
    website: "https://ejemplo.com",  // Ya normalizado con https://
    linkedin: "https://linkedin.com/in/...", // Ya normalizado con https://
    github: "https://github.com/...",     // Ya normalizado con https://
    availableForWork: true
  },
  experience: [
    {
      id: "exp-1",
      role: "Jefe de Operaciones",
      company: "Empresa S.A.",
      startDate: "2021-03",
      endDate: "2024-01",
      current: false,
      description: "Liderazgo de equipos...",
      achievements: ["Logro 1", "Logro 2"]
    }
  ],
  education: [
    {
      id: "edu-1",
      degree: "Ingeniería Comercial",
      institution: "Universidad de Chile",
      startDate: "2016-03",
      endDate: "2020-12",
      current: false,
      year: "2016-03 — 2020-12", // Pre-formateado automáticamente por ThemeRenderer
      details: "Graduado con honores"
    }
  ],
  skills: [
    { id: "sk-1", name: "Gestión de Proyectos", level: 90, category: "Liderazgo" }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Optimización de Procesos",
      description: "Implementación de automatizaciones...",
      image: "data:image/webp;base64,...",
      tags: ["Logística", "Lean"],
      liveUrl: "https://demo.com", // Ya normalizado con https://
      repoUrl: "https://github.com/..." // Ya normalizado con https://
    }
  ],
  languages: [
    { id: "lang-1", name: "Español", level: "Nativo" }
  ],
  floatingButton: {
    enabled: true,
    type: "whatsapp", // "whatsapp" | "linkedin" | "email" | "phone"
    customMessage: "Hola, vi tu portafolio..."
  }
}
```

---

## 3. Reglas de Implementación en el Código del Tema

### Regla 1: Desestructuración con valores por defecto
Siempre desestructura las listas con `[]` por defecto:
```jsx
export default function MiTema({ profile = {}, onRecordClick }) {
  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    languages = [],
    floatingButton = {}
  } = profile;
  ...
```

### Regla 2: Manejo de Fechas en Educación y Experiencia
- **Educación:** Utiliza `{edu.year}`. `ThemeRenderer` ya se encarga de formatear `startDate — endDate` o `startDate — Presente`.
- **Experiencia:**
  ```jsx
  <span>
    {item.startDate} {item.startDate && (item.endDate || item.current) ? '—' : ''} {item.current ? 'Presente' : item.endDate}
  </span>
  ```

### Regla 3: Enlaces externos seguros
Todos los enlaces externos (`<a target="_blank">`) deben incluir:
```jsx
<a
  href={proj.liveUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="..."
>
  <span>Ver Proyecto</span>
</a>
```

### Regla 4: Botón Flotante de Contacto Rápido
Incluye el botón flotante en la esquina inferior derecha respetando la configuración:
```jsx
{floatingButton?.enabled !== false && (
  <FloatingContactButton 
    buttonConfig={floatingButton}
    personalInfo={personalInfo}
    onRecordClick={onRecordClick}
  />
)}
```

### Regla 5: Código QR Integrado
Todos los temas deben permitir abrir el modal QR (`QrModal`):
```jsx
const [isQrOpen, setIsQrOpen] = useState(false)

// Botón QR en la cabecera:
<button onClick={() => setIsQrOpen(true)}>
  <QrCode className="w-4 h-4" />
  <span>Código QR</span>
</button>

// Modal al final del JSX:
<QrModal
  isOpen={isQrOpen}
  onClose={() => setIsQrOpen(false)}
  profile={profile}
  username={profile.username}
  theme={profile.theme}
/>
```

---

## 4. Checklist Paso a Paso para Agregar un Nuevo Tema

### Paso 1: Crear el Componente en `src/components/Themes/`
Crea `NuevoTheme.jsx` siguiendo las reglas anteriores (usa Tailwind CSS para estilar y Lucide React para los íconos).

### Paso 2: Registrar el Tema en `ThemeRenderer.jsx`
Abre `src/components/Themes/ThemeRenderer.jsx`:
```javascript
import NuevoTheme from './NuevoTheme'

const THEME_COMPONENTS = {
  minimalist: MinimalistTheme,
  creative: CreativeTheme,
  tech: TechTheme,
  warm: WarmTheme,
  executive: ExecutiveTheme,
  nuevo: NuevoTheme, // <-- Agregar aquí en minúsculas
}
```

### Paso 3: Agregar la Opción al Selector del Studio en `DashboardPage.jsx`
En `src/pages/DashboardPage.jsx`, agrega la definición a `THEME_OPTIONS`:
```javascript
{
  id: 'nuevo',
  name: 'Nuevo Estilo',
  desc: 'Descripción elegante de la estética visual',
  category: 'Cualquier área profesional',
  accentColor: '#3B82F6',
  bgColor: '#0F172A',
  tag: 'Moderno'
}
```

### Paso 4: Ejecutar Verificación
Corre en la terminal:
```bash
npm run build
npm test
```
Si el resultado es `0 errors`, ¡el tema está 100% operativo en producción!
