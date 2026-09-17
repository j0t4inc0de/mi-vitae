/**
 * Cloudflare Pages Function: AI CV Parser via Google Gemini Flash Multimodal
 * Endpoint: POST /api/parse-cv
 * 
 * Safely extracts structured portfolio data from uploaded PDF curriculum vitae.
 */

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash'
]

const CV_EXTRACTION_PROMPT = `
Eres un reclutador experto y analizador de currículums de clase mundial.
Analiza minuciosamente el archivo de Currículum Vitae (PDF) adjunto y extrae TODO el contenido relevante para estructurarlo en un portafolio web profesional.

Reglas estrictas de extracción:
1. Devuelve ÚNICAMENTE un objeto JSON válido, sin bloques de código markdown (\`\`\`json), sin prefacios y sin comentarios adicionales.
2. Si un campo no está presente en el currículum, usa un string vacío "" para texto o array vacío [] para listas.
3. Para experiencias laborales:
   - role: Cargo o posición desempeñada
   - company: Nombre de la empresa o institución
   - startDate: Fecha de inicio en formato YYYY-MM o YYYY
   - endDate: Fecha de fin en formato YYYY-MM o null si es el trabajo actual
   - current: true si actualmente trabaja allí o dice "Presente" / "Actualidad", false si ya finalizó
   - description: Resumen de responsabilidades del rol
   - achievements: Lista de logros o responsabilidades destacadas
4. Para educación:
   - institution: Nombre de la universidad, colegio o instituto
   - degree: Título, carrera, grado o certificación obtenida
   - startDate: Fecha de inicio en formato YYYY-MM o YYYY
   - endDate: Fecha de fin o estimada
   - current: true si está cursando actualmente
   - description: Menciones de honor, especialidad o descripción breve
5. Para habilidades (skills):
   - name: Nombre de la habilidad (ej: React, Python, Gestión de Proyectos, Negociación)
   - category: "technical" para habilidades duras/técnicas o "soft" para blandas/interpersonales
   - level: Número entero entre 60 y 100 estimando el nivel de dominio
6. Para proyectos:
   - title: Nombre del proyecto o iniciativa relevante
   - description: Breve descripción de qué resuelve o qué se construyó
   - tags: Array de strings con tecnologías o metodologías usadas
   - liveUrl: Enlace al proyecto en vivo si se menciona (o "")
   - repoUrl: Enlace a repositorio si se menciona (o "")
7. Para idiomas:
   - language: Nombre del idioma (ej: Español, Inglés, Francés)
   - level: Nivel de competencia (ej: Nativo, Avanzado C1, Intermedio B2, Básico)
8. Para personalInfo:
   - name: Nombre completo del profesional
   - title: Titular profesional o profesión (ej: "Ingeniero de Software Senior | Fullstack Developer")
   - bio: Resumen o extracto profesional atractivo de 1 o 2 párrafos resaltando su trayectoria y propuesta de valor
   - email: Correo electrónico de contacto
   - phone: Teléfono con código de país si está presente
   - location: Ciudad y país
   - website: Sitio web o portafolio personal si se menciona
   - linkedin: URL o handle de LinkedIn si se menciona
   - github: URL o handle de GitHub si se menciona

Estructura JSON requerida:
{
  "personalInfo": {
    "name": "...",
    "title": "...",
    "bio": "...",
    "email": "...",
    "phone": "...",
    "location": "...",
    "website": "...",
    "linkedin": "...",
    "github": "..."
  },
  "experience": [
    {
      "company": "...",
      "role": "...",
      "startDate": "2022-01",
      "endDate": null,
      "current": true,
      "description": "...",
      "achievements": ["..."]
    }
  ],
  "education": [
    {
      "institution": "...",
      "degree": "...",
      "startDate": "2018-03",
      "endDate": "2022-12",
      "current": false,
      "description": "..."
    }
  ],
  "skills": [
    { "name": "...", "category": "technical", "level": 90 }
  ],
  "projects": [
    {
      "title": "...",
      "description": "...",
      "tags": ["..."],
      "liveUrl": "",
      "repoUrl": ""
    }
  ],
  "languages": [
    { "language": "Español", "level": "Nativo" }
  ]
}
`

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const contentType = request.headers.get('content-type') || ''
    let base64Pdf = null

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}))
      base64Pdf = body.fileBase64 || body.base64 || body.pdfBase64
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') || formData.get('cv') || formData.get('pdf')
      if (file && typeof file.arrayBuffer === 'function') {
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

    // Validate size (< 10MB approx 14M base64 chars)
    if (base64Pdf.length > 14 * 1024 * 1024) {
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
      try {
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
            temperature: 0.1
          }
        }

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        lastError = err.message
      }
    }

    if (!rawJsonResponse) {
      return new Response(JSON.stringify({
        error: 'No se pudo procesar el PDF con Google Gemini.',
        details: lastError
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Clean markdown code fence if present
    let cleaned = rawJsonResponse.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim()
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```$/, '').trim()
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

    // Normalize and add unique IDs for React keys
    const now = Date.now()
    const sanitizedProfile = {
      personalInfo: {
        name: parsed.personalInfo?.name || '',
        title: parsed.personalInfo?.title || '',
        bio: parsed.personalInfo?.bio || '',
        email: parsed.personalInfo?.email || '',
        phone: parsed.personalInfo?.phone || '',
        location: parsed.personalInfo?.location || '',
        website: parsed.personalInfo?.website || '',
        linkedin: parsed.personalInfo?.linkedin || '',
        github: parsed.personalInfo?.github || '',
        availableForWork: true
      },
      experience: Array.isArray(parsed.experience) ? parsed.experience.map((e, idx) => ({
        id: e.id || `exp-${now}-${idx}`,
        company: e.company || '',
        role: e.role || '',
        startDate: e.startDate || '',
        endDate: e.endDate || null,
        current: Boolean(e.current),
        description: e.description || '',
        achievements: Array.isArray(e.achievements) ? e.achievements : []
      })) : [],
      education: Array.isArray(parsed.education) ? parsed.education.map((e, idx) => ({
        id: e.id || `edu-${now}-${idx}`,
        institution: e.institution || '',
        degree: e.degree || '',
        startDate: e.startDate || '',
        endDate: e.endDate || null,
        current: Boolean(e.current),
        description: e.description || ''
      })) : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills.map((s) => ({
        name: s.name || '',
        category: s.category === 'soft' ? 'soft' : 'technical',
        level: typeof s.level === 'number' ? Math.min(100, Math.max(10, s.level)) : 85
      })) : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects.map((p, idx) => ({
        id: p.id || `proj-${now}-${idx}`,
        title: p.title || '',
        description: p.description || '',
        tags: Array.isArray(p.tags) ? p.tags : [],
        liveUrl: p.liveUrl || '',
        repoUrl: p.repoUrl || ''
      })) : [],
      languages: Array.isArray(parsed.languages) ? parsed.languages.map((l) => ({
        language: l.language || '',
        level: l.level || 'Intermedio'
      })) : []
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
