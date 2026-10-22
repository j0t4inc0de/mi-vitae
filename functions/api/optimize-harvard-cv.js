/**
 * Cloudflare Pages Function: AI Harvard ATS CV Optimizer via Google Gemini
 * Endpoint: POST /api/optimize-harvard-cv (Aliased to /api/generate-harvard-cv)
 * 
 * Rewrites profile data into Harvard Business School ATS standard
 * using STAR methodology (Action Verbs + Context + Quantifiable Results)
 * with strict zero-hallucination guarantees.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gemini-key',
  'Access-Control-Max-Age': '86400'
}

// ponytail: Prioritize ultra-low-latency gemini-3.6-flash with 0 thinking tokens, falling back to flash-latest
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
]

const HARVARD_OPTIMIZATION_PROMPT = `
Eres un redactor ejecutivo de currículums de élite certificado en los estándares oficiales de Harvard Business School y algoritmos ATS (Applicant Tracking Systems como Workday, Taleo, Greenhouse y Buk).

Tu tarea es optimizar los datos de perfil profesional recibidos y estructurarlos en un formato Harvard Business School (100% compatible con sistemas ATS).

REGLAS CRÍTICAS DE CALIDAD Y VERACIDAD:
1. VERACIDAD ABSOLUTA (CERO ALUCINACIÓN):
   - NUNCA inventes empresas, instituciones, fechas, puestos de trabajo, títulos ni certificaciones que no existan en los datos recibidos.
   - Conserva los nombres de empresas, instituciones educativas, cargos y periodos de tiempo exactamente como fueron provistos.
   - Si los textos originales contienen números o métricas reales (porcentajes, montos, personas a cargo, tiempos), consérvalos y destácalos.
   - Si un logro NO contiene números explícitos, exprésalo como un impacto cualitativo u operativo tangible y profesional, pero NUNCA inventes porcentajes o cifras artificiales ficticias (ej: no inventes "aumentó un 47%" si no fue indicado).

2. RESUMEN PROFESIONAL (ESTILO HARVARD):
   - Redacta un Resumen Profesional conciso de exactamente 2 a 3 oraciones (entre 35 y 55 palabras).
   - Debe abrir con el título profesional y trayectoria/especialidad, seguido de las competencias técnicas de mayor impacto y la propuesta de valor comprobada.

3. VIÑETAS DE EXPERIENCIA (FÓRMULA STAR + VERBOS DE ACCIÓN HARVARD):
   - Para cada experiencia laboral, sintetiza la descripción y logros en 2 a 4 viñetas (bullet points) de alto impacto.
   - Cada viñeta DEBE iniciar obligatoriamente con un Verbo de Acción Fuerte en español (ej: Lideró, Diseñó, Desarrolló, Optimizó, Automatizó, Implementó, Redujo, Consolidó, Negoció, Orquestó, Estandarizó, Transformó, Desplegó, Auditó, Coordinó, Administró, Formuló, Superó).
   - Estructura STAR obligatoria: [Verbo de Acción Fuerte] + [Contexto / Proyecto / Tarea] + [Impacto Cuantificable o Resultado Tangible].
   - PROHIBIDO usar verbos pasivos o frases débiles como "Responsable de...", "Encargado de...", "Ayudé a...", "Trabajé en...", "Tareas realizadas...".

4. HABILIDADES E IDIOMAS:
   - Limpia y organiza las habilidades en categorías técnicas y de gestión/interpersonales.
   - Presenta los idiomas con su nivel estándar (Nativo, Bilingüe, Avanzado / C1-C2, Intermedio / B1-B2, Básico / A1-A2).

5. FORMATO DE SALIDA ESTRICTO:
   - Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura, sin bloques markdown, sin texto adicional ni explicaciones:

{
  "personalInfo": {
    "name": "Nombre completo",
    "title": "Titular profesional",
    "bio": "Resumen ejecutivo de 2 a 3 oraciones",
    "email": "correo@ejemplo.com",
    "phone": "+56 9 1234 5678",
    "location": "Ciudad, País",
    "website": "https://sitio.com",
    "linkedin": "https://linkedin.com/in/usuario",
    "github": ""
  },
  "username": "usuario",
  "summary": "Resumen ejecutivo de 2 a 3 oraciones",
  "experience": [
    {
      "company": "Empresa",
      "role": "Cargo",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM o null si es actual",
      "current": true o false,
      "description": "Primera viñeta destacada",
      "bullets": [
        "Lideró la iniciativa X logrando el resultado Y.",
        "Optimizó el proceso Z reduciendo tiempos de respuesta."
      ],
      "achievements": [
        "Lideró la iniciativa X logrando el resultado Y.",
        "Optimizó el proceso Z reduciendo tiempos de respuesta."
      ]
    }
  ],
  "education": [
    {
      "institution": "Universidad o Instituto",
      "degree": "Título obtenido",
      "year": "YYYY",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "current": false,
      "details": "Distinción o mención"
    }
  ],
  "certifications": [
    {
      "name": "Nombre certificación",
      "issuer": "Entidad emisora",
      "year": "YYYY"
    }
  ],
  "skills": [
    { "name": "Habilidad", "category": "technical" }
  ],
  "languages": [
    { "name": "Idioma", "language": "Idioma", "level": "Nivel" }
  ]
}
`

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  })
}

export async function onRequestPost(context) {
  const { request, env = {} } = context

  // Handle preflight defensively
  if (request.method === 'OPTIONS') {
    return onRequestOptions()
  }

  if (request.method && request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Allow': 'POST, OPTIONS'
      }
    })
  }

  try {
    const parsed = await request.json().catch(() => ({}))
    const body = (parsed && typeof parsed === 'object') ? parsed : {}
    const rawProfile = body.profile || body.profileData || body.profile_data || (body.personalInfo ? body : null)

    if (!rawProfile || (!rawProfile.personalInfo && !rawProfile.name && !rawProfile.username && !rawProfile.experience)) {
      return new Response(JSON.stringify({ error: 'No se recibieron datos de perfil validos para optimizar.' }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    }

    const geminiApiKey = env.GEMINI_API_KEY || request.headers.get('x-gemini-key')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'Servicio de IA no configurado: falta GEMINI_API_KEY en las variables de entorno de Cloudflare Pages.'
      }), {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    }

    // Clean payload before sending to LLM to prevent unnecessary token usage
    const profileToOptimize = {
      username: rawProfile.username || body.username || '',
      personalInfo: rawProfile.personalInfo || {
        name: rawProfile.name || '',
        title: rawProfile.title || '',
        bio: rawProfile.bio || '',
        email: rawProfile.email || '',
        phone: rawProfile.phone || '',
        location: rawProfile.location || '',
        website: rawProfile.website || '',
        linkedin: rawProfile.linkedin || '',
        github: rawProfile.github || ''
      },
      experience: Array.isArray(rawProfile.experience) ? rawProfile.experience : [],
      education: Array.isArray(rawProfile.education) ? rawProfile.education : [],
      certifications: Array.isArray(rawProfile.certifications) ? rawProfile.certifications : [],
      skills: Array.isArray(rawProfile.skills) ? rawProfile.skills : [],
      languages: Array.isArray(rawProfile.languages) ? rawProfile.languages : []
    }

    let lastError = null
    let rawJsonResponse = null

    for (const model of CANDIDATE_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${HARVARD_OPTIMIZATION_PROMPT}\n\nDATOS DEL PERFIL A OPTIMIZAR:\n${JSON.stringify(profileToOptimize, null, 2)}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          // ponytail: Disabling extended thinking tokens reduces latency from ~45s down to 2-4s, preventing Cloudflare 502 Bad Gateway timeouts
          thinkingConfig: { thinkingBudget: 0 }
        }
      }

      try {
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(9500),
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          const errText = await res.text()
          lastError = `Modelo ${model}: ${errText}`
          continue
        }

        const data = await res.json()
        const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (textOutput) {
          rawJsonResponse = textOutput
          break
        }
      } catch (err) {
        lastError = `Modelo ${model}: ${err.name} - ${err.message}`
        continue
      }
    }

    if (!rawJsonResponse) {
      return new Response(JSON.stringify({
        error: `Error al optimizar perfil con IA: ${lastError || 'Sin respuesta del modelo'}`
      }), {
        status: 502,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    }

    let parsedData
    try {
      let cleaned = rawJsonResponse.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      }
      parsedData = JSON.parse(cleaned)
    } catch {
      return new Response(JSON.stringify({ error: 'La respuesta de la IA no fue un formato JSON valido.' }), {
        status: 502,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      })
    }

    // Sanitize and structure output according to HarvardCvData contract
    const targetUsername = profileToOptimize.username || parsedData.username || ''
    const pInfo = parsedData.personalInfo || profileToOptimize.personalInfo || {}
    const summary = (parsedData.summary || pInfo.bio || profileToOptimize.personalInfo.bio || '').trim()

    const sanitizedData = {
      personalInfo: {
        name: (pInfo.name || profileToOptimize.personalInfo.name || '').trim(),
        title: (pInfo.title || profileToOptimize.personalInfo.title || '').trim(),
        bio: summary,
        email: (pInfo.email || profileToOptimize.personalInfo.email || '').trim(),
        phone: (pInfo.phone || profileToOptimize.personalInfo.phone || '').trim(),
        location: (pInfo.location || profileToOptimize.personalInfo.location || '').trim(),
        website: (pInfo.website || profileToOptimize.personalInfo.website || '').trim(),
        linkedin: (pInfo.linkedin || profileToOptimize.personalInfo.linkedin || '').trim(),
        github: (pInfo.github || profileToOptimize.personalInfo.github || '').trim()
      },
      username: targetUsername,
      summary,
      experience: (Array.isArray(parsedData.experience) ? parsedData.experience : profileToOptimize.experience).map((exp) => {
        const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
          ? exp.bullets
          : (Array.isArray(exp.achievements) && exp.achievements.length > 0 ? exp.achievements : [exp.description || ''])
        const cleanBullets = bullets.map((b) => (typeof b === 'string' ? b.trim() : '')).filter(Boolean)

        return {
          company: (exp.company || '').trim(),
          role: (exp.role || exp.title || '').trim(),
          startDate: exp.startDate || '',
          endDate: exp.endDate || (exp.current ? null : ''),
          current: Boolean(exp.current),
          description: cleanBullets[0] || (exp.description || '').trim(),
          bullets: cleanBullets,
          achievements: cleanBullets
        }
      }),
      education: (Array.isArray(parsedData.education) ? parsedData.education : profileToOptimize.education).map((edu) => ({
        institution: (edu.institution || '').trim(),
        degree: (edu.degree || '').trim(),
        year: (edu.year || edu.endDate || edu.startDate || '').trim(),
        startDate: (edu.startDate || '').trim(),
        endDate: (edu.endDate || edu.year || '').trim(),
        current: Boolean(edu.current),
        details: (edu.details || edu.description || '').trim(),
        description: (edu.description || edu.details || '').trim()
      })),
      certifications: (Array.isArray(parsedData.certifications) ? parsedData.certifications : profileToOptimize.certifications).map((cert) => ({
        name: (cert.name || cert.titulo || '').trim(),
        issuer: (cert.issuer || cert.emisor || '').trim(),
        year: (cert.year || cert.fecha || '').trim()
      })),
      skills: Array.isArray(parsedData.skills)
        ? parsedData.skills.map((s) => (typeof s === 'string' ? { name: s.trim(), category: 'technical' } : { name: (s.name || '').trim(), category: s.category || 'technical' })).filter((s) => s.name.length > 0)
        : profileToOptimize.skills,
      languages: Array.isArray(parsedData.languages)
        ? parsedData.languages.map((l) => (typeof l === 'string' ? { name: l.trim(), language: l.trim(), level: 'Intermedio' } : { name: (l.name || l.language || '').trim(), language: (l.language || l.name || '').trim(), level: (l.level || 'Intermedio').trim() })).filter((l) => l.name.length > 0)
        : profileToOptimize.languages
    }

    return new Response(JSON.stringify({
      success: true,
      data: sanitizedData
    }), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno del servidor' }), {
      status: 500,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json'
      }
    })
  }
}
