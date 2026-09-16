import React, { useState } from 'react'
import { 
  Sparkles, Github, Linkedin, MapPin, 
  Mail, Globe, ArrowUpRight, 
  Briefcase, GraduationCap, Layers, 
  Heart, QrCode
} from 'lucide-react'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'
import ViralFooter from '../Common/ViralFooter'
import UserAvatar from '../Common/UserAvatar'

// ponytail: Creative Bento Glassmorphic layout with hardware-accelerated gradients & fluid 60fps transitions
export default function CreativeTheme({ profile, onRecordClick }) {
  const [isQrOpen, setIsQrOpen] = useState(false)

  if (!profile) return null

  const {
    personalInfo = {},
    experience = [],
    education = [],
    skills = [],
    projects = [],
    languages = [],
    analytics = {}
  } = profile

  const handleContactClick = (channel) => {
    if (onRecordClick) {
      onRecordClick(profile.username, channel)
    }
  }

  return (
    <article className="min-h-screen bg-[#0F0E17] text-[#FFFFFE] font-sans antialiased selection:bg-pink-500 selection:text-white relative overflow-hidden">
      
      {/* Background Animated Gradient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          aria-hidden="true" 
          className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-tr from-[#8B5CF6]/25 via-[#EC4899]/15 to-transparent rounded-full blur-3xl animate-pulse-slow" 
        />
        <div 
          aria-hidden="true" 
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-gradient-to-bl from-[#EC4899]/20 via-[#6366F1]/20 to-transparent rounded-full blur-3xl animate-float" 
        />
        <div 
          aria-hidden="true" 
          className="absolute -bottom-32 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#8B5CF6]/20 via-[#06B6D4]/15 to-transparent rounded-full blur-3xl" 
        />
      </div>

      {/* Main Bento Grid Container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 space-y-6">

        {/* Bento Row 1: Hero Identity */}
        <section aria-label="Introducción y perfil" className="bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-6 sm:p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300">
          
          {/* Subtle card glow overlay */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative space-y-6">
            
            {/* Header with Avatar & Availability */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              
              {/* Avatar with Gradient Border */}
              <div className="relative group/avatar shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl p-[3px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#06B6D4] shadow-xl shadow-purple-900/30">
                  <UserAvatar
                    username={profile.username || 'creativo'}
                    avatarUrl={personalInfo.avatar}
                    alt={personalInfo.name}
                    size={112}
                    className="w-full h-full object-cover rounded-[21px] sm:rounded-[21px]"
                  />
                </div>
                {(personalInfo.availableForWork ?? true) && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#1B1A28]"></span>
                  </span>
                )}
              </div>

              {/* Identity Info */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span>@{profile.username}</span>
                  </span>
                  {(personalInfo.availableForWork ?? true) && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                      Disponibilidad Inmediata
                    </span>
                  )}
                </div>

                <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                  {personalInfo.name}
                </h1>

                <p className="text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
                  {personalInfo.title}
                </p>
              </div>

            </div>

            {/* Bio Statement */}
            {personalInfo.bio && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-3xl font-sans">
                {personalInfo.bio}
              </p>
            )}

            {/* Quick Contacts */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-2 border-t border-[#2E2D44]/80">
              {personalInfo.location && (
                <span className="flex items-center gap-1.5 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  {personalInfo.location}
                </span>
              )}
              {personalInfo.email && (
                <a 
                  href={`mailto:${personalInfo.email}`} 
                  onClick={() => handleContactClick('email')}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-pink-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-pink-400" />
                  {personalInfo.email}
                </a>
              )}
            </div>

          </div>

          {/* Action Bar */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-[#2E2D44]/80">
            
            <div className="flex flex-wrap items-center gap-2">
              {personalInfo.linkedin && (
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('linkedin')}
                  className="p-2.5 rounded-xl bg-[#2E2D44]/60 hover:bg-[#8B5CF6]/20 text-slate-300 hover:text-white border border-[#2E2D44] hover:border-purple-500/40 transition-all hover:scale-105"
                  title="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {personalInfo.github && (
                <a
                  href={personalInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleContactClick('github')}
                  className="p-2.5 rounded-xl bg-[#2E2D44]/60 hover:bg-[#8B5CF6]/20 text-slate-300 hover:text-white border border-[#2E2D44] hover:border-purple-500/40 transition-all hover:scale-105"
                  title="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => setIsQrOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#2E2D44]/80 hover:bg-[#8B5CF6]/20 text-slate-200 hover:text-white border border-[#2E2D44] hover:border-purple-500/40 text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-md"
                title="Código QR"
              >
                <QrCode className="w-4 h-4 text-pink-400" />
                <span>Código QR</span>
              </button>
            </div>
          </div>

        </section>

        {/* Bento Row 2: Featured Design Projects (High-Impact Showcase) */}
        {projects.length > 0 && (
          <section aria-labelledby="creative-projects-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 id="creative-projects-heading" className="text-lg sm:text-xl font-bold font-display text-white">
                  Proyectos
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {projects.length} {projects.length === 1 ? 'proyecto destacado' : 'proyectos destacados'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="group bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] hover:border-purple-500/50 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-purple-950/30 hover:-translate-y-1"
                >
                  <div>
                    {proj.image && (
                      <div className="h-48 sm:h-56 overflow-hidden relative">
                        <img
                          src={proj.image}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1B1A28] via-transparent to-transparent opacity-80" />
                        
                        {/* Tags on Image */}
                        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
                          {proj.tags?.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1B1A28]/90 text-purple-200 border border-purple-400/30 backdrop-blur-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <h3 className="text-lg font-bold font-display text-white group-hover:text-pink-300 transition-colors mb-2">
                        {proj.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3 border-t border-[#2E2D44]/60 text-xs font-semibold">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors"
                      >
                        <span>Ver proyecto</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors ml-auto"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Repositorio</span>
                      </a>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* Bento Row 3: Experience (Span 7) + Skills Arsenal (Span 5) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Experience Timeline (Span 7) */}
          {experience.length > 0 && (
            <section aria-labelledby="creative-experience-heading" className="lg:col-span-7 bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h2 id="creative-experience-heading" className="text-lg sm:text-xl font-bold font-display text-white">
                  Experiencia Laboral
                </h2>
              </div>

              <div className="space-y-8 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-[#8B5CF6] before:via-[#EC4899] before:to-[#2E2D44]">
                {experience.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Glowing Node */}
                    <div className="absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] shadow-md shadow-pink-500/50" />

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-1">
                        <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-purple-300 transition-colors">
                          {item.role}
                        </h3>
                        <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/30">
                          {item.startDate} — {item.current ? 'Presente' : item.endDate}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-pink-400">
                        {item.company}
                      </p>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                        {item.description}
                      </p>

                      {item.achievements?.length > 0 && (
                        <ul className="space-y-1.5 pt-2">
                          {item.achievements.map((ach, idx) => (
                            <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                              <Sparkles className="w-3 h-3 text-pink-400 shrink-0 mt-0.5" />
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

          {/* Skills & Design Arsenal (Span 5) */}
          {skills.length > 0 && (
            <section aria-labelledby="creative-skills-heading" className="lg:col-span-5 bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 id="creative-skills-heading" className="text-lg sm:text-xl font-bold font-display text-white">
                    Habilidades & Competencias
                  </h2>
                </div>

                <div className="space-y-4">
                  {skills.map((skill) => (
                    <div key={skill.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-200">{skill.name}</span>
                        <span className="text-purple-300">{skill.level}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#2E2D44] overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] transition-all duration-1000 shadow-sm shadow-purple-500/50"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>

        {/* Bento Row 4: Education & Languages (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Education Bento */}
          {education.length > 0 && (
            <section aria-labelledby="creative-education-heading" className="bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h2 id="creative-education-heading" className="text-base sm:text-lg font-bold font-display text-white">
                  Educación & Formación
                </h2>
              </div>

              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="p-4 rounded-2xl bg-[#2E2D44]/40 border border-[#2E2D44] space-y-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="font-bold text-xs sm:text-sm text-white">
                        {edu.degree}
                      </h3>
                      <span className="text-[11px] font-semibold text-purple-300 shrink-0">
                        {edu.year}
                      </span>
                    </div>
                    <p className="text-xs text-pink-400 font-medium">
                      {edu.institution}
                    </p>
                    {edu.details && (
                      <p className="text-xs text-slate-400 pt-1 leading-relaxed">
                        {edu.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages Bento */}
          {languages.length > 0 && (
            <section aria-labelledby="creative-languages-heading" className="bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h2 id="creative-languages-heading" className="text-base sm:text-lg font-bold font-display text-white">
                    Idiomas
                  </h2>
                </div>

                <div className="space-y-3">
                  {languages.map((lang) => (
                    <div 
                      key={lang.id} 
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#2E2D44]/40 border border-[#2E2D44] text-xs"
                    >
                      <span className="font-bold text-white text-sm">{lang.name}</span>
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 font-medium">
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Empty State Prompt if no sections are loaded */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className="bg-[#1B1A28]/80 backdrop-blur-xl border border-[#2E2D44] rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-xl">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Portafolio en Construcción
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Este portafolio aún no cuenta con módulos añadidos de proyectos o trayectoria. Complétalos desde el editor para visualizarlos aquí.
            </p>
          </section>
        )}

      </main>

      {/* Viral Conversion Footer */}
      <ViralFooter theme="creative" dark={true} className="relative z-10" />

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
