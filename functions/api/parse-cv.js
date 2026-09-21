/**
 * Cloudflare Pages Function: AI CV Parser via Google Gemini Flash Multimodal
 * Endpoint: POST /api/parse-cv
 * 
 * Safely extracts structured portfolio data from uploaded PDF curriculum vitae.
 */

// ponytail: Prioritize ultra-low latency gemini-3.1-flash-lite (~5s) followed by stable fallbacks
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.6-flash'
]

const CV_EXTRACTION_PROMPT = `
Eres un asistente experto en estructuración de portafolios web profesionales.
Analiza el Currículum Vitae (PDF) adjunto y extrae TODO su contenido relevante en un único objeto JSON válido con esta estructura exacta:

{
  "personalInfo": {
    "name": "Nombre completo del profesional",
    "title": "Titular profesional o profesión (ej: Kinesiólogo, Ingeniero de Software)",
    "bio": "Resumen profesional conciso y atractivo de máximo 2 a 3 oraciones (entre 35 y 55 palabras). Si el perfil original es un párrafo extenso, sintetízalo destacando solo especialidad y propuesta de valor.",
    "email": "Correo electrónico de contacto",
    "phone": "Teléfono con código de país si está presente",
    "location": "Ciudad y país",
    "website": "",
    "linkedin": "",
    "github": ""
  },
  "experience": [
    {
      "company": "Nombre de la empresa o institución",
      "role": "Cargo o posición",
      "startDate": "YYYY-MM o YYYY",
      "endDate": "YYYY-MM o null si es actual",
      "current": true o false,
      "description": "Breve descripción directa de 1 a 2 oraciones (máximo 30 palabras).",
      "achievements": ["Logro o responsabilidad destacada concisa (máximo 20 palabras)"]
    }
  ],
  "education": [
    {
      "institution": "Universidad, instituto o colegio",
      "degree": "Título, carrera, grado o certificación",
      "startDate": "YYYY-MM o YYYY",
      "endDate": "YYYY-MM o YYYY o null",
      "current": false,
      "description": "Mención de honor o especialidad (o vacío)"
    }
  ],
  "skills": [
    { "name": "Nombre de la habilidad", "category": "technical", "level": 85 }
  ],
  "projects": [
    {
      "title": "Nombre del proyecto, iniciativa o internado",
      "description": "Breve descripción de 1 o 2 oraciones",
      "tags": ["Tecnología o área"],
      "liveUrl": "",
      "repoUrl": ""
    }
  ],
  "languages": [
    { "language": "Español", "level": "Nativo" }
  ]
}

Reglas estrictas:
1. Devuelve ÚNICAMENTE el objeto JSON válido, sin bloques markdown (\`\`\`json), sin texto introductorio ni explicaciones.
2. Usa exactamente las llaves camelCase en inglés especificadas ("personalInfo", "experience", "education", "skills", "projects", "languages"). NUNCA uses snake_case como personal_info o professional_experience.
3. Si un campo no está presente, usa "" para texto o [] para listas.
4. Para habilidades (skills), devuelve siempre un array de objetos con name, category ("technical" o "soft") y level (entero entre 60 y 100).
5. Sintetiza los textos extensos para que sean ágiles de leer en un portafolio web.
`

