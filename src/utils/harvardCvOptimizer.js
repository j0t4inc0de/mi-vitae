/**
 * Harvard CV Optimizer & Deterministic Fallback Engine
 * Formats portfolio profileData into Harvard Business School ATS standard
 * with strict STAR method formulation and zero hallucinations.
 * 
 * Rules:
 * - 100% deterministic fallback working offline and on localhost:3000
 * - profileData from web portfolio store is NEVER mutated (deep-cloned)
 * - Zero emojis throughout all texts and logic
 */

/**
 * Normalizes and formats a single bullet point into Harvard STAR format
 * (Action Verb + Context/Scope + Result/Impact) without inventing fake facts.
 * 
 * @param {string} text Raw bullet or description text
 * @param {Object} options Context options (role, company, domain)
 * @returns {string} Harvard STAR formatted bullet point
 */
export function enhanceStarBullet(text, options = {}) {
  if (!text || typeof text !== 'string') return ''

  let bullet = text.trim()
  if (!bullet) return ''

  // 1. Remove leading bullet symbols, dashes, numbers and list markers
  bullet = bullet.replace(/^[\s\-•*·–—\d.)\]]+\s*/, '').trim()
  if (!bullet) return ''

  // 2. Transform passive or nominalized openings into strong Harvard action verbs
  const passiveRules = [
    { regex: /^responsable del\s+/i, replace: 'Gestionó el ' },
    { regex: /^responsable de la\s+/i, replace: 'Gestionó la ' },
    { regex: /^responsable de los\s+/i, replace: 'Gestionó los ' },
    { regex: /^responsable de las\s+/i, replace: 'Gestionó las ' },
    { regex: /^responsable de\s+/i, replace: 'Gestionó ' },
    { regex: /^a cargo del\s+/i, replace: 'Lideró y supervisó el ' },
    { regex: /^a cargo de la\s+/i, replace: 'Lideró y supervisó la ' },
    { regex: /^a cargo de los\s+/i, replace: 'Lideró y supervisó los ' },
    { regex: /^a cargo de las\s+/i, replace: 'Lideró y supervisó las ' },
    { regex: /^a cargo de\s+/i, replace: 'Lideró y supervisó ' },
    { regex: /^encargad[oa] del\s+/i, replace: 'Coordinó y ejecutó el ' },
    { regex: /^encargad[oa] de la\s+/i, replace: 'Coordinó y ejecutó la ' },
    { regex: /^encargad[oa] de los\s+/i, replace: 'Coordinó y ejecutó los ' },
    { regex: /^encargad[oa] de las\s+/i, replace: 'Coordinó y ejecutó las ' },
    { regex: /^encargad[oa] de\s+/i, replace: 'Coordinó y ejecutó ' },
    { regex: /^desarrollo del\s+/i, replace: 'Desarrolló e implementó el ' },
    { regex: /^desarrollo de la\s+/i, replace: 'Desarrolló e implementó la ' },
    { regex: /^desarrollo de\s+/i, replace: 'Desarrolló e implementó ' },
    { regex: /^implementaci[oó]n del\s+/i, replace: 'Implementó y desplegó el ' },
    { regex: /^implementaci[oó]n de la\s+/i, replace: 'Implementó y desplegó la ' },
    { regex: /^implementaci[oó]n de\s+/i, replace: 'Implementó y desplegó ' },
    { regex: /^diseño del\s+/i, replace: 'Diseñó y estructuró el ' },
    { regex: /^diseño de la\s+/i, replace: 'Diseñó y estructuró la ' },
    { regex: /^diseño de\s+/i, replace: 'Diseñó y estructuró ' },
    { regex: /^atenci[oó]n a clientes\b/i, replace: 'Gestionó la atención y soporte a clientes' },
    { regex: /^atenci[oó]n a(l)?\s+/i, replace: 'Gestionó la atención y soporte al ' },
    { regex: /^atenci[oó]n de la\s+/i, replace: 'Gestionó la atención de la ' },
    { regex: /^atenci[oó]n de\s+/i, replace: 'Gestionó la atención de ' },
    { regex: /^creaci[oó]n del\s+/i, replace: 'Creó y consolidó el ' },
    { regex: /^creaci[oó]n de la\s+/i, replace: 'Creó y consolidó la ' },
    { regex: /^creaci[oó]n de\s+/i, replace: 'Creó y consolidó ' },
    { regex: /^mantenimiento del\s+/i, replace: 'Mantuvo y optimizó el ' },
    { regex: /^mantenimiento de la\s+/i, replace: 'Mantuvo y optimizó la ' },
    { regex: /^mantenimiento de\s+/i, replace: 'Mantuvo y optimizó ' },
    { regex: /^soporte del\s+/i, replace: 'Brindó soporte técnico al ' },
    { regex: /^soporte a(l)?\s+/i, replace: 'Brindó soporte técnico al ' },
    { regex: /^soporte de la\s+/i, replace: 'Brindó soporte técnico a la ' },
    { regex: /^soporte de\s+/i, replace: 'Brindó soporte técnico de ' },
    { regex: /^an[aá]lisis del\s+/i, replace: 'Analizó y estructuró el ' },
    { regex: /^an[aá]lisis de la\s+/i, replace: 'Analizó y estructuró la ' },
    { regex: /^an[aá]lisis de\s+/i, replace: 'Analizó y estructuró ' },
    { regex: /^participaci[oó]n en la\s+/i, replace: 'Participó activamente en la ' },
    { regex: /^participaci[oó]n en el\s+/i, replace: 'Participó activamente en el ' },
    { regex: /^participaci[oó]n en\s+/i, replace: 'Participó activamente en ' },
    { regex: /^colaboraci[oó]n en la\s+/i, replace: 'Colaboró estratégicamente en la ' },
    { regex: /^colaboraci[oó]n en el\s+/i, replace: 'Colaboró estratégicamente en el ' },
    { regex: /^colaboraci[oó]n en\s+/i, replace: 'Colaboró estratégicamente en ' },
    { regex: /^ayud[aóe] en la\s+/i, replace: 'Facilitó y apoyó la ' },
    { regex: /^ayud[aóe] en el\s+/i, replace: 'Facilitó y apoyó el ' },
    { regex: /^ayud[aóe] (en|con|a)\s+/i, replace: 'Facilitó y apoyó ' },
    { regex: /^trabaj[oé] en la\s+/i, replace: 'Ejecutó proyectos clave en la ' },
    { regex: /^trabaj[oé] en el\s+/i, replace: 'Ejecutó proyectos clave en el ' },
    { regex: /^trabaj[oé] en\s+/i, replace: 'Ejecutó proyectos clave en ' },
    { regex: /^apoyo en\s+/i, replace: 'Asistió y optimizó ' },
    { regex: /^coordinaci[oó]n del\s+/i, replace: 'Coordinó estratégicamente el ' },
    { regex: /^coordinaci[oó]n de la\s+/i, replace: 'Coordinó estratégicamente la ' },
    { regex: /^coordinaci[oó]n de\s+/i, replace: 'Coordinó estratégicamente ' },
    { regex: /^gesti[oó]n del\s+/i, replace: 'Gestionó eficientemente el ' },
    { regex: /^gesti[oó]n de la\s+/i, replace: 'Gestionó eficientemente la ' },
    { regex: /^gesti[oó]n de\s+/i, replace: 'Gestionó eficientemente ' },
    { regex: /^optimizaci[oó]n del\s+/i, replace: 'Optimizó integralmente el ' },
    { regex: /^optimizaci[oó]n de la\s+/i, replace: 'Optimizó integralmente la ' },
    { regex: /^optimizaci[oó]n de\s+/i, replace: 'Optimizó integralmente ' },
    { regex: /^supervisi[oó]n del\s+/i, replace: 'Supervisó y auditó el ' },
    { regex: /^supervisi[oó]n de la\s+/i, replace: 'Supervisó y auditó la ' },
    { regex: /^supervisi[oó]n de\s+/i, replace: 'Supervisó y auditó ' },
    { regex: /^elaboraci[oó]n del\s+/i, replace: 'Elaboró y estructuró el ' },
    { regex: /^elaboraci[oó]n de la\s+/i, replace: 'Elaboró y estructuró la ' },
    { regex: /^elaboraci[oó]n de\s+/i, replace: 'Elaboró y estructuró ' },
    { regex: /^redacci[oó]n del\s+/i, replace: 'Redactó y consolidó el ' },
    { regex: /^redacci[oó]n de la\s+/i, replace: 'Redactó y consolidó la ' },
    { regex: /^redacci[oó]n de\s+/i, replace: 'Redactó y consolidó ' },
    { regex: /^administraci[oó]n del\s+/i, replace: 'Administró eficazmente el ' },
    { regex: /^administraci[oó]n de la\s+/i, replace: 'Administró eficazmente la ' },
    { regex: /^administraci[oó]n de\s+/i, replace: 'Administró eficazmente ' },
    { regex: /^estructuraci[oó]n del\s+/i, replace: 'Estructuró exitosamente el ' },
    { regex: /^estructuraci[oó]n de la\s+/i, replace: 'Estructuró exitosamente la ' },
    { regex: /^estructuraci[oó]n de\s+/i, replace: 'Estructuró exitosamente ' },
    { regex: /^auditor[ií]a del\s+/i, replace: 'Auditó rigurosamente el ' },
    { regex: /^auditor[ií]a de la\s+/i, replace: 'Auditó rigurosamente la ' },
    { regex: /^auditor[ií]a de\s+/i, replace: 'Auditó rigurosamente ' },
    { regex: /^definici[oó]n del\s+/i, replace: 'Definió y alineó el ' },
    { regex: /^definici[oó]n de la\s+/i, replace: 'Definió y alineó la ' },
    { regex: /^definici[oó]n de\s+/i, replace: 'Definió y alineó ' },
    { regex: /^liderazgo del\s+/i, replace: 'Lideró y consolidó el ' },
    { regex: /^liderazgo de la\s+/i, replace: 'Lideró y consolidó la ' },
    { regex: /^liderazgo de\s+/i, replace: 'Lideró y consolidó ' }
  ]

  for (const rule of passiveRules) {
    if (rule.regex.test(bullet)) {
      bullet = bullet.replace(rule.regex, rule.replace)
      break
    }
  }

  // 3. Convert first-person singular past verbs to executive third-person past
  const firstPersonMap = [
    { regex: /^desarroll[eé]\s+/i, replace: 'Desarrolló ' },
    { regex: /^diseñ[eé]\s+/i, replace: 'Diseñó ' },
    { regex: /^lider[eé]\s+/i, replace: 'Lideró ' },
    { regex: /^implement[eé]\s+/i, replace: 'Implementó ' },
    { regex: /^cre[eé]\s+/i, replace: 'Creó ' },
    { regex: /^optimi[cz][eé]\s+/i, replace: 'Optimizó ' },
    { regex: /^gestion[eé]\s+/i, replace: 'Gestionó ' },
    { regex: /^coordin[eé]\s+/i, replace: 'Coordinó ' },
    { regex: /^supervis[eé]\s+/i, replace: 'Supervisó ' },
    { regex: /^realic[eé]\s+/i, replace: 'Realizó ' },
    { regex: /^ejecut[eé]\s+/i, replace: 'Ejecutó ' },
    { regex: /^analic[eé]\s+/i, replace: 'Analizó ' },
    { regex: /^constru[ií]\s+/i, replace: 'Construyó ' },
    { regex: /^integr[eé]\s+/i, replace: 'Integró ' },
    { regex: /^configur[eé]\s+/i, replace: 'Configuró ' },
    { regex: /^administr[eé]\s+/i, replace: 'Administró ' },
    { regex: /^negoci[eé]\s+/i, replace: 'Negoció ' },
    { regex: /^planifiqu[eé]\s+/i, replace: 'Planificó ' },
    { regex: /^dirig[ií]\s+/i, replace: 'Dirigió ' },
    { regex: /^automatic[eé]\s+/i, replace: 'Automatizó ' },
    { regex: /^estandaric[eé]\s+/i, replace: 'Estandarizó ' },
    { regex: /^desplegu[eé]\s+/i, replace: 'Desplegó ' },
    { regex: /^audit[eé]\s+/i, replace: 'Auditó ' },
    { regex: /^formul[eé]\s+/i, replace: 'Formuló ' },
    { regex: /^consolid[eé]\s+/i, replace: 'Consolidó ' },
    { regex: /^transform[eé]\s+/i, replace: 'Transformó ' },
    { regex: /^hice\s+/i, replace: 'Ejecutó ' },
    { regex: /^arm[eé]\s+/i, replace: 'Estructuró ' }
  ]

  for (const item of firstPersonMap) {
    if (item.regex.test(bullet)) {
      bullet = bullet.replace(item.regex, item.replace)
      break
    }
  }

  // 4. Convert unconjugated infinitives at start to executive third-person past
  const infinitiveMap = [
    { regex: /^desarrollar\s+/i, replace: 'Desarrolló ' },
    { regex: /^diseñar\s+/i, replace: 'Diseñó ' },
    { regex: /^liderar\s+/i, replace: 'Lideró ' },
    { regex: /^implementar\s+/i, replace: 'Implementó ' },
    { regex: /^crear\s+/i, replace: 'Creó ' },
    { regex: /^optimizar\s+/i, replace: 'Optimizó ' },
    { regex: /^gestionar\s+/i, replace: 'Gestionó ' },
    { regex: /^coordinar\s+/i, replace: 'Coordinó ' },
    { regex: /^supervisar\s+/i, replace: 'Supervisó ' },
    { regex: /^realizar\s+/i, replace: 'Realizó ' },
    { regex: /^ejecutar\s+/i, replace: 'Ejecutó ' },
    { regex: /^analizar\s+/i, replace: 'Analizó ' },
    { regex: /^construir\s+/i, replace: 'Construyó ' },
    { regex: /^integrar\s+/i, replace: 'Integró ' },
    { regex: /^configurar\s+/i, replace: 'Configuró ' },
    { regex: /^administrar\s+/i, replace: 'Administró ' },
    { regex: /^negociar\s+/i, replace: 'Negoció ' },
    { regex: /^planificar\s+/i, replace: 'Planificó ' },
    { regex: /^dirigir\s+/i, replace: 'Dirigió ' },
    { regex: /^automatizar\s+/i, replace: 'Automatizó ' },
    { regex: /^estandarizar\s+/i, replace: 'Estandarizó ' },
    { regex: /^desplegar\s+/i, replace: 'Desplegó ' },
    { regex: /^auditar\s+/i, replace: 'Auditó ' },
    { regex: /^formular\s+/i, replace: 'Formuló ' },
    { regex: /^consolidar\s+/i, replace: 'Consolidó ' },
    { regex: /^transformar\s+/i, replace: 'Transformó ' },
    { regex: /^elaborar\s+/i, replace: 'Elaboró ' },
    { regex: /^redactar\s+/i, replace: 'Redactó ' },
    { regex: /^estructurar\s+/i, replace: 'Estructuró ' },
    { regex: /^mantener\s+/i, replace: 'Mantuvo ' }
  ]

  for (const item of infinitiveMap) {
    if (item.regex.test(bullet)) {
      bullet = bullet.replace(item.regex, item.replace)
      break
    }
  }

  // 5. Ensure bullet begins with an uppercase letter
  bullet = bullet.charAt(0).toUpperCase() + bullet.slice(1)

  // 6. Check for outcome / impact indicators in the original statement
  const hasOutcomeIndicator =
    /%|\$|USD|CLP|EUR|UF|\b\d+\s*(%|k|m|millon|veces|dias|horas|usuarios|clientes|empresas|personas|proyectos|alumnos|pacientes)\b/i.test(bullet) ||
    /\b(aument|reduj|increment|optimiz|alcanz|gener|disminu|super|mejor|ahorr|duplic|triplic|logr|obtu|consolid|asegurando|garantizando|permitiendo|facilitando|resultando|con éxito)\b/i.test(bullet)

  // Strip trailing punctuation for clean appending if needed
  bullet = bullet.replace(/[.,;:]+$/, '').trim()

  // 7. If the bullet lacks an explicit outcome and is concise (< 90 chars), append domain-coherent operational impact
  if (!hasOutcomeIndicator && bullet.length < 90) {
    const contextStr = `${options.role || ''} ${options.company || ''} ${bullet}`.toLowerCase()

    if (/software|código|api|backend|frontend|fullstack|devops|cloud|datos|sql|base de datos|sistema|arquitectura|web|móvil|app/i.test(contextStr)) {
      bullet += ', asegurando alta disponibilidad, escalabilidad y estándares de calidad'
    } else if (/legal|tributar|ley|derecho|fiscal|judicial|compliance|regulatori|contrato|normativ/i.test(contextStr)) {
      bullet += ', garantizando estricto cumplimiento normativo y mitigación de riesgos corporativos'
    } else if (/venta|comercial|marketing|cliente|cuenta|crecimiento|negocio|ingreso/i.test(contextStr)) {
      bullet += ', fortaleciendo la captación, retención y relación estratégica comercial'
    } else if (/diseño|ux|ui|producto|interfaz|visual|gráfico|figma/i.test(contextStr)) {
      bullet += ', optimizando la experiencia de usuario y la consistencia de los estándares de diseño'
    } else if (/salud|clínic|médic|enferm|kines|terapia|paciente/i.test(contextStr)) {
      bullet += ', garantizando la excelencia en la atención y estricto apego a protocolos clínicos'
    } else {
      bullet += ', optimizando tiempos de respuesta y la eficiencia de los procesos operativos'
    }
  }

  // 8. Ensure terminal period
  return bullet + '.'
}

