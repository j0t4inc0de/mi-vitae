import React, { useState } from 'react'
import { 
  MapPin, Mail, Linkedin, Github, 
  ArrowUpRight, QrCode, Sparkles, Folder, 
  Briefcase, GraduationCap, Asterisk, Globe
} from 'lucide-react'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'
import ViralFooter from '../Common/ViralFooter'
import UserAvatar from '../Common/UserAvatar'

export default function NeoBrutalistTheme({ profile, onRecordClick }) {
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

  // Clases utilitarias Neo-Brutalistas compactas
  const brutalCard = "bg-white border-[2.5px] border-black shadow-[4px_4px_0_0_#000] rounded-xl transition-all duration-200"
  const brutalHover = "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000]"
  const brutalBtnBase = "inline-flex items-center justify-center gap-1.5 font-bold border-2 border-black shadow-[3px_3px_0_0_#000] rounded-lg transition-all duration-150 hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer"

  return (
    <article className="min-h-screen bg-[#FDFBF7] text-black font-sans antialiased selection:bg-[#FF90E8] selection:text-black pb-20">
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
        
        {/* =========================================
            1. HERO HEADER: COMPACTO & DE ALTO IMPACTO
        ========================================== */}
        <header className={`${brutalCard} overflow-hidden shadow-[5px_5px_0_0_#000]`}>
          {/* Top colored window bar */}
          <div className="h-6 bg-[#FF90E8] border-b-2 border-black flex items-center px-3.5 gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
            <div className="w-2.5 h-2.5 rounded-full bg-white border border-black" />
          </div>

          <div className="p-5 sm:p-7 bg-[#FFD166]">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              {/* Avatar brutalista optimizado */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 bg-white border-[3px] border-black shadow-[6px_6px_0_0_#000] rounded-2xl overflow-hidden -rotate-2 hover:rotate-0 transition-transform duration-300">
                  <UserAvatar
                    username={profile.username || 'neo'}
                    avatarUrl={personalInfo.avatar}
                    alt={personalInfo.name}
                    size={144}
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                </div>
                {(personalInfo.availableForWork ?? true) && (
                  <div className="absolute -bottom-2.5 -right-2.5 bg-[#06D6A0] text-black font-black text-[10px] px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] rotate-3 flex items-center gap-1 rounded-md">
                    <Sparkles className="w-3 h-3" />
                    <span>DISPONIBLE</span>
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="flex-1 text-center md:text-left space-y-2.5">
                <div>
                  <div className="inline-block bg-white border-2 border-black px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-[1.5px_1.5px_0_0_#000] mb-1.5">
                    @{profile.username}
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight mb-1">
                    {personalInfo.name}
                  </h1>
                  <p className="text-sm sm:text-lg font-bold bg-white text-black inline-block px-2 py-0.5 border-2 border-black -skew-x-2">
                    {personalInfo.title}
                  </p>
                </div>

                {personalInfo.bio && (
                  <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl bg-white/80 p-2.5 border-2 border-black rounded-lg">
                    {personalInfo.bio}
                  </p>
                )}

                {/* Info Pills */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] font-bold">
                  {personalInfo.location && (
                    <span className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1 rounded-md shadow-[1.5px_1.5px_0_0_#000]">
                      <MapPin className="w-3.5 h-3.5 text-[#FF3366]" />
                      {personalInfo.location}
                    </span>
                  )}
                  {personalInfo.email && (
                    <a
                      href={`mailto:${personalInfo.email}`}
                      onClick={() => handleContactClick('email')}
                      className="flex items-center gap-1.5 bg-white border-2 border-black px-2.5 py-1 rounded-md shadow-[1.5px_1.5px_0_0_#000] hover:bg-gray-100 active:shadow-none transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#FF3366]" />
                      {personalInfo.email}
                    </a>
                  )}
                </div>

                {/* Social Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                  {personalInfo.linkedin && (
                    <a
                      href={personalInfo.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleContactClick('linkedin')}
                      className={`${brutalBtnBase} bg-white px-3.5 py-1.5 text-xs`}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {personalInfo.github && (
                    <a
                      href={personalInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleContactClick('github')}
                      className={`${brutalBtnBase} bg-white px-3.5 py-1.5 text-xs`}
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                  <button
                    onClick={() => setIsQrOpen(true)}
                    className={`${brutalBtnBase} bg-[#4CC9F0] px-3.5 py-1.5 text-xs`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Código QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* =========================================
            2. GRID PRINCIPAL (Layout compacto 2 columnas)
        ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Columna Izquierda: Experiencia + Proyectos */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            
            {/* --- EXPERIENCIA LABORAL COMPACTA --- */}
            {experience.length > 0 && (
              <section aria-labelledby="neo-experience-heading">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-[#FF90E8] border-2 border-black p-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000]">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <h2 id="neo-experience-heading" className="text-xl font-black uppercase tracking-tight">
                    Experiencia Laboral
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {experience.map((item) => (
                    <div key={item.id} className={`${brutalCard} ${brutalHover} p-4 sm:p-4.5 bg-white`}>
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                        <h3 className="text-sm sm:text-base font-black uppercase leading-snug">{item.role}</h3>
                        <span className="text-[10px] font-bold bg-[#06D6A0] border border-black px-2 py-0.5 rounded shadow-[1.5px_1.5px_0_0_#000]">
                          {item.startDate} {item.startDate && (item.endDate || item.current) ? '—' : ''} {item.current ? 'PRESENTE' : item.endDate}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-[11px] font-bold bg-[#FDFBF7] border border-black inline-block px-2 py-0.5 rounded">
                          {item.company}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-xs font-medium text-slate-800 leading-snug mb-2.5">
                          {item.description}
                        </p>
                      )}

                      {item.achievements?.length > 0 && (
                        <ul className="space-y-1.5 border-t border-black border-dashed pt-2.5">
                          {item.achievements.map((ach, idx) => (
                             <li key={idx} className="text-xs font-semibold flex items-start gap-1.5">
                               <Asterisk className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#FF3366]" />
                               <span>{ach}</span>
                             </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- PROYECTOS COMPACTOS --- */}
            {projects.length > 0 && (
              <section aria-labelledby="neo-projects-heading">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-[#06D6A0] border-2 border-black p-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <h2 id="neo-projects-heading" className="text-xl font-black uppercase tracking-tight">
                    Proyectos
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className={`${brutalCard} ${brutalHover} flex flex-col bg-white overflow-hidden`}>
                      {proj.image && (
                        <div className="h-32 border-b-2 border-black relative overflow-hidden bg-slate-100">
                          <img
                            src={proj.image}
                            alt={proj.title}
                            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
                          />
                        </div>
                      )}
                      <div className="p-3.5 flex-1 flex flex-col">
                        <h3 className="font-black text-sm uppercase mb-1 line-clamp-1">{proj.title}</h3>
                        <p className="text-xs font-medium text-slate-700 mb-2.5 line-clamp-2 flex-1">
                          {proj.description}
                        </p>
                        
                        {proj.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {proj.tags.map((tag, idx) => (
                              <span key={idx} className="text-[9px] font-bold bg-[#E5E7EB] border border-black px-1.5 py-0.5 rounded shadow-[1px_1px_0_0_#000]">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-black">
                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${brutalBtnBase} bg-[#FFD166] flex-1 py-1 text-xs`}
                            >
                              <span>Visitar</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                          {proj.repoUrl && (
                            <a
                              href={proj.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${brutalBtnBase} bg-white px-2.5 py-1 text-xs`}
                              title="Repositorio"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Columna Derecha: Habilidades (Grid 2 col) + Educación + Idiomas */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            
            {/* --- HABILIDADES EN GRID DOBLE COLUMNA --- */}
            {skills.length > 0 && (
              <section aria-labelledby="neo-skills-heading">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-[#4CC9F0] border-2 border-black p-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 id="neo-skills-heading" className="text-xl font-black uppercase tracking-tight">
                    Habilidades
                  </h2>
                </div>
                
                <div className={`${brutalCard} p-4 bg-white`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {skills.map((skill) => (
                      <div key={skill.id} className="p-2 border border-black/80 rounded-lg bg-[#FDFBF7]">
                        <div className="flex justify-between text-[11px] font-black uppercase mb-1">
                          <span className="truncate pr-1">{skill.name}</span>
                          <span className="shrink-0">{skill.level}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-white border border-black rounded-full overflow-hidden shadow-[1px_1px_0_0_#000]">
                          <div
                            className="h-full bg-[#FF3366] border-r border-black"
                            style={{ width: `${skill.level}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* --- EDUCACIÓN COMPACTA --- */}
            {education.length > 0 && (
              <section aria-labelledby="neo-education-heading">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-[#FFD166] border-2 border-black p-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h2 id="neo-education-heading" className="text-xl font-black uppercase tracking-tight">
                    Educación
                  </h2>
                </div>

                <div className="space-y-2.5">
                  {education.map((edu) => (
                    <div key={edu.id} className={`${brutalCard} ${brutalHover} p-3.5 bg-white`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-1 mb-1">
                        <h3 className="font-black text-xs sm:text-sm uppercase leading-tight">{edu.degree}</h3>
                        <span className="text-[9px] font-bold bg-[#E5E7EB] border border-black px-1.5 py-0.5 rounded">
                          {edu.year}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#FF3366]">{edu.institution}</p>
                      {edu.description && (
                        <p className="text-xs font-medium text-slate-700 mt-1.5 border-t border-black/30 pt-1.5">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* --- IDIOMAS COMPACTOS --- */}
            {languages.length > 0 && (
              <section aria-labelledby="neo-languages-heading">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="bg-white border-2 border-black p-1.5 rounded-lg shadow-[2.5px_2.5px_0_0_#000]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h2 id="neo-languages-heading" className="text-xl font-black uppercase tracking-tight">
                    Idiomas
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, idx) => (
                    <div key={lang.id || idx} className="bg-white border-2 border-black px-2.5 py-1 rounded-md shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 text-xs">
                      <span className="font-black uppercase">{lang.name || lang.language}</span>
                      <span className="w-1 h-1 bg-black rounded-full" />
                      <span className="font-bold text-[10px] text-black px-1 py-0.2 bg-[#06D6A0] border border-black rounded">
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Empty State Prompt */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className={`${brutalCard} p-8 text-center bg-[#FFD166]`}>
            <h2 className="text-xl font-black uppercase mb-2">🛠 Portafolio en Construcción</h2>
            <p className="text-xs sm:text-sm font-bold max-w-md mx-auto">
              Este perfil aún no cuenta con módulos añadidos. ¡Abre el editor para inyectarle contenido a este lienzo neo-brutalista!
            </p>
          </section>
        )}

        <ViralFooter theme="neo_brutalist" className="mt-12" />

      </main>

      {/* Floating Action Button */}
      <FloatingContactButton profile={profile} onOpenQr={() => setIsQrOpen(true)} />

      {/* Interactive QR Code Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        profile={profile}
      />
    </article>
  )
}
