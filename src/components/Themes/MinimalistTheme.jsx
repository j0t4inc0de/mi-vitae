import React, { useState } from 'react'
import { 
  MapPin, Mail, Phone, Globe, Linkedin, Github, 
  ArrowUpRight, QrCode
} from 'lucide-react'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'
import ViralFooter from '../Common/ViralFooter'

// ponytail: Minimalist editorial layout with zero superfluous dependencies
export default function MinimalistTheme({ profile, onRecordClick }) {
  const [isQrOpen, setIsQrOpen] = useState(false)

  if (!profile) return null

  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    languages = []
  } = profile

  const handleContactClick = (channel) => {
    if (onRecordClick) {
      onRecordClick(profile.username, channel)
    }
  }

  // Group skills by category if available, otherwise flat
  const skillCategories = skills.reduce((acc, skill) => {
    const cat = skill.category || 'Competencias Principales'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(skill)
    return acc
  }, {})

  return (
    <article className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans antialiased selection:bg-stone-300 selection:text-stone-900 pb-20">
      
      {/* Top Editorial Rule & Masthead info */}
      <header className="max-w-4xl mx-auto px-6 sm:px-12 pt-10 sm:pt-14 pb-8 border-b border-[#E7E5E4]">
        
        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs tracking-widest uppercase text-stone-500 font-mono pb-6 mb-8 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-stone-800"></span>
            <span>Curriculum Vitae</span>
            <span className="text-stone-300">•</span>
            <span>Edición Digital</span>
          </div>

          <div className="flex items-center gap-3">
            {(personalInfo.availableForWork ?? true) && (
              <span className="inline-flex items-center gap-1.5 text-stone-700 bg-stone-200/70 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Disponibilidad Inmediata</span>
              </span>
            )}
            <span className="text-stone-400 font-sans">@{profile.username}</span>
          </div>
        </div>

        {/* Masthead Header */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-8 space-y-4">
            <h1 className="font-serif text-3xl sm:text-5xl font-normal text-stone-900 tracking-tight leading-[1.15]">
              {personalInfo.name}
            </h1>

            <p className="font-serif italic text-lg sm:text-xl text-stone-700 font-normal leading-snug">
              {personalInfo.title}
            </p>

            {personalInfo.bio && (
              <p className="font-serif text-stone-700 text-base sm:text-lg leading-relaxed pt-2 text-justify sm:text-left">
                {personalInfo.bio}
              </p>
            )}

            {/* Editorial Contact Details */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-stone-600 pt-3">
              {personalInfo.location && (
                <span className="inline-flex items-center gap-1.5 text-stone-600">
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.email && (
                <a 
                  href={`mailto:${personalInfo.email}`} 
                  onClick={() => handleContactClick('email')}
                  className="inline-flex items-center gap-1.5 hover:text-stone-900 underline decoration-stone-300 underline-offset-4 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-stone-500" />
                  {personalInfo.email}
                </a>
              )}
              {personalInfo.phone && (
                <a 
                  href={`tel:${personalInfo.phone}`}
                  onClick={() => handleContactClick('phone')}
                  className="inline-flex items-center gap-1.5 hover:text-stone-900 underline decoration-stone-300 underline-offset-4 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  {personalInfo.phone}
                </a>
              )}
            </div>

            {/* Social and Download Action Links */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              {personalInfo.linkedin && (
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('linkedin')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-stone-700" />
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-stone-700" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3 text-stone-400" />
                </a>
              )}

              <button
                onClick={() => setIsQrOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded bg-stone-900 hover:bg-stone-800 text-stone-50 transition-colors shadow-sm cursor-pointer"
                title="Código QR para tarjetas de presentación"
              >
                <QrCode className="w-3.5 h-3.5 text-stone-200" />
                <span>Tarjeta QR</span>
              </button>
            </div>

          </div>

          {/* Portrait Photo (Editorial frame) */}
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div className="relative p-1.5 bg-white border border-stone-300 shadow-sm max-w-[200px]">
              <img
                src={personalInfo.avatar || 'https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80'}
                alt={personalInfo.name}
                className="w-40 h-48 sm:w-44 sm:h-52 object-cover grayscale contrast-105"
              />
              <div className="text-[10px] font-mono text-center text-stone-400 pt-1.5 uppercase tracking-wider">
                Foto de Perfil
              </div>
            </div>
          </div>

        </div>

      </header>

      {/* Main Editorial Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-12 py-10 space-y-14">

        {/* Experience Section - Column Margin Layout */}
        {experience.length > 0 && (
          <section aria-labelledby="section-experience">
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-8">
              <span className="font-mono text-xs font-bold text-stone-500 tracking-widest uppercase">
                01.
              </span>
              <h2 id="section-experience" className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Experiencia Profesional & Trayectoria
              </h2>
            </div>

            <div className="space-y-10">
              {experience.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
                  
                  {/* Left Column: Date Range */}
                  <div className="sm:col-span-4 font-mono text-xs text-stone-500 tracking-wider uppercase">
                    <span>{item.startDate}</span>
                    <span className="mx-1.5">—</span>
                    <span className={item.current ? "font-bold text-stone-900" : ""}>
                      {item.current ? "Presente" : item.endDate}
                    </span>
                  </div>

                  {/* Right Column: Role & Company Details */}
                  <div className="sm:col-span-8 space-y-2">
                    <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
                      {item.role}
                    </h3>
                    
                    <p className="text-sm font-serif italic text-stone-700">
                      {item.company}
                    </p>

                    <p className="text-sm text-stone-700 leading-relaxed pt-1">
                      {item.description}
                    </p>

                    {item.achievements?.length > 0 && (
                      <ul className="space-y-2 pt-2">
                        {item.achievements.map((ach, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-stone-600 flex items-start gap-2.5 leading-relaxed">
                            <span className="font-mono text-stone-400 mt-0.5 select-none">—</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <section aria-labelledby="section-education">
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-8">
              <span className="font-mono text-xs font-bold text-stone-500 tracking-widest uppercase">
                02.
              </span>
              <h2 id="section-education" className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Educación & Formación Académica
              </h2>
            </div>

            <div className="space-y-8">
              {education.map((edu) => (
                <div key={edu.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline">
                  
                  {/* Left Column: Year */}
                  <div className="sm:col-span-4 font-mono text-xs text-stone-500 tracking-wider uppercase">
                    {edu.year}
                  </div>

                  {/* Right Column: Degree & Details */}
                  <div className="sm:col-span-8 space-y-1">
                    <h3 className="font-serif text-base font-bold text-stone-900">
                      {edu.degree}
                    </h3>
                    <p className="text-sm font-serif italic text-stone-700">
                      {edu.institution}
                    </p>
                    {edu.details && (
                      <p className="text-xs sm:text-sm text-stone-600 pt-1 leading-relaxed">
                        {edu.details}
                      </p>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects / Publications / Case Studies */}
        {projects.length > 0 && (
          <section aria-labelledby="section-projects">
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-8">
              <span className="font-mono text-xs font-bold text-stone-500 tracking-widest uppercase">
                03.
              </span>
              <h2 id="section-projects" className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Casos de Estudio & Publicaciones
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects.map((proj) => (
                <div 
                  key={proj.id}
                  className="bg-white border border-stone-300 p-6 flex flex-col justify-between hover:border-stone-500 transition-colors"
                >
                  <div className="space-y-3">
                    {proj.image && (
                      <div className="overflow-hidden border border-stone-200 mb-4 h-40">
                        <img 
                          src={proj.image} 
                          alt={proj.title} 
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        />
                      </div>
                    )}

                    <h3 className="font-serif text-base font-bold text-stone-900 leading-snug">
                      {proj.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {proj.description}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-stone-100 space-y-3">
                    {proj.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="font-mono text-[10px] tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded uppercase"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs font-serif font-medium pt-1">
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-stone-900 hover:text-stone-600 underline underline-offset-4"
                        >
                          <span>Ver Publicación / Caso</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-900 underline underline-offset-4 ml-auto"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Código</span>
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills & Practice Areas */}
        {skills.length > 0 && (
          <section aria-labelledby="section-skills">
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-8">
              <span className="font-mono text-xs font-bold text-stone-500 tracking-widest uppercase">
                04.
              </span>
              <h2 id="section-skills" className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Áreas de Práctica & Competencias
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(skillCategories).map(([category, catSkills]) => (
                <div key={category} className="bg-white border border-stone-200 p-5 space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-stone-500 font-bold border-b border-stone-100 pb-2">
                    {category}
                  </h3>
                  <ul className="space-y-2.5">
                    {catSkills.map((sk) => (
                      <li key={sk.id} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-serif text-stone-800">{sk.name}</span>
                        <span className="font-mono text-xs text-stone-400 font-medium">
                          {sk.level}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Languages & Accreditations */}
        {languages.length > 0 && (
          <section aria-labelledby="section-languages">
            <div className="flex items-center gap-3 border-b border-stone-300 pb-2.5 mb-8">
              <span className="font-mono text-xs font-bold text-stone-500 tracking-widest uppercase">
                05.
              </span>
              <h2 id="section-languages" className="font-serif text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                Idiomas & Certificaciones
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {languages.map((lang) => (
                <div key={lang.id} className="border border-stone-300 p-4 bg-white">
                  <div className="font-serif font-bold text-sm text-stone-900">
                    {lang.name}
                  </div>
                  <div className="font-mono text-xs text-stone-600 mt-1">
                    {lang.level}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State Prompt if no sections are loaded */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className="border border-dashed border-stone-300 rounded-xl p-8 sm:p-12 text-center space-y-3 bg-stone-50">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-800">
              Portafolio en Construcción
            </h2>
            <p className="font-sans text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
              Este portafolio aún no tiene módulos de experiencia o competencias agregados. Completa tu información desde el panel de edición para que se visualice aquí.
            </p>
          </section>
        )}

      </main>

      {/* Viral Conversion Footer */}
      <ViralFooter theme="minimalist" />

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