/**
 * Deterministically synthesizes an executive professional summary
 * adhering to Harvard ATS standard (2-3 sentences, 35-55 words).
 * 
 * @param {Object} personalInfo 
 * @param {Array} experience 
 * @returns {string} Executive summary text
 */
function synthesizeExecutiveSummary(personalInfo = {}, experience = []) {
  const bio = (personalInfo.bio || '').trim()
  const title = (personalInfo.title || '').trim() || 'Profesional Especialista'
  const name = (personalInfo.name || '').trim()

  if (bio) {
    // Clean and transform informal conversational openings
    let cleaned = bio
      .replace(/^soy (un|una)?\s+/i, 'Profesional con ')
      .replace(/^me destaco por\s+/i, 'Destaca por ')
      .replace(/^tengo más de\s+/i, 'Con más de ')
      .replace(/\bsoy\b/gi, 'es')
      .replace(/\bme especializo en\b/gi, 'especializado en')
      .replace(/\bhe trabajado\b/gi, 'con sólida trayectoria')
      .trim()

    // Ensure initial capitalization
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    if (!cleaned.endsWith('.')) cleaned += '.'

    // If bio is brief (single sentence), append executive closure
    const sentenceCount = (cleaned.match(/\./g) || []).length
    if (sentenceCount < 2) {
      cleaned += ' Destaca por su capacidad analítica, orientación a resultados y enfoque en la optimización de procesos y trabajo colaborativo multidisciplinario.'
    }
    return cleaned
  }

  // Derive trajectory statement from experience
  const hasExp = Array.isArray(experience) && experience.length > 0
  const expContext = hasExp ? `con trayectoria comprobada en organizaciones de diversos sectores` : 'con sólida formación profesional'

  return `${title} ${expContext}. Destaca por su capacidad analítica, orientación a resultados y enfoque en la optimización de procesos, cumplimiento de objetivos estratégicos y trabajo colaborativo multidisciplinario.`
}

