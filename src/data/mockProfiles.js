/**
 * Mock Profiles Dataset for Mi Vitae
 * 5 distinct professional archetypes corresponding to the 5 polymorphic themes
 */

export const INITIAL_MOCK_PROFILES = {
  abogado_consultor: {
    username: "abogado_consultor",
    theme: "minimalist",
    plan: "premium",
    status: "active",
    createdAt: "2025-01-15",
    personalInfo: {
      name: "Lic. Ignacio Valenzuela Prieto",
      title: "Abogado Corporativo & Especialista Tributario",
      bio: "Más de 12 años de experiencia asesorando a startups de alto crecimiento y grupos empresariales en estructuras corporativas, fusiones y adquisiciones (M&A) y planificación tributaria internacional. Socio en Valenzuela & Asociados.",
      avatar: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80",
      location: "Santiago, Chile / Remoto LatAm",
      email: "ivalenzuela@valenzuela-abogados.cl",
      phone: "+56 9 8456 1234",
      whatsapp: "+56984561234",
      linkedin: "https://linkedin.com/in/ignacio-valenzuela-tax",
      github: "",
      website: "https://valenzuela-abogados.cl",
      availableForWork: true
    },
    experience: [
      {
        id: "exp-1",
        role: "Socio Principal - Derecho Tributario & M&A",
        company: "Valenzuela & Asociados Abogados",
        startDate: "2019-03",
        endDate: null,
        current: true,
        description: "Liderazgo del departamento tributario y corporativo, liderando transacciones cross-border y rondas de inversión Serie A y B por más de $45M USD.",
        achievements: [
          "Estructuración de más de 30 holdings familiares y societarios en Chile, Delaware y Uruguay.",
          "Asesoría legal continua a 15 startups fintech y biotech en escalamiento regional.",
          "Defensa tributaria exitosa ante el Servicio de Impuestos Internos (SII) con 95% de fallos favorables."
        ]
      },
      {
        id: "exp-2",
        role: "Asociado Senior Corporativo",
        company: "Carey & Cía.",
        startDate: "2014-06",
        endDate: "2019-02",
        current: false,
        description: "Redacción y negociación de contratos comerciales complejos, pactos de accionistas y due diligence para adquisiciones bancarias e inmobiliarias.",
        achievements: [
          "Participación en la adquisición de cadena logística valorada en $75M USD.",
          "Implementación de programas de compliance y prevención de delitos económicos corporativos."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "Master of Laws (LL.M.) in International Taxation",
        institution: "New York University (NYU) School of Law",
        year: "2018",
        details: "Graduado con Distinción. Tesis sobre tributación de economía digital."
      },
      {
        id: "edu-2",
        degree: "Licenciatura en Ciencias Jurídicas y Sociales (Abogado)",
        institution: "Pontificia Universidad Católica de Chile",
        year: "2013",
        details: "Máxima distinción académica (Summa Cum Laude). Voto de distinción en examen de grado."
      }
    ],
    skills: [
      { id: "sk-1", name: "Planificación Tributaria Internacional", level: 98, category: "Especialidad" },
      { id: "sk-2", name: "Fusiones & Adquisiciones (M&A)", level: 95, category: "Especialidad" },
      { id: "sk-3", name: "Pactos de Accionistas & SAFE/KISS", level: 92, category: "Corporativo" },
      { id: "sk-4", name: "Compliance & Gobierno Corporativo", level: 90, category: "Corporativo" },
      { id: "sk-5", name: "Litigios Tributarios (TTA / Cortes)", level: 88, category: "Litigios" }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Estructuración Legal Ronda Serie A (Fintech)",
        description: "Diseño contractual e instrumentación de notas convertibles y flip a Delaware para fintech chilena de pagos por $8.5M USD.",
        image: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
        tags: ["Venture Capital", "Delaware Flip", "M&A"],
        liveUrl: "https://valenzuela-abogados.cl/casos-exito",
        repoUrl: ""
      },
      {
        id: "proj-2",
        title: "Guía Práctica: Reforma Tributaria & PYMEs",
        description: "Publicación ejecutiva de 80 páginas analizando el impacto de los nuevos regímenes tributarios en medianas empresas.",
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
        tags: ["Publicación", "Tributario", "Libro"],
        liveUrl: "https://valenzuela-abogados.cl/publicaciones",
        repoUrl: ""
      }
    ],
    languages: [
      { id: "lang-1", name: "Español", level: "Nativo" },
      { id: "lang-2", name: "Inglés", level: "Bilingüe (C2 - TOEFL 115)" }
    ],
    floatingButton: {
      type: "whatsapp",
      customMessage: "Hola Ignacio, me gustaría agendar una consulta legal sobre planificación tributaria / corporativa.",
      enabled: true
    },
    analytics: {
      views: 1420,
      contactClicks: 89,
      cvDownloads: 54
    }
  },

  antonia_ux: {
    username: "antonia_ux",
    theme: "creative",
    plan: "premium",
    status: "active",
    createdAt: "2025-01-20",
    personalInfo: {
      name: "Antonia Morales Varas",
      title: "Lead Product Designer & Design Systems Specialist",
      bio: "Crafting digital experiences that merge psychology, bold aesthetics, and scalable design architecture. 8+ years designing SaaS, FinTech, and Web3 applications used by over 3M active users.",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
      location: "Viña del Mar / Santiago, Chile",
      email: "antonia.uxdesign@gmail.com",
      phone: "+56 9 9123 4567",
      whatsapp: "+56991234567",
      linkedin: "https://linkedin.com/in/antonia-ux-designer",
      github: "https://github.com/antoniamorales",
      website: "https://antonia-designs.studio",
      availableForWork: true
    },
    experience: [
      {
        id: "exp-1",
        role: "Lead Product Designer",
        company: "Fintual LatAm",
        startDate: "2021-08",
        endDate: null,
        current: true,
        description: "Dirección del equipo de experiencia de usuario para productos de inversión retail y pensiones. Re-diseño integral de la app móvil y sistema de diseño multicomponente.",
        achievements: [
          "Aumento de 34% en la tasa de activación de usuarios en sus primeros 7 días de onboarding.",
          "Creación del Design System 'Aurora' con más de 120 componentes Figma sincronizados con React/Tailwind.",
          "Mentoría a 6 diseñadores junior/semi-senior y facilitación de Design Sprints semanales."
        ]
      },
      {
        id: "exp-2",
        role: "Senior UX/UI Designer",
        company: "Cornershop by Uber",
        startDate: "2018-05",
        endDate: "2021-07",
        current: false,
        description: "Optimización del flujo de checkout y catálogo en vivo para millones de compradores simultáneos en 7 países.",
        achievements: [
          "Reducción del churn en proceso de pago en un 18% mediante micro-interacciones contextuales.",
          "Diseño del módulo de sustituciones en tiempo real para Shoppers."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "Diplomado en Interacción Persona-Computador & UX Research",
        institution: "Universidad de Chile",
        year: "2019",
        details: "Investigación cuantitativa, pruebas de usabilidad avanzadas y accesibilidad WCAG 2.1 AA."
      },
      {
        id: "edu-2",
        degree: "Licenciatura en Diseño Gráfico & Multimedia",
        institution: "Universidad Diego Portales",
        year: "2017",
        details: "Graduada con Honores. Mención en Diseño de Interfaces y Tipografía Digital."
      }
    ],
    skills: [
      { id: "sk-1", name: "Figma & Design Systems Tokens", level: 98, category: "UI/UX" },
      { id: "sk-2", name: "UX Research & User Testing", level: 92, category: "Research" },
      { id: "sk-3", name: "Prototyping & Micro-interactions (Framer/Protopie)", level: 95, category: "Prototyping" },
      { id: "sk-4", name: "HTML/CSS & Tailwind Bridging", level: 85, category: "Frontend" },
      { id: "sk-5", name: "Product Strategy & Data Analytics", level: 88, category: "Strategy" }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Aurora Design System",
        description: "Sistema de diseño polimórfico accesible y documentado para 4 aplicaciones móviles y web con soporte Dark/Light mode.",
        image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
        tags: ["Figma", "Design Tokens", "React UI"],
        liveUrl: "https://antonia-designs.studio/aurora",
        repoUrl: "https://github.com/antoniamorales/aurora-tokens"
      },
      {
        id: "proj-2",
        title: "NeoBank Mobile Onboarding Redesign",
        description: "Reducción de pasos de verificación de identidad con IA biométrica y retroalimentación táctil en tiempo real.",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
        tags: ["FinTech", "Mobile UX", "Framer"],
        liveUrl: "https://antonia-designs.studio/neobank",
        repoUrl: ""
      }
    ],
    languages: [
      { id: "lang-1", name: "Español", level: "Nativo" },
      { id: "lang-2", name: "Inglés", level: "Avanzado Profesional (C1)" },
      { id: "lang-3", name: "Francés", level: "Intermedio (B1)" }
    ],
    floatingButton: {
      type: "whatsapp",
      customMessage: "¡Hola Antonia! Vi tu portafolio en Mi Vitae y me gustaría conversar sobre un proyecto de diseño.",
      enabled: true
    },
    analytics: {
      views: 3250,
      contactClicks: 215,
      cvDownloads: 130
    }
  },

  carlos_dev: {
    username: "carlos_dev",
    theme: "tech",
    plan: "premium",
    status: "active",
    createdAt: "2025-02-01",
    personalInfo: {
      name: "Carlos Mendoza Silva",
      title: "Staff Software Engineer & Cloud Architect",
      bio: "10+ years engineering resilient microservices, high-throughput distributed architectures, and modern web applications with React, Node.js, Go, and Kubernetes. Open-source contributor and tech speaker.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
      location: "Concepción, Chile / Global Remote",
      email: "carlos.mendoza.code@gmail.com",
      phone: "+56 9 7654 3210",
      whatsapp: "+56976543210",
      linkedin: "https://linkedin.com/in/carlos-mendoza-dev",
      github: "https://github.com/carlosmendozadev",
      website: "https://carlosmendoza.dev",
      availableForWork: true
    },
    experience: [
      {
        id: "exp-1",
        role: "Staff Software Engineer & DevOps Lead",
        company: "Global Scale Technologies (USA / Remoto)",
        startDate: "2022-01",
        endDate: null,
        current: true,
        description: "Liderazgo técnico de arquitectura en plataforma de procesamiento de eventos en tiempo real (>100k req/s). Migración de monolito a microservicios en Go y GCP.",
        achievements: [
          "Reducción de costos de infraestructura cloud en un 42% ($18k USD/mes) mediante Kubernetes autoscaling y clusters spot.",
          "Latencia P99 reducida de 350ms a 42ms implementando caché distribuido con Redis y Edge CDN.",
          "Automatización de pipelines CI/CD con GitHub Actions y ArgoCD logrando despliegues continuos sin downtime."
        ]
      },
      {
        id: "exp-2",
        role: "Senior Fullstack Engineer",
        company: "Mercado Libre Chile",
        startDate: "2018-03",
        endDate: "2021-12",
        current: false,
        description: "Desarrollo de micro-frontends en React/TypeScript y APIs críticas en Node.js/Java para la pasarela de pagos regional.",
        achievements: [
          "Manejo de picos de tráfico durante CyberDay procesando más de 1.2M de transacciones por hora.",
          "Pionero en la adopción de GraphQL y TypeScript estricto en el equipo de Checkout."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "Ingeniería Civil en Informática & Ciencias de la Computación",
        institution: "Universidad de Concepción (UdeC)",
        year: "2016",
        details: "Graduado de honor con máxima distinción. Especialidad en Sistemas Distribuidos y Redes."
      },
      {
        id: "edu-2",
        degree: "AWS Certified Solutions Architect – Professional (SAP-C02)",
        institution: "Amazon Web Services",
        year: "2023",
        details: "Certificación profesional en diseño de sistemas de alta disponibilidad y tolerancia a fallos."
      }
    ],
    skills: [
      { id: "sk-1", name: "React 19 / Next.js / TypeScript", level: 98, category: "Frontend" },
      { id: "sk-2", name: "Go / Node.js / Rust (Core)", level: 95, category: "Backend" },
      { id: "sk-3", name: "Kubernetes / Docker / Terraform", level: 94, category: "DevOps & Cloud" },
      { id: "sk-4", name: "PostgreSQL / Redis / Kafka", level: 92, category: "Databases & Streaming" },
      { id: "sk-5", name: "GraphQL / gRPC / WebSockets", level: 90, category: "APIs & Protocols" }
    ],
    projects: [
      {
        id: "proj-1",
        title: "KubePulse: Real-Time Cluster Monitor",
        description: "CLI y Web dashboard ultra-liviano en Go y React para telemetría instantánea de pods y recursos de clústeres Kubernetes.",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
        tags: ["Go", "Kubernetes", "React", "Open Source"],
        liveUrl: "https://kubepulse.carlosmendoza.dev",
        repoUrl: "https://github.com/carlosmendozadev/kubepulse"
      },
      {
        id: "proj-2",
        title: "TurboCache Engine (Rust/WASM)",
        description: "Motor de caché en memoria de ultra-baja latencia compilado a WebAssembly para optimización de queries en el navegador.",
        image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
        tags: ["Rust", "WASM", "High Performance"],
        liveUrl: "https://turbocache.carlosmendoza.dev",
        repoUrl: "https://github.com/carlosmendozadev/turbocache"
      }
    ],
    languages: [
      { id: "lang-1", name: "Español", level: "Nativo" },
      { id: "lang-2", name: "Inglés", level: "Bilingüe / Fluido Profesional (C2)" }
    ],
    floatingButton: {
      type: "linkedin",
      customMessage: "Hola Carlos, te contacto para discutir una oportunidad técnica senior / consultoría cloud.",
      enabled: true
    },
    analytics: {
      views: 4890,
      contactClicks: 340,
      cvDownloads: 290
    }
  },

  valeria_psico: {
    username: "valeria_psico",
    theme: "warm",
    plan: "trial",
    status: "trial",
    createdAt: "2025-02-12",
    personalInfo: {
      name: "Ps. Valeria Castro San Martín",
      title: "Psicóloga Clínica & Coach de Bienestar Organizacional",
      bio: "Acompaño a personas y líderes a cultivar equilibrio emocional, resiliencia y salud mental. Enfoque humanista integrativo con más de 9 años de práctica clínica y talleres corporativos en más de 20 empresas de Chile y Latinoamérica.",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
      location: "Providencia, Santiago de Chile / Online",
      email: "contacto@valeriacastro.cl",
      phone: "+56 9 6543 2109",
      whatsapp: "+56965432109",
      linkedin: "https://linkedin.com/in/valeria-castro-psicologa",
      github: "",
      website: "https://valeriacastro.cl",
      availableForWork: true
    },
    experience: [
      {
        id: "exp-1",
        role: "Directora & Terapeuta Principal",
        company: "Centro de Bienestar Integral San Martín",
        startDate: "2019-01",
        endDate: null,
        current: true,
        description: "Atención psicológica a adultos y jóvenes, supervisión de terapeutas y diseño de programas de prevención del burnout.",
        achievements: [
          "Más de 1.800 horas de sesiones clínicas individuales con 92% de satisfacción de pacientes.",
          "Creación del taller 'Gestión del Estrés y Liderazgo Empático' impartido en Banco Santander, Enel y startups.",
          "Directora del podcast 'Mente en Calma' con más de 45.000 reproducciones en Spotify."
        ]
      },
      {
        id: "exp-2",
        role: "Consultora de Clima Laboral & Salud Ocupacional",
        company: "Achs (Asociación Chilena de Seguridad)",
        startDate: "2015-04",
        endDate: "2018-12",
        current: false,
        description: "Evaluación de riesgos psicosociales (SUSESO/ISTAS 21) y mediación de conflictos en empresas industriales y de servicios.",
        achievements: [
          "Intervención exitosa en 35 empresas reduciendo licencias médicas por estrés laboral en un 28%."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "Magíster en Psicología Clínica y Psicoterapia Humanista",
        institution: "Universidad Adolfo Ibáñez (UAI)",
        year: "2018",
        details: "Tesis sobre Mindfulness aplicado al tratamiento de trastornos de ansiedad."
      },
      {
        id: "edu-2",
        degree: "Título Profesional de Psicóloga (Acreditada)",
        institution: "Pontificia Universidad Católica de Chile",
        year: "2014",
        details: "Registro Colegio de Psicólogos de Chile N° 12489."
      }
    ],
    skills: [
      { id: "sk-1", name: "Psicoterapia Individual Adultos", level: 96, category: "Clínica" },
      { id: "sk-2", name: "Mindfulness & Regulación Emocional", level: 94, category: "Técnicas" },
      { id: "sk-3", name: "Prevención del Burnout Organizacional", level: 92, category: "Corporativo" },
      { id: "sk-4", name: "Coaching de Liderazgo Consciente", level: 88, category: "Coaching" },
      { id: "sk-5", name: "Talleres y Conferencias Dinámicas", level: 95, category: "Facilitación" }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Programa 'Liderar sin Agotarse'",
        description: "Programa de 6 semanas de intervención grupal para directores ejecutivos y gerentes para conciliar alto rendimiento y salud mental.",
        image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        tags: ["Salud Mental", "Empresas", "Workshop"],
        liveUrl: "https://valeriacastro.cl/programa-liderazgo",
        repoUrl: ""
      },
      {
        id: "proj-2",
        title: "Guía Digital: '5 Pasos para Desactivar la Ansiedad'",
        description: "E-book descargable gratuito con ejercicios de respiración somática y reestructuración cognitiva para momentos de crisis.",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80",
        tags: ["E-book", "Mindfulness", "Recurso"],
        liveUrl: "https://valeriacastro.cl/guia-ansiedad",
        repoUrl: ""
      }
    ],
    languages: [
      { id: "lang-1", name: "Español", level: "Nativo" },
      { id: "lang-2", name: "Inglés", level: "Avanzado Conversacional (B2)" }
    ],
    floatingButton: {
      type: "whatsapp",
      customMessage: "Hola Valeria, me gustaría consultar por disponibilidad para una sesión de psicología / taller corporativo.",
      enabled: true
    },
    analytics: {
      views: 2150,
      contactClicks: 184,
      cvDownloads: 72
    }
  },

  rodrigo_ops: {
    username: "rodrigo_ops",
    theme: "executive",
    plan: "inactive",
    status: "inactive",
    createdAt: "2024-11-28",
    personalInfo: {
      name: "Rodrigo E. Silva Henríquez",
      title: "Chief Operating Officer (COO) & B2B Strategy Director",
      bio: "15+ años escalando operaciones comerciales, logística y tecnología en empresas multinacionales de retail y fintech. Especialista en optimización de EBITDA, transformación digital y expansión geográfica en Latinoamérica.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
      location: "Las Condes, Santiago de Chile / Miami, FL",
      email: "rodrigo.silva@strategiacapital.com",
      phone: "+56 9 5555 7890",
      whatsapp: "+56955557890",
      linkedin: "https://linkedin.com/in/rodrigo-silva-coo",
      github: "",
      website: "https://strategiacapital.com",
      availableForWork: false
    },
    experience: [
      {
        id: "exp-1",
        role: "Chief Operating Officer (COO)",
        company: "OmniLogistics LatAm Group",
        startDate: "2020-04",
        endDate: null,
        current: true,
        description: "Liderazgo de operaciones en 5 países (Chile, Perú, Colombia, México, Brasil) gestionando un equipo de 650+ personas y presupuesto anual de $35M USD.",
        achievements: [
          "Incremento del margen operativo EBITDA del 11.2% al 18.7% en 36 meses mediante automatización robótica y AI routing.",
          "Apertura y consolidación exitosa de operaciones en México y Colombia superando la meta de ingresos en +25%.",
          "Reducción de tiempos de entrega de última milla (SLA) de 48h a same-day en ciudades principales."
        ]
      },
      {
        id: "exp-2",
        role: "VP de Estrategia Comercial & Expansión",
        company: "Falabella Retail Corporativo",
        startDate: "2015-08",
        endDate: "2020-03",
        current: false,
        description: "Diseño y ejecución del plan de omnicanalidad regional e integración con centros de distribución inteligentes.",
        achievements: [
          "Dirección de la estrategia B2B Marketplace sumando a más de 4.000 vendedores asociados.",
          "Liderazgo en la renegociación de contratos marco con navieras y operadores internacionales ahorrando $6.5M USD anuales."
        ]
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "Executive MBA (Master in Business Administration)",
        institution: "INSEAD (Fontainebleau, Francia)",
        year: "2015",
        details: "Especialización en Global Operations Strategy & Private Equity."
      },
      {
        id: "edu-2",
        degree: "Ingeniería Civil Industrial",
        institution: "Universidad de Chile (FCFM)",
        year: "2009",
        details: "Graduado con Distinción Máxima. Mención en Gestión de Operaciones."
      }
    ],
    skills: [
      { id: "sk-1", name: "Estrategia Operativa & Escalado Regional", level: 98, category: "Operaciones" },
      { id: "sk-2", name: "Optimización de EBITDA & P&L Management", level: 96, category: "Finanzas" },
      { id: "sk-3", name: "Negociaciones B2B Estratégicas de Alto Nivel", level: 95, category: "Comercial" },
      { id: "sk-4", name: "Supply Chain 4.0 & Logística Automatizada", level: 92, category: "Logística" },
      { id: "sk-5", name: "Gobierno Corporativo & Directorios", level: 90, category: "Directorio" }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Expansión Regional México & Colombia",
        description: "Despliegue operativo y comercial de red logística B2B con 4 hubs automatizados y breakeven alcanzado en 14 meses.",
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
        tags: ["Expansión LatAm", "Supply Chain", "M&A"],
        liveUrl: "https://strategiacapital.com/casos/expansion",
        repoUrl: ""
      },
      {
        id: "proj-2",
        title: "Transformación Digital de Flota con IoT",
        description: "Monitoreo en tiempo real y mantenimiento predictivo para 1.200 vehículos de carga pesada.",
        image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
        tags: ["IoT", "Operaciones", "Eficiencia"],
        liveUrl: "https://strategiacapital.com/casos/iot",
        repoUrl: ""
      }
    ],
    languages: [
      { id: "lang-1", name: "Español", level: "Nativo" },
      { id: "lang-2", name: "Inglés", level: "Bilingüe Ejecutivo (C2)" },
      { id: "lang-3", name: "Portugués", level: "Fluido Profesional (C1)" }
    ],
    floatingButton: {
      type: "email",
      customMessage: "Estimado Rodrigo, me pongo en contacto para una conversación estratégica a nivel de directorio / advisory.",
      enabled: true
    },
    analytics: {
      views: 3820,
      contactClicks: 165,
      cvDownloads: 110
    }
  }
};