export async function onRequestPost(context) {
  const { request, env } = context

  if (request.method && request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Allow': 'POST' }
    })
  }

  try {
    const contentType = request.headers.get('content-type') || ''
    let base64Pdf = null

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      base64Pdf = body.fileBase64 || body.base64 || body.pdfBase64
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') || formData.get('cv') || formData.get('pdf')
      // ponytail: Guard against oversized files before buffering into Edge memory
      if (file) {
        if (file.size && file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'El archivo PDF excede el límite máximo de 10MB.' }), {
            status: 413,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        if (typeof file.arrayBuffer === 'function') {
          const buffer = await file.arrayBuffer()
          const uint8 = new Uint8Array(buffer)
          let binary = ''
          const chunkSize = 8192
          for (let i = 0; i < uint8.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunkSize))
          }
          base64Pdf = btoa(binary)
        }
      }
    }

    if (!base64Pdf) {
      return new Response(JSON.stringify({ error: 'No se recibió ningún archivo PDF para procesar.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Strip data URI prefix if present
    if (base64Pdf.includes(';base64,')) {
      base64Pdf = base64Pdf.split(';base64,')[1]
    }
    base64Pdf = base64Pdf.trim()

    // Validate size (strict 10MB limit: 10 * 1024 * 1024 bytes = 13,981,016 base64 chars)
    if (base64Pdf.length > 13981016) {
      return new Response(JSON.stringify({ error: 'El archivo PDF excede el límite máximo de 10MB.' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const geminiApiKey = env.GEMINI_API_KEY || request.headers.get('x-gemini-key')

    if (!geminiApiKey) {
      return new Response(JSON.stringify({
        error: 'Servicio de IA no configurado: falta GEMINI_API_KEY en las variables de entorno de Cloudflare Pages.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Loop through candidate models
    let lastError = null
    let rawJsonResponse = null

    for (const model of CANDIDATE_MODELS) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiApiKey)}`

      const payload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Pdf
                }
              },
              {
                text: CV_EXTRACTION_PROMPT
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          // ponytail: Disabling extended thinking tokens reduces latency from ~50s down to ~5s, preventing Cloudflare 502 Bad Gateway timeouts
          thinkingConfig: { thinkingBudget: 0 }
        }
      }

      // ponytail: Single quick retry on 503 (high demand) or 429 before jumping to fallback model
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!res.ok) {
            const errText = await res.text()
            lastError = `Modelo ${model}: ${errText}`
            if ((res.status === 503 || res.status === 429) && attempt === 0) {
              await new Promise(r => setTimeout(r, 1200))
              continue
            }
            break
          }

          const data = await res.json()
          const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text
          if (textOutput) {
            rawJsonResponse = textOutput
            break
          }
        } catch (err) {
          lastError = err.message
          break
        }
      }

      if (rawJsonResponse) break
    }

    if (!rawJsonResponse) {
      const isQuotaOrRateLimit = lastError && (lastError.includes('429') || lastError.includes('RESOURCE_EXHAUSTED'))
      const isHighDemand = lastError && (lastError.includes('503') || lastError.includes('high demand') || lastError.includes('UNAVAILABLE'))
      
      let friendlyError = 'No se pudo procesar el PDF, intenta de nuevo.'
      if (isHighDemand) {
        friendlyError = 'Los servidores de IA están experimentando una alta demanda temporal. Por favor espera unos segundos e intenta nuevamente.'
      } else if (isQuotaOrRateLimit) {
        friendlyError = 'Límite de cuota de IA alcanzado temporalmente. Por favor espera 30-60 segundos e intenta nuevamente.'
      }

      return new Response(JSON.stringify({
        error: friendlyError,
        details: lastError
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ponytail: Robust markdown code fence extraction and JSON boundary locator
    let cleaned = rawJsonResponse.trim()
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim()
    } else {
      const firstBrace = cleaned.indexOf('{')
      const lastBrace = cleaned.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.slice(firstBrace, lastBrace + 1)
      }
    }

    let parsed = {}
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return new Response(JSON.stringify({
        error: 'La IA no devolvió un formato JSON estructurado válido.',
        raw: cleaned
      }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ponytail: Helper to extract safe strings and prevent proto injection
    const str = (val, fallback = '') => typeof val === 'string' ? val.trim() : (val ? String(val).trim() : fallback)
    const now = Date.now()
    const pInfo = (parsed.personalInfo && typeof parsed.personalInfo === 'object') 
      ? parsed.personalInfo 
      : ((parsed.personal_info && typeof parsed.personal_info === 'object') ? parsed.personal_info : (parsed.personal || {}))
    const contact = (pInfo.contact && typeof pInfo.contact === 'object') ? pInfo.contact : (parsed.contact || {})

    // Normalize and add unique IDs for React keys with defensive fallbacks for diverse CV styles
    const sanitizedProfile = {
      personalInfo: {
        name: str(pInfo.name || pInfo.fullName || pInfo.full_name || parsed.nombre),
        title: str(pInfo.title || pInfo.profession || pInfo.headline || parsed.profesion || parsed.titulo),
        bio: str(pInfo.bio || pInfo.summary || parsed.about_me || parsed.sobre_mi || parsed.resumen || parsed.perfil),
        email: str(pInfo.email || contact.email || parsed.email),
        phone: str(pInfo.phone || contact.phone || parsed.telefono),
        location: str(pInfo.location || contact.location || contact.address || parsed.ubicacion),
        website: str(pInfo.website || contact.website || parsed.website),
        linkedin: str(pInfo.linkedin || contact.linkedin || parsed.linkedin),
        github: str(pInfo.github || contact.github || parsed.github),
        availableForWork: true
      },
      experience: (Array.isArray(parsed.experience) ? parsed.experience : (Array.isArray(parsed.professional_experience) ? parsed.professional_experience : (Array.isArray(parsed.experiencia_laboral) ? parsed.experiencia_laboral : []))).map((e, idx) => {
        if (typeof e === 'string') {
          return {
            id: `exp-${now}-${idx}`,
            company: '',
            role: e,
            startDate: '',
            endDate: null,
            current: false,
            description: '',
            achievements: []
          }
        }
        const periodStr = str(e.period || e.periodo)
        const isCurrent = Boolean(e.current || (periodStr && /presente|actual|fecha/i.test(periodStr)))
        return {
          id: (typeof e.id === 'string' && e.id.startsWith('exp-')) ? e.id : `exp-${now}-${idx}`,
          company: str(e.company || e.organization || e.institution || e.empresa || e.institucion),
          role: str(e.role || e.cargo || e.position || e.puesto || e.title),
          startDate: str(e.startDate || e.inicio || (periodStr.split(/[-–—]/)[0] || '')),
          endDate: isCurrent ? null : (e.endDate || (periodStr.includes('-') || periodStr.includes('–') ? str(periodStr.split(/[-–—]/)[1] || '') : null)),
          current: isCurrent,
          description: str(e.description || e.descripcion || e.resumen),
          achievements: Array.isArray(e.achievements) 
            ? e.achievements.map(a => str(a)).filter(Boolean) 
            : (Array.isArray(e.actividades) ? e.actividades.map(a => str(a)).filter(Boolean) : (Array.isArray(e.logros) ? e.logros.map(a => str(a)).filter(Boolean) : []))
        }
      }),
      education: (Array.isArray(parsed.education) ? parsed.education : (Array.isArray(parsed.educacion) ? parsed.educacion : (Array.isArray(parsed.formacion) ? parsed.formacion : []))).map((e, idx) => {
        if (typeof e === 'string') {
          return {
            id: `edu-${now}-${idx}`,
            institution: '',
            degree: e,
            startDate: '',
            endDate: null,
            current: false,
            description: ''
          }
        }
        return {
          id: (typeof e.id === 'string' && e.id.startsWith('edu-')) ? e.id : `edu-${now}-${idx}`,
          institution: str(e.institution || e.institucion || e.university || e.universidad || e.organization),
          degree: str(e.degree || e.titulo || e.carrera || e.grado || e.title),
          startDate: str(e.startDate || e.inicio || e.year || e.ano),
          endDate: e.endDate || (e.year ? str(e.year) : null),
          current: Boolean(e.current),
          description: str(e.description || e.descripcion || e.thesis || e.tesis)
        }
      }),
      skills: (Array.isArray(parsed.skills) ? parsed.skills : (Array.isArray(parsed.habilidades) ? parsed.habilidades : (Array.isArray(parsed.competencias) ? parsed.competencias : []))).map((s) => {
        if (typeof s === 'string') {
          const isSoft = /liderazgo|comunicaci|empat|equipo|adaptaci|tolerancia|resoluci|compromiso|proactiv/i.test(s)
          return {
            name: s.trim(),
            category: isSoft ? 'soft' : 'technical',
            level: 85
          }
        }
        const name = str(s.name || s.habilidad || s.skill || s.title)
        const category = s.category === 'soft' ? 'soft' : 'technical'
        const level = typeof s.level === 'number' && !Number.isNaN(s.level) ? Math.min(100, Math.max(10, Math.round(s.level))) : 85
        return { name, category, level }
      }).filter(s => s.name.length > 0),
      projects: (Array.isArray(parsed.projects) ? parsed.projects : (Array.isArray(parsed.proyectos) ? parsed.proyectos : [])).map((p, idx) => {
        if (typeof p === 'string') {
          return {
            id: `proj-${now}-${idx}`,
            title: p,
            description: '',
            tags: [],
            liveUrl: '',
            repoUrl: ''
          }
        }
        return {
          id: (typeof p.id === 'string' && p.id.startsWith('proj-')) ? p.id : `proj-${now}-${idx}`,
          title: str(p.title || p.name || p.nombre || p.titulo),
          description: str(p.description || p.descripcion || (Array.isArray(p.details) ? p.details.join('. ') : '')),
          tags: Array.isArray(p.tags) ? p.tags.map(t => str(t)).filter(Boolean) : (Array.isArray(p.technologies) ? p.technologies.map(t => str(t)).filter(Boolean) : []),
          liveUrl: str(p.liveUrl || p.live_url || p.url),
          repoUrl: str(p.repoUrl || p.repo_url || p.github)
        }
      }),
      languages: (Array.isArray(parsed.languages) ? parsed.languages : (Array.isArray(parsed.idiomas) ? parsed.idiomas : [])).map((l) => {
        if (typeof l === 'string') {
          return { language: l, level: 'Intermedio' }
        }
        return {
          language: str(l.language || l.idioma || l.name),
          level: str(l.level || l.nivel, 'Intermedio')
        }
      }).filter(l => l.language.length > 0)
    }

    return new Response(JSON.stringify({
      success: true,
      data: sanitizedProfile
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