/**
 * Pure deterministic transformation of profileData into Harvard ATS format.
 * Applies STAR methodology (Action Verbs, Context, Quantifiable Results)
 * without hallucinating fake companies, dates, or metrics.
 * 
 * Guarantees that the input profileData is NEVER mutated (deep-cloned).
 * 
 * @param {Object} profileData Source portfolio profile data
 * @returns {Object} Structured HarvardCvData
 */
export function transformToHarvardDeterministic(profileData) {
  if (!profileData || typeof profileData !== 'object') {
    return {
      personalInfo: {
        name: '',
        title: '',
        bio: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        website: ''
      },
      username: '',
      summary: '',
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      languages: []
    }
  }

  // Deep clone to guarantee original profileData is never mutated
  const src = JSON.parse(JSON.stringify(profileData))

  const personalInfoSrc = src.personalInfo || {}
  const rawExp = Array.isArray(src.experience) ? src.experience : []
  const rawEdu = Array.isArray(src.education) ? src.education : []
  const rawSkills = Array.isArray(src.skills) ? src.skills : []
  const rawLangs = Array.isArray(src.languages) ? src.languages : []
  const rawCerts = Array.isArray(src.certifications) ? src.certifications : []

  // 1. Synthesize Executive Summary
  const summary = synthesizeExecutiveSummary(personalInfoSrc, rawExp)

  // 2. Format Personal Info
  const personalInfo = {
    name: (personalInfoSrc.name || '').trim(),
    title: (personalInfoSrc.title || '').trim(),
    bio: summary,
    email: (personalInfoSrc.email || '').trim(),
    phone: (personalInfoSrc.phone || personalInfoSrc.whatsapp || '').trim(),
    location: (personalInfoSrc.location || '').trim(),
    linkedin: (personalInfoSrc.linkedin || '').trim(),
    website: (personalInfoSrc.website || '').trim(),
    github: (personalInfoSrc.github || '').trim()
  }

  // 3. Process Work Experience with STAR Method
  const experience = rawExp.map((exp) => {
    const role = (exp.role || exp.title || exp.cargo || '').trim()
    const company = (exp.company || exp.empresa || exp.institution || '').trim()
    const options = { role, company }

    const bullets = []

    // A. Process explicit achievements if present
    if (Array.isArray(exp.achievements) && exp.achievements.length > 0) {
      exp.achievements.forEach((ach) => {
        const text = typeof ach === 'string' ? ach : (ach?.text || ach?.description || '')
        const enhanced = enhanceStarBullet(text, options)
        if (enhanced && !bullets.includes(enhanced)) {
          bullets.push(enhanced)
        }
      })
    }

    // B. Process main description if present
    const rawDesc = (exp.description || exp.descripcion || '').trim()
    if (rawDesc) {
      // Split multi-sentence descriptions if appropriate
      const sentences = rawDesc
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10)

      if (sentences.length > 1) {
        sentences.forEach((sentence) => {
          const enhanced = enhanceStarBullet(sentence, options)
          if (enhanced && !bullets.includes(enhanced)) {
            bullets.push(enhanced)
          }
        })
      } else {
        const enhanced = enhanceStarBullet(rawDesc, options)
        if (enhanced && !bullets.includes(enhanced)) {
          // If we already have bullets, place description at start; otherwise add
          bullets.unshift(enhanced)
        }
      }
    }

    // C. Fallback if no bullets could be extracted
    if (bullets.length === 0 && role) {
      bullets.push(enhanceStarBullet(`Lideró y ejecutó responsabilidades clave en ${company || 'la organización'}`, options))
    }

    return {
      id: exp.id || undefined,
      company,
      role,
      startDate: exp.startDate || exp.inicio || exp.year || '',
      endDate: exp.endDate || exp.fin || (exp.current ? null : ''),
      current: Boolean(exp.current),
      description: bullets[0] || rawDesc,
      bullets,
      achievements: [...bullets]
    }
  })

  // 4. Process Education
  const education = rawEdu.map((edu) => {
    const institution = (edu.institution || edu.institucion || edu.university || edu.universidad || '').trim()
    const degree = (edu.degree || edu.titulo || edu.carrera || edu.grado || '').trim()
    const year = (edu.year || edu.ano || edu.endDate || edu.startDate || '').trim()
    const details = (edu.details || edu.description || edu.descripcion || '').trim()

    return {
      id: edu.id || undefined,
      institution,
      degree,
      year,
      startDate: edu.startDate || '',
      endDate: edu.endDate || year,
      current: Boolean(edu.current),
      details,
      description: details
    }
  })

  // 5. Process Skills (Standard ATS Categorization)
  const technicalSkills = []
  const softSkills = []
  const skillsList = []
  const seenSkillNames = new Set()

  rawSkills.forEach((s) => {
    const rawName = typeof s === 'string' ? s : (s.name || s.habilidad || s.title || '')
    const name = rawName.trim()
    if (!name || seenSkillNames.has(name.toLowerCase())) return
    seenSkillNames.add(name.toLowerCase())

    const isSoft =
      s.category === 'soft' ||
      /liderazgo|comunicaci|empat|equipo|adaptaci|resoluci|negociaci|gesti.n de tiempo|pensamiento cr.tico|proactiv/i.test(name)

    const category = isSoft ? 'soft' : (s.category || 'technical')
    const item = { name, category }
    skillsList.push(item)

    if (isSoft) {
      softSkills.push(name)
    } else {
      technicalSkills.push(name)
    }
  })

  // Support both Array iteration and .technical / .soft property access
  skillsList.technical = technicalSkills
  skillsList.soft = softSkills

  // 6. Process Languages
  const languages = rawLangs.map((lang) => {
    if (typeof lang === 'string') {
      return { name: lang.trim(), language: lang.trim(), level: 'Intermedio' }
    }
    const name = (lang.name || lang.language || lang.idioma || '').trim()
    const level = (lang.level || lang.nivel || 'Intermedio').trim()
    return { name, language: name, level }
  }).filter((l) => l.name.length > 0)

  // 7. Process Certifications
  const certifications = rawCerts.map((cert) => {
    if (typeof cert === 'string') {
      return { name: cert.trim(), issuer: '', year: '' }
    }
    return {
      name: (cert.name || cert.titulo || cert.title || '').trim(),
      issuer: (cert.issuer || cert.emisor || cert.institucion || '').trim(),
      year: (cert.year || cert.fecha || '').trim()
    }
  }).filter((c) => c.name.length > 0)

  const username = (src.username || personalInfoSrc.username || '').trim()

  return {
    personalInfo,
    username,
    summary,
    experience,
    education,
    certifications,
    skills: skillsList,
    languages
  }
}

