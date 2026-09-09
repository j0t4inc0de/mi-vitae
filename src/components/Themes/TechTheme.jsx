import React, { useState } from 'react'
import { 
  Terminal, GitBranch, Cpu, 
  Github, Linkedin, MapPin, Mail, 
  Globe, Activity, ShieldCheck, 
  FolderGit2, QrCode, ChevronRight
} from 'lucide-react'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'
import ViralFooter from '../Common/ViralFooter'

// ponytail: Terminal hacker aesthetic with zero bloat, native shell simulator & high-perf vector QR
export default function TechTheme({ profile, onRecordClick }) {
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

  return (
    <article className="min-h-screen bg-[#0A0E17] text-[#F3F4F6] font-mono antialiased selection:bg-[#10B981] selection:text-[#0A0E17] pb-24">
      
      {/* Background Matrix/Grid Overlay */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" 
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        {/* Developer Terminal Window Header */}
        <header className="bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden shadow-emerald-950/20">
          
          {/* Terminal Window Chrome */}
          <div className="bg-[#0D131F] px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]/80 hover:bg-[#EF4444] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]/80 hover:bg-[#F59E0B] transition-colors" />
              <div className="w-3 h-3 rounded-full bg-[#10B981]/80 hover:bg-[#10B981] transition-colors" />
              <span className="text-slate-400 text-xs ml-2 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>bash — {profile.username}@dev-terminal: ~/profile</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
              UTF-8 • Developer Profile
            </div>
          </div>

          {/* Developer Main Profile Header Details */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* Avatar with IDE badge */}
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-[#10B981]/50 bg-[#0B0F19] p-1 shadow-lg shadow-emerald-950/40">
                <img
                  src={personalInfo.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80'}
                  alt={personalInfo.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              {(personalInfo.availableForWork ?? true) && (
                <div className="absolute -bottom-2 -right-1 bg-[#10B981] text-[#0A0E17] text-[10px] font-black px-2 py-0.5 rounded font-mono shadow flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0A0E17] animate-pulse" />
                  <span>Disponibilidad Inmediata</span>
                </div>
              )}
            </div>

            {/* Info and Links */}
            <div className="flex-1 space-y-3 text-center md:text-left">
              
              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {personalInfo.name}
                  </h1>
                  <span className="text-xs text-[#10B981] bg-[#064E3B]/40 border border-[#059669]/40 px-2.5 py-0.5 rounded">
                    @{profile.username}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-[#06B6D4] mt-1">
                  {personalInfo.title}
                </p>
              </div>

              {personalInfo.bio && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  {personalInfo.bio}
                </p>
              )}

              {/* Developer Metadata line */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 text-xs text-slate-400 pt-1">
                {personalInfo.location && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                    {personalInfo.location}
                  </span>
                )}
                {personalInfo.email && (
                  <a 
                    href={`mailto:${personalInfo.email}`} 
                    onClick={() => handleContactClick('email')}
                    className="flex items-center gap-1 text-slate-300 hover:text-[#10B981] underline transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#06B6D4]" />
                    {personalInfo.email}
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-3">
                {personalInfo.github && (
                  <a
                    href={personalInfo.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('github')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-white border border-[#374151] transition-all"
                  >
                    <Github className="w-4 h-4 text-[#10B981]" />
                    <span>github.com</span>
                  </a>
                )}
                {personalInfo.linkedin && (
                  <a
                    href={personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('linkedin')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-white border border-[#374151] transition-all"
                  >
                    <Linkedin className="w-4 h-4 text-[#06B6D4]" />
                    <span>linkedin.com</span>
                  </a>
                )}

                <button
                  onClick={() => setIsQrOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-xs font-mono font-semibold text-white border border-[#374151] transition-all cursor-pointer"
                  title="Código QR Tarjeta"
                >
                  <QrCode className="w-4 h-4 text-[#06B6D4]" />
                  <span>qr_matrix.sh</span>
                </button>
              </div>

            </div>

          </div>

        </header>

        {/* Section: Tech Stack & Core Competencies (IDE Style) */}
        {skills.length > 0 && (
          <section aria-labelledby="tech-stack-heading" className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 id="tech-stack-heading" className="text-base sm:text-lg font-bold text-white">
                  Tech Stack & Engine Architecture
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {skills.length} modules loaded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <div 
                  key={skill.id} 
                  className="bg-[#0B0F19] border border-[#1F2937] hover:border-[#10B981]/50 p-4 rounded-xl space-y-2 transition-colors group"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white group-hover:text-[#10B981] transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>{skill.name}</span>
                    </span>
                    <span className="text-[#10B981] font-mono text-[11px] bg-[#064E3B]/30 px-2 py-0.5 rounded border border-[#059669]/30">
                      {skill.level}%
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded bg-[#1F2937] overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-[#10B981] to-[#06B6D4]"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>

                  {skill.category && (
                    <div className="text-[10px] text-slate-500 font-mono">
                      CAT: {skill.category.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Microservices & Open Source Deployments (Projects) */}
        {projects.length > 0 && (
          <section aria-labelledby="tech-projects-heading" className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <h2 id="tech-projects-heading" className="text-base sm:text-lg font-bold text-white">
                  Production Deployments & Open Source Repos
                </h2>
              </div>
              <span className="text-xs text-[#10B981] font-mono flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>ALL_ACTIVE</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-[#0B0F19] border border-[#1F2937] hover:border-[#06B6D4]/50 rounded-xl overflow-hidden flex flex-col justify-between transition-all group"
                >
                  <div>
                    {proj.image && (
                      <div className="h-40 overflow-hidden relative border-b border-[#1F2937]">
                        <img
                          src={proj.image}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#0A0E17]/90 text-[10px] font-mono text-[#10B981] border border-[#10B981]/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                          <span>DEPLOYED</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-2.5">
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-[#06B6D4] transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {proj.description}
                      </p>

                      {proj.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {proj.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1F2937] text-slate-300 border border-[#374151]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-[#080C14] border-t border-[#1F2937] flex items-center justify-between text-xs font-mono">
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#10B981] hover:underline"
                      >
                        <span>[ VER DEMO ↗ ]</span>
                      </a>
                    )}
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white underline ml-auto"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>[ REPO ]</span>
                      </a>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Git Commit History & Career Log (Experience) */}
        {experience.length > 0 && (
          <section aria-labelledby="tech-experience-heading" className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <GitBranch className="w-4 h-4" />
                </div>
                <h2 id="tech-experience-heading" className="text-base sm:text-lg font-bold text-white">
                  git log --stat (Career Milestones & Engineering Impact)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">{"HEAD -> origin/master"}</span>
            </div>

            <div className="space-y-8 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#1F2937]">
              {experience.map((item) => (
                <div key={item.id} className="relative group space-y-2">
                  {/* Git branch node */}
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-[#111827]" />

                  <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                    <span className="font-mono text-amber-400 font-bold">
                      commit {item.id}
                    </span>
                    <span className="text-[11px] font-mono text-[#06B6D4] bg-[#080C14] px-2 py-0.5 rounded border border-[#1F2937]">
                      {item.startDate} — {item.current ? 'HEAD' : item.endDate}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {item.role} <span className="text-[#10B981]">@ {item.company}</span>
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>

                  {item.achievements?.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#080C14] border border-[#1F2937] space-y-1.5 mt-2">
                      <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                        KEY_CHANGELOG:
                      </div>
                      {item.achievements.map((ach, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-start gap-2 font-mono">
                          <span className="text-[#10B981] font-bold shrink-0">+</span>
                          <span>{ach}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section: Education, Certs & Languages (2 Columns) */}
        {(education.length > 0 || languages.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Education & Certs */}
            {education.length > 0 && (
              <section aria-labelledby="tech-education-heading" className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6">
                <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <h2 id="tech-education-heading" className="text-sm font-bold text-white">
                    cat /etc/credentials.json
                  </h2>
                </div>

                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-3.5 rounded-lg bg-[#080C14] border border-[#1F2937] text-xs space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-white">{edu.degree}</span>
                        <span className="text-[#10B981] text-[11px]">{edu.year}</span>
                      </div>
                      <p className="text-slate-400">{edu.institution}</p>
                      {edu.details && (
                        <p className="text-[11px] text-slate-500 pt-0.5">{edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages & Protocols */}
            {languages.length > 0 && (
              <section aria-labelledby="tech-languages-heading" className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 border-b border-[#1F2937] pb-3 mb-4">
                    <Globe className="w-4 h-4 text-[#06B6D4]" />
                    <h2 id="tech-languages-heading" className="text-sm font-bold text-white">
                      netstat --languages
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {languages.map((lang) => (
                      <div 
                        key={lang.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-[#080C14] border border-[#1F2937] text-xs"
                      >
                        <span className="font-bold text-slate-200">{lang.name}</span>
                        <span className="text-[#06B6D4] font-mono bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                          {lang.level}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#1F2937] text-center text-[11px] text-slate-500">
                  <span>Latency: ~1ms • Ready for high-throughput teams</span>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Empty State Prompt if no sections are loaded */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 sm:p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 flex items-center justify-center mx-auto">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Portafolio en Construcción
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Este perfil aún no cuenta con módulos de experiencia, habilidades o proyectos añadidos. Si eres el titular, añade contenido desde tu editor para que aparezca aquí.
              </p>
            </div>
          </section>
        )}

      </div>

      {/* Viral Conversion Footer */}
      <ViralFooter theme="tech" dark={true} />

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
