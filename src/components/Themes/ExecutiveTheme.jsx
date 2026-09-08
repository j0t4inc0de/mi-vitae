import React, { useState } from 'react'
import { 
  MapPin, Mail, Globe, Linkedin, Github, 
  Briefcase, GraduationCap, Award, ExternalLink, 
  CheckCircle2, TrendingUp, DollarSign, Users, Target,
  QrCode, ShieldCheck, Building2
} from 'lucide-react'
import AvailableBadge from '../Common/AvailableBadge'
import ViralFooter from '../Common/ViralFooter'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'

// ponytail: Premium Executive Dossier with high-ROI metric cards & zero bloated abstractions
/**
 * ExecutiveTheme - Tema Ejecutivo & Corporativo Premium
 * Diseñado en azul marino profundo, slate y azul real (#0B132B, #1C2541, #3A86FF, #48E5C2)
 * Ideal para directores C-Level, gerentes de operaciones, consultores de negocios y líderes B2B.
 */
export default function ExecutiveTheme({ profile, onRecordClick }) {
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

  // Executive Impact KPIs (default metrics or custom from profile)
  const defaultKpis = [
    {
      id: 'kpi-1',
      value: '15+ Años',
      label: 'Liderazgo & Operaciones',
      sublabel: 'Retail, FinTech & Logística',
      icon: <Briefcase className="w-5 h-5 text-[#3A86FF]" />,
    },
    {
      id: 'kpi-2',
      value: '+$45M USD',
      label: 'Presupuesto & P&L',
      sublabel: 'Gestionado en 5 países LatAm',
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 'kpi-3',
      value: '650+ Personas',
      label: 'Talento Humano',
      sublabel: 'Estructura organizacional directa',
      icon: <Users className="w-5 h-5 text-[#3A86FF]" />,
    },
    {
      id: 'kpi-4',
      value: '+18.7%',
      label: 'Margen EBITDA',
      sublabel: 'Optimización de rentabilidad',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    },
  ]

  // Executive Certifications & Board Advisory credentials
  const defaultCertifications = [
    {
      id: 'cert-1',
      title: 'Executive MBA — Operations & Private Equity',
      issuer: 'INSEAD Business School (Fontainebleau, Francia)',
      year: '2015',
      badge: 'Honor Graduate',
    },
    {
      id: 'cert-2',
      title: 'Certificación en Gobierno Corporativo & Directorios',
      issuer: 'Instituto de Directores de Chile (IdDC)',
      year: '2021',
      badge: 'Directorio Acreditado',
    },
    {
      id: 'cert-3',
      title: 'Lean Six Sigma Black Belt & Supply Chain 4.0',
      issuer: 'MIT Sloan Executive Education',
      year: '2019',
      badge: 'Certified Master',
    },
  ]

  const kpis = profile.kpis || defaultKpis
  const certifications = profile.certifications || defaultCertifications

  const handleContactClick = (channel) => {
    if (onRecordClick) {
      onRecordClick(profile.username, channel)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B132B] text-[#F8FAFC] font-sans antialiased selection:bg-[#3A86FF] selection:text-white pb-16">
      
      {/* Background Subtle Corporate Lighting Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#3A86FF]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-10 w-[400px] h-[400px] bg-[#1C2541]/80 rounded-full blur-2xl" />
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-8">
        
        {/* ======================================================== */}
        {/* 1. HERO HEADER: Executive Luxury Dossier Layout */}
        {/* ======================================================== */}
        <header className="bg-[#1C2541] rounded-3xl p-6 sm:p-10 border border-[#334155] shadow-2xl relative overflow-hidden">
          
          {/* Subtle Top Metallic Border */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#3A86FF] via-[#60A5FA] to-[#3A86FF]" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10">
            
            {/* Executive Portrait */}
            <div className="relative group shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-[#3A86FF]/50 shadow-xl shadow-blue-950/40 relative">
                <img
                  src={personalInfo.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80'}
                  alt={personalInfo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/80 via-transparent to-transparent" />
              </div>

              {/* Status / Availability Badge */}
              <div className="absolute -bottom-3 inset-x-0 flex justify-center">
                <AvailableBadge
                  available={personalInfo.availableForWork ?? true}
                  text="Disponible para Consejos & Directorios"
                  compact={false}
                  size="sm"
                  className="bg-[#0B132B] text-[#93C5FD] border-[#3B82F6]/40 shadow-lg text-[10px]"
                />
              </div>
            </div>

            {/* Header Information */}
            <div className="flex-1 text-center md:text-left space-y-3">
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#93C5FD] bg-[#0B132B] px-3 py-0.5 rounded-full border border-[#334155]">
                  @{profile.username}
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Ejecutivo Verificado
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                {personalInfo.name}
              </h1>

              <p className="text-base sm:text-xl font-bold text-[#3A86FF] leading-snug">
                {personalInfo.title}
              </p>

              <p className="text-sm text-[#94A3B8] leading-relaxed max-w-2xl">
                {personalInfo.bio}
              </p>

              {/* Corporate Metadata */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-1 text-xs text-[#94A3B8]">
                {personalInfo.location && (
                  <span className="flex items-center gap-1.5 bg-[#0B132B] px-3 py-1 rounded-lg border border-[#334155]">
                    <MapPin className="w-3.5 h-3.5 text-[#3A86FF]" />
                    {personalInfo.location}
                  </span>
                )}
                {personalInfo.email && (
                  <a
                    href={`mailto:${personalInfo.email}`}
                    onClick={() => handleContactClick('email')}
                    className="flex items-center gap-1.5 bg-[#0B132B] px-3 py-1 rounded-lg border border-[#334155] hover:border-[#3A86FF] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#3A86FF]" />
                    {personalInfo.email}
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-3">
                {personalInfo.linkedin && (
                  <a
                    href={personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('linkedin')}
                    title="LinkedIn Ejecutivo"
                    className="p-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-white hover:border-[#3A86FF] hover:text-[#3A86FF] transition-all hover:scale-105"
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
                    title="GitHub"
                    className="p-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-white hover:border-[#3A86FF] hover:text-[#3A86FF] transition-all hover:scale-105"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => setIsQrOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B132B] border border-[#334155] text-xs font-bold text-slate-200 hover:border-[#3A86FF] transition-all hover:scale-102 cursor-pointer shadow-md"
                >
                  <QrCode className="w-4 h-4 text-[#3A86FF]" />
                  <span>Código QR Tarjeta</span>
                </button>
              </div>

            </div>

          </div>

        </header>

        {/* ======================================================== */}
        {/* 2. SECTION: EXECUTIVE IMPACT KPIS & METRICS BAR */}
        {/* ======================================================== */}
        <section aria-label="Métricas de Impacto" className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-[#1C2541] rounded-2xl p-4 sm:p-5 border border-[#334155] shadow-lg hover:border-[#3A86FF]/50 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-[#0B132B] border border-[#334155]">
                  {kpi.icon}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Impacto ROI
                </span>
              </div>

              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-0.5">
                  {kpi.value}
                </div>
                <div className="text-xs font-bold text-[#93C5FD] truncate">
                  {kpi.label}
                </div>
                <div className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                  {kpi.sublabel}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ======================================================== */}
        {/* 3. GRID: EXPERIENCIA, CASOS DE ÉXITO & CERTIFICACIONES */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main 7-Col Area (Executive Timeline & Strategic Initiatives) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Formal Career Ladder & Milestones */}
            {experience.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 sm:p-8 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#334155]">
                  <div className="p-2 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Línea de Tiempo Formal de Carrera
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Hitos ejecutivos, responsabilidades directivas y resultados cuantificables.
                    </p>
                  </div>
                </div>

                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#334155] pl-9">
                  {experience.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Connected Milestone Marker */}
                      <span className="absolute -left-[29px] top-1 w-4 h-4 rounded-full border-2 border-[#1C2541] bg-[#3A86FF] shadow-md ring-4 ring-[#3A86FF]/20" />

                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                        <h3 className="font-extrabold text-base text-white">{item.role}</h3>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0B132B] text-[#93C5FD] border border-[#334155]">
                          {item.startDate} — {item.current ? 'Presente' : item.endDate}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#3A86FF] mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{item.company}</span>
                      </p>

                      <p className="text-xs sm:text-sm text-[#94A3B8] mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      {item.achievements?.length > 0 && (
                        <div className="bg-[#0B132B]/80 rounded-2xl p-3.5 border border-[#334155]/60 space-y-2 mt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                            Logros Clave & Impacto de Negocio:
                          </span>
                          <ul className="space-y-1.5">
                            {item.achievements.map((ach, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                                <span>{ach}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Strategic Initiatives & Case Studies */}
            {projects.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 sm:p-8 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#334155]">
                  <div className="p-2 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Iniciativas Estratégicas & Casos de Éxito
                    </h2>
                    <p className="text-xs text-[#94A3B8]">
                      Proyectos de transformación digital, M&A y escalado regional de operaciones.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-2xl border border-[#334155] bg-[#0B132B] overflow-hidden flex flex-col hover:border-[#3A86FF] transition-all group"
                    >
                      {proj.image && (
                        <div className="h-40 overflow-hidden relative">
                          <img
                            src={proj.image}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B] via-transparent to-transparent opacity-80" />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-white mb-1 group-hover:text-[#3A86FF] transition-colors">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-[#94A3B8] line-clamp-3 mb-3 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {proj.tags?.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#1C2541] text-[#93C5FD] border border-[#334155]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {proj.liveUrl && (
                            <a
                              href={proj.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#3A86FF] hover:underline"
                            >
                              <span>Ver Resumen Ejecutivo / Caso</span>
                              <ExternalLink className="w-3 h-3" />
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

          {/* Sidebar 4-Col Area (Certifications, Competencies, Education) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Executive Certifications & Board Advisory (Executive Exclusive) */}
            {certifications.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#334155]">
                  <div className="p-1.5 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Certificaciones & Gobierno
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3 rounded-2xl bg-[#0B132B] border border-[#334155]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {cert.badge || 'Acreditado'}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{cert.year}</span>
                      </div>
                      <h3 className="font-bold text-xs text-white leading-snug">{cert.title}</h3>
                      <p className="text-[11px] text-[#94A3B8] mt-1">{cert.issuer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Executive Competencies & Skills */}
            {skills.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#334155]">
                  <div className="p-1.5 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <Award className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Competencias Directivas
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-white">{skill.name}</span>
                        <span className="text-[#3A86FF] font-mono font-bold">{skill.level}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#0B132B] overflow-hidden border border-[#334155]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#3A86FF] to-[#60A5FA]"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#334155]">
                  <div className="p-1.5 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Formación Ejecutiva
                  </h2>
                </div>

                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-[#3A86FF] pl-3">
                      <h3 className="font-bold text-xs text-white">{edu.degree}</h3>
                      <p className="text-xs text-[#93C5FD]">{edu.institution}</p>
                      <span className="text-[10px] text-[#94A3B8] font-mono">{edu.year}</span>
                      {edu.details && (
                        <p className="text-[11px] text-[#94A3B8] mt-1 leading-relaxed">{edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="bg-[#1C2541] rounded-3xl p-6 border border-[#334155] shadow-xl">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#334155]">
                  <div className="p-1.5 rounded-xl bg-[#0B132B] text-[#3A86FF] border border-[#334155]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Idiomas & Negociación
                  </h2>
                </div>

                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{lang.name}</span>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-[#0B132B] text-[#93C5FD] border border-[#334155]">
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

        </div>

        {/* Viral Conversion Footer */}
        <ViralFooter theme="executive" dark={true} />

      </main>

      {/* Floating Action Button */}
      <FloatingContactButton profile={profile} onOpenQr={() => setIsQrOpen(true)} />

      {/* Interactive QR Code Modal */}
      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        profile={profile}
      />

    </div>
  )
}
