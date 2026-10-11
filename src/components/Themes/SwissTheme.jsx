import React, { useState } from 'react'
import { 
  MapPin, Mail, Phone, Globe, Linkedin, Github, 
  ExternalLink, ArrowUpRight, QrCode, Building2,
  Calendar, Award, CheckCircle2, ChevronRight
} from 'lucide-react'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'
import ViralFooter from '../Common/ViralFooter'
import UserAvatar from '../Common/UserAvatar'

/**
 * SwissTheme - Tema de Cuadrícula Suiza Internacional / Alta Precisión
 * Estilo tipográfico internacional (Bauhaus / Helvético), números de sección monospaciados,
 * acento Rojo Carmesí Internacional (#E11D48), cuadrícula de alta densidad y micro-etiquetas.
 * Ideal para arquitectos, diseñadores industriales, fotógrafos, ingenieros y consultores estratégicos.
 */
export default function SwissTheme({ profile, onRecordClick }) {
  const [isQrOpen, setIsQrOpen] = useState(false)

  if (!profile) return null

  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    languages = [],
    floatingButton = {}
  } = profile

  const handleContactClick = (channel) => {
    if (onRecordClick) {
      onRecordClick(profile.username, channel)
    }
  }

  // Group skills by category if specified, fallback to flat category
  const skillCategories = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Competencias Principales'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})

  // Numbering helper for sections (01, 02, etc.)
  let sectionCounter = 0
  const nextSectionIndex = () => {
    sectionCounter += 1
    return String(sectionCounter).padStart(2, '0')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0C0A09] text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-[#E11D48] selection:text-white pb-20">
      
      {/* Precision Top Grid Hairline */}
      <div className="w-full h-1 bg-[#E11D48]" />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-10">

        {/* ======================================================== */}
        {/* HERO / TYPOGRAPHIC MASTHEAD (INTERNATIONAL STYLE)        */}
        {/* ======================================================== */}
        <header className="border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] rounded-lg p-6 sm:p-8 shadow-xs relative overflow-hidden">
          
          {/* Top Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono tracking-widest uppercase pb-5 mb-6 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
              <span className="w-2 h-2 bg-[#E11D48] inline-block shrink-0" />
              <span className="font-bold text-stone-900 dark:text-stone-200">PORTAFOLIO</span>
              {profile.username && (
                <>
                  <span className="text-stone-300 dark:text-stone-700">/</span>
                  <span className="text-stone-600 dark:text-stone-300">@{profile.username}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {(personalInfo.availableForWork !== false) && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[#E11D48] dark:text-rose-400 text-xs font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E11D48]"></span>
                  </span>
                  <span className="font-sans font-semibold tracking-normal">Disponibilidad Inmediata</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-mono font-medium border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer"
                aria-label="Ver Código QR"
              >
                <QrCode className="w-3.5 h-3.5 text-[#E11D48]" />
                <span className="hidden sm:inline">Código QR</span>
              </button>
            </div>
          </div>

          {/* Masthead Main Layout: Avatar + Typographic Name + Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
            
            {/* Avatar Column (w-28 a w-32 according to Anti-Fatigue guidelines) */}
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <div className="relative group">
                <UserAvatar
                  username={profile.username || personalInfo.name}
                  avatarUrl={personalInfo.avatar}
                  size={120}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-md object-cover border-2 border-stone-900 dark:border-stone-100 shadow-sm"
                  alt={personalInfo.name || 'Foto de perfil'}
                />
                <div className="absolute -bottom-2 -right-2 bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[10px] font-mono px-1.5 py-0.5 rounded-xs font-bold uppercase">
                  @{profile.username}
                </div>
              </div>
            </div>

            {/* Typography Content Column */}
            <div className="md:col-span-9 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-3xl sm:text-5xl font-black text-stone-900 dark:text-stone-50 tracking-tight uppercase leading-none">
                  {personalInfo.name || 'Sin Nombre'}
                </h1>
                
                {personalInfo.title && (
                  <p className="mt-2 text-base sm:text-lg font-bold text-[#E11D48] dark:text-rose-400 tracking-wide uppercase font-mono">
                    {personalInfo.title}
                  </p>
                )}
              </div>

              {personalInfo.bio && (
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-3xl">
                  {personalInfo.bio}
                </p>
              )}

              {/* Geometric Modular Contact Grid */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                {personalInfo.location && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300">
                    <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>{personalInfo.location}</span>
                  </span>
                )}

                {personalInfo.email && (
                  <a
                    href={`mailto:${personalInfo.email}`}
                    onClick={() => handleContactClick('email')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>{personalInfo.email}</span>
                  </a>
                )}

                {personalInfo.phone && (
                  <a
                    href={`tel:${personalInfo.phone}`}
                    onClick={() => handleContactClick('phone')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>{personalInfo.phone}</span>
                  </a>
                )}

                {personalInfo.website && (
                  <a
                    href={personalInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('website')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span className="truncate max-w-[150px]">{personalInfo.website.replace(/^https?:\/\//, '')}</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-400" />
                  </a>
                )}

                {personalInfo.linkedin && (
                  <a
                    href={personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('linkedin')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>LinkedIn</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-400" />
                  </a>
                )}

                {personalInfo.github && (
                  <a
                    href={personalInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('github')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-stone-100 hover:bg-stone-200 dark:bg-stone-800/80 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5 text-[#E11D48]" />
                    <span>GitHub</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-400" />
                  </a>
                )}
              </div>
            </div>

          </div>
        </header>

        {/* ======================================================== */}
        {/* 1. SECCIÓN EXPERIENCIA LABORAL                           */}
        {/* ======================================================== */}
        {experience.length > 0 && (
          <section className="space-y-4">
            {/* Swiss Grid Section Header */}
            <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-black tracking-widest text-[#E11D48] uppercase">
                  {nextSectionIndex()} //
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-stone-900 dark:text-stone-100">
                  Experiencia Laboral
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">
                {experience.length} {experience.length === 1 ? 'REGISTRO' : 'REGISTROS'}
              </span>
            </div>

            {/* Compact Anti-Fatigue Cards */}
            <div className="space-y-3">
              {experience.map((item) => (
                <article
                  key={item.id || `${item.company}-${item.role}`}
                  className="p-4 sm:p-5 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] hover:border-[#E11D48]/60 dark:hover:border-[#E11D48]/60 transition-colors shadow-xs"
                >
                  {/* Integrated Horizontal Header (Prevents vertical scroll fatigue) */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 pb-2 border-b border-stone-100 dark:border-stone-800/60">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h3 className="font-black text-base text-stone-900 dark:text-stone-100 tracking-tight">
                        {item.role}
                      </h3>
                      <span className="text-stone-300 dark:text-stone-700">|</span>
                      <span className="font-medium text-sm text-[#E11D48] dark:text-rose-400">
                        {item.company}
                      </span>
                    </div>

                    <div className="font-mono text-xs font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-sm border border-stone-200 dark:border-stone-700 shrink-0 self-start sm:self-auto">
                      {item.startDate} {item.startDate && (item.endDate || item.current) ? '—' : ''} {item.current ? 'Presente' : item.endDate}
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="mt-2.5 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Achievements Grid */}
                  {item.achievements && item.achievements.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-stone-100 dark:border-stone-800/60 pt-2.5">
                      {item.achievements.map((ach, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300">
                          <span className="w-1.5 h-1.5 bg-[#E11D48] mt-1.5 shrink-0 rounded-xs" />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 2. SECCIÓN PROYECTOS DESTACADOS                          */}
        {/* ======================================================== */}
        {projects.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-black tracking-widest text-[#E11D48] uppercase">
                  {nextSectionIndex()} //
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-stone-900 dark:text-stone-100">
                  Proyectos Destacados
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">
                {projects.length} {projects.length === 1 ? 'PROYECTO' : 'PROYECTOS'}
              </span>
            </div>

            {/* Swiss Modular 2-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <article
                  key={proj.id || proj.title}
                  className="rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] flex flex-col justify-between overflow-hidden hover:border-[#E11D48]/60 dark:hover:border-[#E11D48]/60 transition-colors shadow-xs"
                >
                  {proj.image && (
                    <div className="w-full h-44 sm:h-48 overflow-hidden bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-800">
                      <img
                        src={proj.image}
                        alt={proj.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-black text-base text-stone-900 dark:text-stone-100 tracking-tight uppercase">
                        {proj.title}
                      </h3>

                      {proj.description && (
                        <p className="mt-2 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-3">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Micro Tags */}
                      {proj.tags && proj.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {proj.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-xs bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      {(proj.liveUrl || proj.repoUrl) && (
                        <div className="flex items-center gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/60 text-xs">
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleContactClick('project')}
                              className="inline-flex items-center gap-1 font-bold text-[#E11D48] dark:text-rose-400 hover:underline uppercase tracking-wider"
                            >
                              <span>Demo En Vivo</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {proj.repoUrl && (
                            <a
                              href={proj.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleContactClick('project')}
                              className="inline-flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 uppercase tracking-wider"
                            >
                              <Github className="w-3.5 h-3.5" />
                              <span>Código</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 3. SECCIÓN HABILIDADES                                   */}
        {/* ======================================================== */}
        {skills.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-black tracking-widest text-[#E11D48] uppercase">
                  {nextSectionIndex()} //
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-stone-900 dark:text-stone-100">
                  Habilidades
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">
                {skills.length} {skills.length === 1 ? 'COMPETENCIA' : 'COMPETENCIAS'}
              </span>
            </div>

            {/* Swiss Precision Multi-column Grid */}
            <div className="space-y-4">
              {Object.entries(skillCategories).map(([category, catSkills]) => (
                <div key={category} className="space-y-2">
                  {Object.keys(skillCategories).length > 1 && (
                    <h3 className="font-mono text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      // {category}
                    </h3>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {catSkills.map((sk) => {
                      const level = typeof sk.level === 'number' ? sk.level : 85
                      return (
                        <div
                          key={sk.id || sk.name}
                          className="p-3 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] flex flex-col justify-between gap-2 shadow-xs"
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-stone-900 dark:text-stone-100 uppercase tracking-tight truncate">
                              {sk.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#E11D48] dark:text-rose-400 shrink-0">
                              {level}%
                            </span>
                          </div>

                          {/* Hairline Crimson Meter */}
                          <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#E11D48]"
                              style={{ width: `${level}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 4. SECCIÓN EDUCACIÓN                                     */}
        {/* ======================================================== */}
        {education.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-black tracking-widest text-[#E11D48] uppercase">
                  {nextSectionIndex()} //
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-stone-900 dark:text-stone-100">
                  Educación
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">
                {education.length} {education.length === 1 ? 'TITULACIÓN' : 'TITULACIONES'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {education.map((edu) => (
                <article
                  key={edu.id || `${edu.institution}-${edu.degree}`}
                  className="p-4 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] flex flex-col justify-between gap-2 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                        {edu.degree}
                      </h3>
                      {edu.year && (
                        <span className="font-mono text-[11px] font-semibold text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-xs shrink-0">
                          {edu.year}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#E11D48] dark:text-rose-400">
                      {edu.institution}
                    </p>
                  </div>

                  {edu.details && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800/60">
                      {edu.details}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 5. SECCIÓN IDIOMAS                                       */}
        {/* ======================================================== */}
        {languages.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b-2 border-stone-900 dark:border-stone-100 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-black tracking-widest text-[#E11D48] uppercase">
                  {nextSectionIndex()} //
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase text-stone-900 dark:text-stone-100">
                  Idiomas
                </h2>
              </div>
              <span className="font-mono text-xs text-stone-400 uppercase tracking-widest hidden sm:inline">
                {languages.length} {languages.length === 1 ? 'IDIOMA' : 'IDIOMAS'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.id || lang.name}
                  className="p-3 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#121110] shadow-xs"
                >
                  <div className="font-black text-xs uppercase tracking-tight text-stone-900 dark:text-stone-100">
                    {lang.name}
                  </div>
                  <div className="font-mono text-[11px] text-[#E11D48] dark:text-rose-400 mt-0.5">
                    {lang.level}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State Prompt if zero sections are loaded */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className="border border-dashed border-stone-300 dark:border-stone-700 rounded-md p-8 sm:p-12 text-center space-y-3 bg-white dark:bg-[#121110]">
            <span className="font-mono text-xs font-bold text-[#E11D48] uppercase tracking-widest">// ESTADO</span>
            <h2 className="text-lg sm:text-xl font-black uppercase text-stone-900 dark:text-stone-100">
              Portafolio en Construcción
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Este lienzo de alta precisión aún no contiene módulos registrados. Configura tu experiencia y competencias desde el panel de edición para visualizarlos en este sistema.
            </p>
          </section>
        )}

      </main>

      {/* Viral Conversion Footer */}
      <ViralFooter theme="swiss" />

      {/* Floating Action Button */}
      {floatingButton?.enabled !== false && (
        <FloatingContactButton profile={profile} onOpenQr={() => setIsQrOpen(true)} />
      )}

      {/* Interactive QR Code Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        profile={profile}
        username={profile.username}
        theme={profile.theme}
      />

    </div>
  )
}
