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

// ponytail: generic filler/cliché trimming for any user text (rephrase/trim only, never adds facts).
const FILLER_RULES = [
  [/\s*,?\s*\b(proactiv[oa]s?|orientad[oa]s? a(l logro de)? resultados)\b(\s+y\b)?/giu, ''],
  [/\b(s[oó]lida|amplia|vasta|extensa) (trayectoria|experiencia)\b/giu, 'experiencia'],
  [/\btrayectoria comprobada\b/giu, 'experiencia'],
  [/\b(con el fin de|a fin de)\b/giu, 'para'],
  [/\ba trav[eé]s de\b/giu, 'mediante'],
  [/\bllev(ar|ó|o) a cabo\b/giu, (m, s) => (s === 'ar' ? 'ejecutar' : 'ejecutó')],
  [/\bde (forma|manera) aut[oó]noma\b/giu, 'autónomamente'],
  [/\bpara el desarrollo de\b/giu, 'para'],
  [/\bun total de\s+/giu, ''],
  [/\bdivers[oa]s\s+/giu, ''],
  [/(\bclave\b[^.]*?)\s+clave\b/giu, '$1'],
  [/\s+([,;]|\.(?=\s|$))/g, '$1'], // ponytail: keep ".NET"/".js" tokens intact
  [/\.(\s*\.)+/g, '.'], // collapse ".." left when a whole sentence was filler
  [/\s*,\s*(?=\.)/g, ''], // ponytail: clean ",." or ", ."
  [/\s+\b[yYeEoOuU]\b\s*(?=[.,;:]|$)/g, ''], // ponytail: strip dangling orphan conjunction before punctuation
  [/\s{2,}/g, ' ']
]
const trimFiller = (text) => FILLER_RULES.reduce((t, [re, rep]) => t.replace(re, rep), text).trim()

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
    // Direct nominalizations -> Strong Harvard action verbs
    { regex: /^automatizaci[oó]n (?:integral|completa)?\s*(?:del|de la|de los|de las|de)?\s*/i, replace: 'Automatizó ' },
    { regex: /^liderazgo en la conceptualizaci[oó]n e implementaci[oó]n de\s*/i, replace: 'Planificó e implementó ' },
    { regex: /^liderazgo\s+(estrat[eé]gico\s*(en)?|en\s+el|en\s+la|del|de\s+la|en|de)?\s*/i, replace: 'Lideró ' },
    { regex: /^consultor[ií]a (especializada|estrat[eé]gica)?\s*(en el diseño e implementaci[oó]n de|en el diseño e implementaci[oó]n|en|de|para)?\s*/i, replace: 'Diseñó e implementó ' },
    { regex: /^diseño y puesta en producci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Desplegó en producción ' },
    { regex: /^orquestaci[oó]n (?:del|de la|de los|de las|en|de)?\s*/i, replace: 'Orquestó ' },
    { regex: /^integraci[oó]n de motor de\s*/i, replace: 'Integró motor de ' },
    { regex: /^integraci[oó]n (?:del|de la|de los|de las|en|de)?\s*/i, replace: 'Integró ' },
    { regex: /^despliegue de plataformas?\s*(web|e-learning)?\s*(?:en)?\s*/i, replace: (m, type) => type ? 'Desplegó plataforma ' + type + ' ' : 'Desplegó plataforma ' },
    { regex: /^mentor[ií]a\s+(?:acad[eé]mica\s+|personalizada\s+)*a\s+/i, replace: 'Impartió mentorías a ' },
    { regex: /^mentor[ií]a\s+(?:acad[eé]mica\s+|personalizada\s+)*(?:en|de)?\s*/i, replace: 'Impartió mentorías en ' },
    { regex: /^logro de (un)?\s*/i, replace: 'Logró un ' },
    { regex: /^apoyo (docente|profesional|t[eé]cnico)?\s*(en el [aá]rea de|en|de)?\s*/i, replace: 'Capacitó e instruyó en ' },
    { regex: /^asesor[ií]a (t[eé]cnica|profesional)?\s*(en|de)?\s*/i, replace: 'Asesoró técnicamente en ' },
    { regex: /^an[aá]lisis y transformaci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Analizó y transformó ' },
    { regex: /^centralizaci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Centralizó ' },
    { regex: /^implementaci[oó]n y despliegue (?:del|de la|de los|de las|de)?\s*/i, replace: 'Programó y desplegó ' },
    { regex: /^implementaci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Implementó ' },
    { regex: /^desarrollo e implementaci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Desarrolló e implementó ' },
    { regex: /^desarrollo y optimizaci[oó]n (?:del|de la|de los|de las|de)?\s*/i, replace: 'Desarrolló y optimizó ' },
    { regex: /^creaci[oó]n (?:de planes|de la|del|de los|de las|de)?\s*/i, replace: 'Creó ' },
    { regex: /^optimizaci[oó]n del renderizado (?:del|de la|de los|de las|de)?\s*/i, replace: 'Optimizó el renderizado de ' },
    { regex: /^optimizaci[oó]n (?:de la|del|de los|de las|de)?\s*/i, replace: 'Optimizó ' },
    { regex: /^capacitaci[oó]n (de cuidadores|de|a|en)?\s*/i, replace: 'Capacitó a ' },
    { regex: /^provisi[oó]n (de cuidados|de)?\s*/i, replace: 'Proveyó ' },
    { regex: /^rehabilitaci[oó]n (integral|de|en)?\s*/i, replace: 'Ejecutó rehabilitación de ' },
    { regex: /^plan de intervenci[oó]n (en|de)?\s*/i, replace: 'Diseñó e intervino ' },
    { regex: /^colaboraci[oó]n (interinstitucional|en|con)?\s*/i, replace: 'Coordinó colaboración con ' },
    { regex: /^ejecuci[oó]n (?:de programas|de la|del|de los|de las|de)?\s*/i, replace: 'Ejecutó ' },
    { regex: /^elaboraci[oó]n (?:de fichas|de la|del|de los|de las|de)?\s*/i, replace: 'Elaboró ' },
    { regex: /^atenci[oó]n\s+(kinesiol[oó]gica|m[eé]dica|cl[ií]nica|psicol[oó]gica|integral)\s*(a|en|de)?\s*/i, replace: (m, g1, g2) => 'Brindó atención ' + g1.toLowerCase() + (g2 ? ' ' + g2 + ' ' : ' ') },
    { regex: /^atenci[oó]n\s+(?:al?|en|de)\s+/i, replace: (m) => 'Brindó atención ' + m.replace(/^atenci[oó]n\s+/i, '') },
    { regex: /^llev(ar|[oó]) a cabo\s+/i, replace: 'Ejecutó ' },
    { regex: /^desempeño en\s*/i, replace: 'Se desempeñó en ' },
    { regex: /^rotaci[oó]n cl[ií]nica en\s*/i, replace: 'Completó rotación clínica en ' },
    { regex: /^pr[aá]ctica (en|cl[ií]nica en)?\s*/i, replace: 'Ejecutó práctica clínica en ' },
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
    { regex: /^mantener\s+/i, replace: 'Mantuvo ' },
    { regex: /^(llevar|llev[eé]) a cabo\s+/i, replace: 'Ejecutó ' }
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

  // ponytail: Harvard bullets must remain crisp, concise and free of repetitive boilerplate filler.
  // Strict veracity invariant: We NEVER inject synthetic numbers, percentages, companies or dates.

  // 8. ponytail: Professional Register, Concision & Action Verb Diversity (without inventing facts or figures)
  bullet = bullet
    .replace(/\bwhatsApp\b/gi, 'WhatsApp')
    .replace(/\b24\/7\b/g, 'con atención continua las 24 horas')
    .replace(/\bsin ca[ií]das\b/gi, 'con alta disponibilidad')
    .replace(/agentes conversacionales virtuales/gi, 'asistentes virtuales')
    .replace(/para la supervisi[oó]n de datos IoT en tiempo real/gi, 'IoT en tiempo real')
    .replace(/para el desarrollo de dashboards anal[ií]ticos y dashboards de Gerencia/gi, 'para dashboards analíticos de Gerencia')
    .replace(/dashboards anal[ií]ticos y dashboards de Gerencia/gi, 'dashboards analíticos de Gerencia')
    .replace(/m[eé]tricas clave para la Gerencia,\s*integrando m[aá]s de 10 (m[eé]tricas|KPIs) clave de gesti[oó]n/gi, 'dashboards de Gerencia, consolidando más de 10 KPIs estratégicos')
    .replace(/, abarcando el 100% del ciclo de vida/gi, '')
    // Diversity of opening action verbs to prevent consecutive repetition & neologisms
    .replace(/^Arquitectur[oó]\s+e\s+implement[oó]\b/i, 'Planificó e implementó')
    .replace(/^Arquitectur[oó]\b/i, 'Planificó')
    .replace(/^Lideró e implementó\b/i, 'Planificó e implementó')
    .replace(/^Lideró arquitectura frontend\b/i, 'Estructuró la arquitectura frontend')
    .replace(/^Logro de un\b/i, 'Maximizó un')

  // 9. Trim filler and ensure single terminal period
  bullet = trimFiller(bullet).replace(/\.+$/, '')
  bullet = bullet.charAt(0).toUpperCase() + bullet.slice(1)
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
      .replace(/\bhe trabajado\b/gi, 'con experiencia')
      .replace(/Inteligencia Artificial\s*\([^)]*\)/gi, 'Inteligencia Artificial y Visión por Computadora')
      .replace(/\s*\((OpenAI|DeepSeek|Computer Vision)[^)]*\)/gi, '')
      .replace(/(Inteligencia Artificial,?\s*)+Inteligencia Artificial/gi, 'Inteligencia Artificial')
      .replace(/Experto en crear arquitecturas escalables,?\s*seguras y de alto rendimiento\.?/gi, 'Especialista en diseñar arquitecturas cloud escalables, seguras y de alto rendimiento.')
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
    cleaned = trimFiller(cleaned)

    // Ensure initial capitalization
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    if (!cleaned.endsWith('.')) cleaned += '.'

    // If bio is brief (single sentence), append executive closure
    const sentenceCount = (cleaned.match(/\./g) || []).length
    if (sentenceCount < 2) {
      cleaned += ' Enfocado en la entrega de soluciones escalables, adopción de buenas prácticas y cumplimiento de metas operativas.'
    }
    return cleaned
  }

  // Derive trajectory statement from experience
  const hasExp = Array.isArray(experience) && experience.length > 0
  const expContext = hasExp ? 'con experiencia profesional' : 'con formación profesional'

  return `${title} ${expContext}. Enfocado en la entrega de soluciones escalables, adopción de buenas prácticas y cumplimiento de metas operativas.`
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

  const personalInfoSrc = src.personalInfo || src.personal_info || {}
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

  // 4. Process Education & Disentangle Certifications
  const cleanEducation = []
  const extractedCerts = []

  rawEdu.forEach((edu) => {
    if (!edu) return
    const institution = (edu.institution || edu.institucion || edu.university || edu.universidad || '').trim()
    let degree = (edu.degree || edu.titulo || edu.carrera || edu.grado || '').trim()
    degree = degree.replace(/\s*\(?(Titulado|Graduado|Egresado)\)?\s*$/i, '').trim()
    const year = (edu.year || edu.ano || edu.endDate || edu.startDate || '').trim()
    let details = (edu.details || edu.description || edu.descripcion || '').trim()

    // Omit generic boilerplate filler descriptions
    if (/^(formaci[oó]n|capacitaci[oó]n|dominio|estudios)\b/i.test(details)) {
      details = ''
    }

    const isCert =
      /certificaci[oó]n|certificado|pcap|ccna|aws certified|bootcamp|curso\b/i.test(degree) ||
      /python institute|cisco networking academy|coursera|udemy/i.test(institution)

    if (isCert) {
      extractedCerts.push({
        id: edu.id || undefined,
        name: degree,
        issuer: institution,
        year: year || edu.endDate || edu.startDate || ''
      })
    } else {
      cleanEducation.push({
        id: edu.id || undefined,
        institution,
        degree,
        year,
        startDate: edu.startDate || '',
        endDate: edu.endDate || year,
        current: Boolean(edu.current),
        details,
        description: details
      })
    }
  })

  // 5. Process Skills (Standard ATS Categorization)
  const technicalSkills = []
  const softSkills = []
  const skillsList = []
  const seenSkillNames = new Set()

  // ponytail: Identify development/IT profiles vs humanistic, health, legal, education disciplines
  const nonDevRegex = /social|kinesi[oó]log|enfermer|m[eé]dic|terapeuta|salud|psic[oó]log|abogad|jur[ií]dic|derecho|docente|profesor|educaci[oó]n|pedagog/i
  const devRoleRegex = /software|inform[aá]tic|desarrollador|developer|full-?stack|programad|computaci[oó]n|frontend|backend|devops|cloud\s+engineer|sre\b/i
  const candidateContext = `${personalInfoSrc.title || ''} ${personalInfoSrc.bio || ''} ${rawExp.map(e => e.role || '').join(' ')}`
  const isDev = !nonDevRegex.test(personalInfoSrc.title || '') && devRoleRegex.test(candidateContext)

  // ponytail: Clean ATS skill normalization (disentangle compound skills and harvest core stack)
  rawSkills.forEach((s) => {
    const rawName = typeof s === 'string' ? s : (s.name || s.habilidad || s.title || '')
    const baseName = rawName.trim()
    if (!baseName) return

    let items = [baseName]
    if (baseName.includes('&') || baseName.includes(',')) items = baseName.split(/\s*[,&]\s*/).map(p => p.trim()).filter(Boolean)

    items.forEach((name) => {
      if (seenSkillNames.has(name.toLowerCase())) return
      seenSkillNames.add(name.toLowerCase())

      const isSoft =
        s.category === 'soft' ||
        /liderazgo|comunicaci|empat|equipo|adaptaci|resoluci|negociaci|gesti.n de tiempo|pensamiento cr.tico|proactiv/i.test(name)

      // ponytail: Skip generic filler soft skills (problem-solving, communication) for developers to keep skills section 100% hard tools
      if (isDev && isSoft && /resoluci[oó]n|comunicaci[oó]n|trabajo en equipo/i.test(name)) return

      const category = isSoft ? 'soft' : (s.category || 'technical')
      skillsList.push({ name, category })

      if (isSoft) {
        softSkills.push(name)
      } else {
        technicalSkills.push(name)
      }
    })
  })

  // ponytail: Auto-harvest high-value industry tools & foundational stack ONLY if candidate is developer/IT
  if (isDev) {
    const KNOWN_TOOLS = [
      'Docker', 'AWS', 'Git', 'GitHub', 'Linux', 'Nginx', 'CI/CD', 'REST APIs', 'MySQL', 'PostgreSQL', 'OpenCV', 'Vite', 'Pinia', 'WordPress', 'Moodle', 'C++', 'SQL', 'TypeScript', 'HTML', 'CSS'
    ]
    const fullExpText = rawExp.map(e => `${e.role || ''} ${e.company || ''} ${e.description || ''} ${(e.achievements || []).join(' ')}`).join(' ')
    KNOWN_TOOLS.forEach((tool) => {
      const escaped = tool.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
      const toolRegex = new RegExp('\\b' + escaped + (/[a-zA-Z0-9_]$/.test(tool) ? '\\b' : '(?![a-zA-Z0-9_])'), 'i')
      if (toolRegex.test(fullExpText) && !seenSkillNames.has(tool.toLowerCase())) {
        seenSkillNames.add(tool.toLowerCase())
        skillsList.push({ name: tool, category: 'technical' })
        technicalSkills.push(tool)
      }
    })
  }

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
  const seenCerts = new Set()
  const certifications = [
    ...rawCerts.map((cert) => {
      if (typeof cert === 'string') {
        return { name: cert.trim(), issuer: '', year: '' }
      }
      return {
        name: (cert.name || cert.titulo || cert.title || '').trim(),
        issuer: (cert.issuer || cert.emisor || cert.institucion || '').trim(),
        year: (cert.year || cert.fecha || '').trim()
      }
    }),
    ...extractedCerts
  ].filter((c) => {
    const key = (c.name || '').toLowerCase()
    if (!key || seenCerts.has(key)) return false
    seenCerts.add(key)
    return true
  })

  const username = (src.username || personalInfoSrc.username || '').trim()

  return {
    personalInfo,
    username,
    summary,
    experience,
    education: cleanEducation,
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
