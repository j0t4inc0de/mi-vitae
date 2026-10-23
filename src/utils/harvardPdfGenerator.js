// ponytail: Strict Harvard Business School ATS PDF Engine (100% native vector text, single column, clickable portfolio link)
import { jsPDF } from 'jspdf';

/**
 * Formats a single date into standard format (MM/YYYY or YYYY)
 * @param {string} dateStr 
 * @returns {string}
 */
// ponytail: Universal ATS date parser & sorter (Reverse-chronological & standard ASCII hyphens)
export function formatSingleDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    return `${month}/${year}`;
  }
  const myMatch = trimmed.match(/^(\d{1,2})[-/](\d{4})$/);
  if (myMatch) {
    const month = myMatch[1].padStart(2, '0');
    const year = myMatch[2];
    return `${month}/${year}`;
  }
  if (/^\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export function parseDateForSort(dateStr, isCurrent) {
  if (isCurrent) return 99999999;
  if (!dateStr) return 0;
  const str = String(dateStr).trim();
  const myMatch = str.match(/^(\d{1,2})[-/](\d{4})$/);
  if (myMatch) {
    const m = parseInt(myMatch[1], 10);
    const y = parseInt(myMatch[2], 10);
    return y * 100 + m;
  }
  const match = str.match(/^(\d{4})(?:[-/](\d{1,2}))?/);
  if (match) {
    const y = parseInt(match[1], 10);
    const m = match[2] ? parseInt(match[2], 10) : 1;
    return y * 100 + m;
  }
  return 0;
}

export function formatDateRange(startDate, endDate, current) {
  const start = formatSingleDate(startDate);
  if (current) {
    return start ? `${start} - Present` : 'Present';
  }
  const end = formatSingleDate(endDate);
  if (start && end) {
    if (start === end) return start;
    return `${start} - ${end}`;
  }
  return start || end || '';
}

/**
 * Generates an ATS-compliant Harvard Business School PDF document.
 * 
 * Layout Rules:
 * - Pure black & white layout, single column, clean 0.75pt / 1px section lines
 * - Times-Roman standard Type 1 font (zero font download overhead)
 * - Universal ATS headers: RESUMEN PROFESIONAL, EXPERIENCIA PROFESIONAL, EDUCACION, CERTIFICACIONES, HABILIDADES, IDIOMAS
 * - Zero photos, zero avatars, zero tables, zero skill progress bars, zero icons/emojis
 * - 100% native selectable text (never rasterized canvas)
 * - Clickable PDF link annotation: "Portafolio Web" linking to https://mivitae.wearesamod.com/${username}
 * - Multi-page pagination engine with ensureSpace() and dynamic footer Pagina X de Y if > 1 page
 * 
 * @param {Object} data HarvardCvData or ProfileData
 * @param {Object} options Optional layout parameters
 * @returns {{ doc: jsPDF, blob: Blob|null, arrayBuffer: ArrayBuffer }}
 */
export function generateHarvardPdf(rawInputData = {}, options = {}) {
  // ponytail: Null defense for raw inputs
  const data = rawInputData || {};
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: options.format || 'letter'
  });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = options.margin || 36;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;
  let currentY = margin;

  /**
   * Checks remaining space and breaks to a new page if needed to avoid orphan headers or split text.
   * @param {number} required Height needed on current page
   * @returns {boolean} Whether a new page was added
   */
  function ensureSpace(required) {
    if (currentY + required > bottomLimit) {
      doc.addPage();
      currentY = margin;
      return true;
    }
    return false;
  }

  // 1. Candidate Header
  const personalInfo = data.personalInfo || data.personal_info || {};
  // ponytail: ATS document metadata
  doc.setProperties({
    title: `Curriculum Vitae - ${(personalInfo.name || data.name || 'Profesional').trim()}`,
    subject: 'Curriculum Vitae Harvard ATS',
    author: (personalInfo.name || data.name || 'Profesional').trim(),
    creator: 'Mi Vitae'
  });
  const rawUsername = data.username || personalInfo.username || '';
  const cleanUsername = rawUsername ? encodeURIComponent(String(rawUsername).trim()) : '';
  const portfolioUrl = cleanUsername
    ? `https://mivitae.wearesamod.com/${cleanUsername}`
    : 'https://mivitae.wearesamod.com';

  const fullName = (personalInfo.name || data.name || 'Curriculum Vitae').trim().toUpperCase();
  const headline = (personalInfo.title || data.title || '').trim();

  // Candidate Name
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const nameWidth = doc.getTextWidth(fullName);
  doc.text(fullName, (pageWidth - nameWidth) / 2, currentY);
  currentY += 15;

  // Candidate Title / Headline
  if (headline) {
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    const headWidth = doc.getTextWidth(headline);
    doc.text(headline, (pageWidth - headWidth) / 2, currentY);
    currentY += 13;
  }

  // Contact Bar with Clickable Portafolio Web Link
  const contactTokens = [];
  if (personalInfo.location) contactTokens.push({ text: personalInfo.location.trim() });
  if (personalInfo.phone) contactTokens.push({ text: personalInfo.phone.trim() });
  if (personalInfo.email) contactTokens.push({ text: personalInfo.email.trim(), url: `mailto:${personalInfo.email.trim()}` });
  if (personalInfo.linkedin) {
    const rawLinkedin = personalInfo.linkedin.trim();
    const linkedinUrl = rawLinkedin.startsWith('http') ? rawLinkedin : `https://${rawLinkedin}`;
    const cleanHandle = rawLinkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    contactTokens.push({ text: cleanHandle, url: linkedinUrl });
  }
  if (personalInfo.website && !personalInfo.website.includes('mivitae.wearesamod.com')) {
    const rawWeb = personalInfo.website.trim();
    const webUrl = rawWeb.startsWith('http') ? rawWeb : `https://${rawWeb}`;
    contactTokens.push({ text: 'Sitio Web', url: webUrl });
  }
  // Mandatory Portafolio Web Link
  contactTokens.push({ text: 'Portafolio Web', url: portfolioUrl });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const sep = '  •  ';
  const sepW = doc.getTextWidth(sep);

  const contactLines = [];
  let curLine = [];
  let curLineW = 0;

  contactTokens.forEach((token) => {
    const tokenW = doc.getTextWidth(token.text);
    const needed = curLine.length === 0 ? tokenW : sepW + tokenW;
    if (curLine.length > 0 && curLineW + needed > contentWidth) {
      contactLines.push({ tokens: curLine, width: curLineW });
      curLine = [token];
      curLineW = tokenW;
    } else {
      curLine.push(token);
      curLineW += needed;
    }
  });
  if (curLine.length > 0) {
    contactLines.push({ tokens: curLine, width: curLineW });
  }

  contactLines.forEach((cline) => {
    ensureSpace(14);
    let curX = (pageWidth - cline.width) / 2;
    cline.tokens.forEach((tok, idx) => {
      if (tok.url) {
        doc.textWithLink(tok.text, curX, currentY, { url: tok.url });
      } else {
        doc.text(tok.text, curX, currentY);
      }
      curX += doc.getTextWidth(tok.text);
      if (idx < cline.tokens.length - 1) {
        doc.text(sep, curX, currentY);
        curX += sepW;
      }
    });
    currentY += 13;
  });
  currentY += 4;

  /**
   * Renders a standard ATS section header with 0.75pt divider rule
   * @param {string} title 
   */
  function renderSectionHeader(title) {
    // Avoid orphan header: ensure header + rule + at least 1-2 lines fit
    ensureSpace(48);
    if (currentY > margin + 5) {
      currentY += 8;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), margin, currentY);
    currentY += 3;
    doc.setLineWidth(0.75);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
  }

  // 2. RESUMEN PROFESIONAL
  const summaryText = (data.summary || personalInfo.bio || data.bio || '').trim();
  if (summaryText) {
    renderSectionHeader('RESUMEN PROFESIONAL');
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
    summaryLines.forEach((line) => {
      ensureSpace(12);
      doc.text(line, margin, currentY);
      currentY += 12;
    });
  }

  // 3. EXPERIENCIA PROFESIONAL
  const rawExperiences = Array.isArray(data.experience) ? data.experience.filter(Boolean) : [];
  // ponytail: Sort reverse-chronologically (active/current first, then strict startDate descending to prevent chronological zig-zag)
  const experiences = [...rawExperiences].sort((a, b) => {
    const isCurA = Boolean(a.current || (a.endDate && /present/i.test(a.endDate)));
    const isCurB = Boolean(b.current || (b.endDate && /present/i.test(b.endDate)));
    if (isCurA && !isCurB) return -1;
    if (!isCurA && isCurB) return 1;

    const startA = parseDateForSort(a.startDate, false);
    const startB = parseDateForSort(b.startDate, false);
    if (startB !== startA) return startB - startA;

    const endA = parseDateForSort(a.endDate, false);
    const endB = parseDateForSort(b.endDate, false);
    return endB - endA;
  });
  if (experiences.length > 0) {
    renderSectionHeader('EXPERIENCIA PROFESIONAL');
    experiences.forEach((exp) => {
      ensureSpace(32);
      const company = (exp.company || exp.empresa || 'Empresa').trim();
      const role = (exp.role || exp.title || exp.cargo || 'Cargo').trim();
      const location = (exp.location || '').trim();
      const dateStr = formatDateRange(exp.startDate, exp.endDate, exp.current);

      // Line 1: Company (Bold) + Location (Right aligned)
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(company, margin, currentY);
      if (location) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        const locW = doc.getTextWidth(location);
        doc.text(location, pageWidth - margin - locW, currentY);
      }
      currentY += 12;

      // Line 2: Role (Italic) + Dates (Right aligned)
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(role, margin, currentY);
      if (dateStr) {
        doc.setFont('times', 'normal');
        const dateW = doc.getTextWidth(dateStr);
        doc.text(dateStr, pageWidth - margin - dateW, currentY);
      }
      currentY += 12;

      // Assemble bullets from bullets / achievements arrays or description
      const rawBullets = [
        ...(Array.isArray(exp.bullets) ? exp.bullets : []),
        ...(Array.isArray(exp.achievements) ? exp.achievements : [])
      ];

      const bullets = [];
      rawBullets.forEach((b) => {
        const str = typeof b === 'string' ? b.trim() : (b?.text || b?.description || '').trim();
        if (str && !bullets.includes(str)) {
          bullets.push(str);
        }
      });

      if (bullets.length === 0 && exp.description && exp.description.trim()) {
        const descTrim = exp.description.trim();
        const descLines = descTrim.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        descLines.forEach((l) => {
          if (!bullets.includes(l)) bullets.push(l);
        });
      }

      const bulletIndent = 12;
      bullets.forEach((bullet) => {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        const bLines = doc.splitTextToSize(bullet, contentWidth - bulletIndent);
        ensureSpace(bLines.length * 12);
        doc.text('•', margin + 2, currentY);
        bLines.forEach((bline) => {
          doc.text(bline, margin + bulletIndent, currentY);
          currentY += 12;
        });
      });
      currentY += 4;
    });
  }

  // 4. EDUCACIÓN
  const rawEducation = Array.isArray(data.education) ? data.education.filter(Boolean) : [];
  // ponytail: Sort education reverse-chronologically
  const education = [...rawEducation].sort((a, b) => {
    const endA = parseDateForSort(a.endDate || a.year, a.current);
    const endB = parseDateForSort(b.endDate || b.year, b.current);
    if (endB !== endA) return endB - endA;
    const startA = parseDateForSort(a.startDate, false);
    const startB = parseDateForSort(b.startDate, false);
    return startB - startA;
  });
  if (education.length > 0) {
    renderSectionHeader('EDUCACIÓN');
    education.forEach((edu) => {
      ensureSpace(30);
      const institution = (edu.institution || edu.institucion || edu.university || 'Institución').trim();
      const degree = (edu.degree || edu.carrera || edu.titulo || 'Carrera / Grado').trim();
      const location = (edu.location || '').trim();
      const dateStr = formatDateRange(edu.startDate, edu.endDate || edu.year, edu.current);

      // Line 1: Institution (Bold) + Location (Right aligned)
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(institution, margin, currentY);
      if (location) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        const locW = doc.getTextWidth(location);
        doc.text(location, pageWidth - margin - locW, currentY);
      }
      currentY += 12;

      // Line 2: Degree (Italic) + Dates (Right aligned)
      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(degree, margin, currentY);
      if (dateStr) {
        doc.setFont('times', 'normal');
        const dateW = doc.getTextWidth(dateStr);
        doc.text(dateStr, pageWidth - margin - dateW, currentY);
      }
      currentY += 12;

      const details = (edu.details || edu.description || '').trim();
      const isFiller = /^(formaci[oó]n|capacitaci[oó]n|dominio|estudios)\b/i.test(details);
      if (details && !isFiller) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        const detLines = doc.splitTextToSize(details, contentWidth);
        detLines.forEach((dline) => {
          ensureSpace(12);
          doc.text(dline, margin, currentY);
          currentY += 12;
        });
      }
      currentY += 4;
    });
  }

  // 5. CERTIFICACIONES (Rendered only if present, sorted reverse-chronologically)
  const rawCerts = Array.isArray(data.certifications)
    ? data.certifications.filter((c) => c && (typeof c === 'string' || c.name || c.titulo || c.title))
    : [];
  const certifications = [...rawCerts].sort((a, b) => {
    const dateA = typeof a === 'object' ? parseDateForSort(a.year || a.date, false) : 0;
    const dateB = typeof b === 'object' ? parseDateForSort(b.year || b.date, false) : 0;
    return dateB - dateA;
  });
  if (certifications.length > 0) {
    renderSectionHeader('CERTIFICACIONES');
    certifications.forEach((cert) => {
      ensureSpace(24);
      const name = typeof cert === 'string' ? cert.trim() : (cert.name || cert.titulo || cert.title || '').trim();
      const yearStr = formatSingleDate(cert.year || cert.date);
      const issuer = typeof cert === 'object' ? (cert.issuer || cert.emisor || '').trim() : '';

      // Line 1: Certification Name (Bold) + Year (Right aligned, zero text overlap)
      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(name, margin, currentY);
      if (yearStr) {
        doc.setFont('times', 'normal');
        const yearW = doc.getTextWidth(yearStr);
        doc.text(yearStr, pageWidth - margin - yearW, currentY);
      }
      currentY += 12;

      // Line 2: Issuer / Academy (Italic)
      if (issuer) {
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(issuer, margin, currentY);
        currentY += 12;
      }
      currentY += 2;
    });
    currentY += 2;
  }

  // 6. HABILIDADES
  const rawSkills = Array.isArray(data.skills) ? data.skills : [];
  if (rawSkills.length > 0) {
    renderSectionHeader('HABILIDADES');

    const categories = new Map();

    // Check for pre-categorized properties from optimizer
    const techList = Array.isArray(rawSkills.technical) ? rawSkills.technical : [];
    const softList = Array.isArray(rawSkills.soft) ? rawSkills.soft : [];

    if (techList.length > 0) {
      const isLang = (name) => /python|javascript|typescript|vue|django|react|angular|node|c\+\+|java\b|sql\b|html|css|php|ruby|go\b|rust/i.test(name);
      const langs = techList.filter(isLang);
      const tools = techList.filter((s) => !isLang(s));
      if (langs.length > 0) categories.set('Lenguajes & Frameworks', langs);
      if (tools.length > 0) categories.set('Herramientas, Cloud & DevOps', tools);
      if (langs.length === 0 && tools.length === 0) categories.set('Herramientas Técnicas', techList);
    }
    if (softList.length > 0) {
      // Filter out generic filler words (problem-solving, communication) for strict ATS tools recognition
      const technicalMethods = softList.filter((s) => !/resoluci[oó]n de problemas|comunicaci[oó]n|trabajo en equipo/i.test(s));
      if (technicalMethods.length > 0) {
        categories.set('Metodologías Técnicas', technicalMethods);
      }
    }

    if (categories.size === 0) {
      rawSkills.forEach((s) => {
        if (!s) return;
        const name = typeof s === 'string' ? s.trim() : (s.name || s.habilidad || '').trim();
        if (!name) return;
        let cat = typeof s === 'object' && s.category ? s.category.trim() : '';
        if (!cat) cat = 'Generales';
        if (cat.toLowerCase() === 'technical') cat = 'Técnicas / Especialidad';
        if (cat.toLowerCase() === 'soft') cat = 'Gestión & Competencias';

        if (!categories.has(cat)) categories.set(cat, []);
        categories.get(cat).push(name);
      });
    }

    for (const [catName, skillItems] of categories.entries()) {
      if (!skillItems || skillItems.length === 0) continue;
      ensureSpace(14);
      const label = catName === 'Generales' ? 'Habilidades Principales: ' : `${catName}: `;

      doc.setFont('times', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      const labelW = doc.getTextWidth(label);
      doc.text(label, margin, currentY);

      doc.setFont('times', 'normal');
      const skillsStr = skillItems.join(', ');
      const lines = doc.splitTextToSize(skillsStr, contentWidth - labelW);

      lines.forEach((line, idx) => {
        if (idx > 0) {
          ensureSpace(12);
          doc.text(line, margin + labelW, currentY);
        } else {
          doc.text(line, margin + labelW, currentY);
        }
        currentY += 12;
      });
      currentY += 2;
    }
  }

  // 7. IDIOMAS
  const rawLanguages = Array.isArray(data.languages) ? data.languages : [];
  if (rawLanguages.length > 0) {
    renderSectionHeader('IDIOMAS');
    ensureSpace(14);
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    const langStrings = rawLanguages.map((l) => {
      if (typeof l === 'string') return l.trim();
      const name = (l.name || l.language || l.idioma || '').trim();
      const level = (l.level || l.nivel || '').trim();
      return level ? `${name} (${level})` : name;
    }).filter(Boolean);

    const fullLangText = langStrings.join('  •  ');
    const lines = doc.splitTextToSize(fullLangText, contentWidth);
    lines.forEach((line) => {
      ensureSpace(12);
      doc.text(line, margin, currentY);
      currentY += 12;
    });
  }

  // Dynamic Multi-Page Footers
  const totalPages = doc.getNumberOfPages();
  if (totalPages > 1 && !options.noFooter) {
    const candidateName = (personalInfo.name || data.name || 'Curriculum Vitae').trim();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(110, 110, 110);
      const footerText = `${candidateName}  •  CV  •  Página ${p} de ${totalPages}`;
      const fW = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - fW) / 2, pageHeight - 20);
    }
  }

  const arrayBuffer = doc.output('arraybuffer');
  let blob = null;
  try {
    blob = doc.output('blob');
  } catch (_) {
    if (typeof Blob !== 'undefined') {
      blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    }
  }

  return {
    doc,
    blob,
    arrayBuffer
  };
}

/**
 * Generates and triggers direct browser download of Harvard ATS PDF document
 * without opening any preview modal.
 * 
 * @param {Object} data ProfileData or HarvardCvData
 * @param {string} filename Optional custom filename
 * @returns {Promise<{ success: boolean, filename: string, pageCount: number, doc: jsPDF, blob: Blob|null, arrayBuffer: ArrayBuffer }>}
 */
export async function downloadHarvardPdf(data, filename) {
  const result = generateHarvardPdf(data);
  const safeUsername = (data?.username || data?.personalInfo?.name || 'profesional')
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const finalFilename = filename || `CV_Harvard_${safeUsername}.pdf`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof document.createElement === 'function') {
    result.doc.save(finalFilename);
  }

  return {
    success: true,
    filename: finalFilename,
    pageCount: result.doc.getNumberOfPages(),
    doc: result.doc,
    blob: result.blob,
    arrayBuffer: result.arrayBuffer
  };
}