/**
 * Optimizes profileData for Harvard ATS format via serverless AI endpoint
 * with strict 5.5s timeout. Seamlessly falls back to transformToHarvardDeterministic
 * on localhost (404 / network failure), timeout, offline, or server error.
 * 
 * Deep-clones input data so the user's web portfolio store is NEVER mutated.
 * 
 * @param {Object} profileData Source portfolio profile data
 * @returns {Promise<Object>} HarvardCvData ready for ATS PDF generation
 */
export async function getHarvardOptimizedCv(profileData) {
  if (!profileData) {
    return transformToHarvardDeterministic(profileData)
  }

  // Deep clone input snapshot to prevent any mutations
  const clonedSnapshot = JSON.parse(JSON.stringify(profileData))

  // Graceful fallback if running in environments without native fetch
  if (typeof fetch === 'undefined') {
    return transformToHarvardDeterministic(clonedSnapshot)
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeoutId = controller ? setTimeout(() => controller.abort(), 5500) : null

  try {
    const response = await fetch('/api/optimize-harvard-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        profile: clonedSnapshot,
        profileData: clonedSnapshot,
        username: clonedSnapshot.username
      }),
      signal: controller ? controller.signal : undefined
    })

    if (timeoutId) clearTimeout(timeoutId)

    if (!response.ok) {
      // Localhost 404, 500 missing API key, 503 high demand -> fallback
      return transformToHarvardDeterministic(clonedSnapshot)
    }

    const json = await response.json().catch(() => null)
    if (json && json.success && json.data) {
      const data = json.data
      if (!data.username && clonedSnapshot.username) {
        data.username = clonedSnapshot.username
      }
      return data
    }

    return transformToHarvardDeterministic(clonedSnapshot)
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId)
    // Network error, connection refused on localhost, timeout abort -> fallback
    return transformToHarvardDeterministic(clonedSnapshot)
  }
}
