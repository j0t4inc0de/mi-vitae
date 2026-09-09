import React, { useState } from 'react'
import { 
  MapPin, Mail, Globe, Linkedin, Github, 
  Briefcase, GraduationCap, Award, ExternalLink, 
  Sparkles, CheckCircle2, Heart, MessageSquare, Quote, Star,
  QrCode, BookOpen, Smile, ShieldCheck
} from 'lucide-react'
import AvailableBadge from '../Common/AvailableBadge'
import ViralFooter from '../Common/ViralFooter'
import FloatingContactButton from '../Common/FloatingContactButton'
import QrModal from '../Common/QrModal'

// ponytail: Warm humanist theme with terracotta accents, zero external UI libs & native accessible structure
/**
 * WarmTheme - Tema Cálido & Humanista
 * Diseñado en tonos tierra, marfil y terracota (#FDF8F5, #D97706, #43281C)
 * Ideal para psicólogos, terapeutas, profesores, coaches y profesionales de la salud/bienestar.
 */
export default function WarmTheme({ profile, onRecordClick }) {
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

  // Filosofía y Enfoque Personal (por defecto o datos personalizados)
  const defaultPhilosophy = {
    quote: "Creo firmemente en el poder de la empatía, el autoconocimiento y el acompañamiento respetuoso para desbloquear el bienestar integral de cada persona y equipo de trabajo.",
    pillars: [
      {
        icon: <Heart className="w-5 h-5 text-[#D97706]" />,
        title: "Espacio Seguro & Empático",
        description: "Ambiente libre de juicios donde la escucha activa y la confidencialidad absoluta son el pilar fundamental de cada sesión."
      },
      {
        icon: <ShieldCheck className="w-5 h-5 text-[#D97706]" />,
        title: "Enfoque Basado en Evidencia",
        description: "Metodologías clínicas y psicoeducativas con respaldo científico y adaptadas al ritmo de cada persona."
      },
      {
        icon: <Smile className="w-5 h-5 text-[#D97706]" />,
        title: "Herramientas Prácticas y Reales",
        description: "Estrategias concretas para la vida cotidiana: manejo del estrés, comunicación asertiva y regulación somática."
      }
    ]
  }

  // Testimonios destacados para el perfil cálido
  const defaultTestimonials = [
    {
      id: "test-1",
      quote: "El acompañamiento de Valeria marcó un antes y un después en la cultura de prevención de burnout de nuestro equipo directivo. Su calidez y metodología práctica son invaluables.",
      author: "Camila Henríquez",
      role: "Gerente de Personas & Cultura",
      organization: "Fintech LatAm",
      rating: 5
    },
    {
      id: "test-2",
      quote: "Encontré un espacio de total confianza y claridad emocional en momentos de alta incertidumbre. Totalmente recomendada por su calidad humana y profesionalismo.",
      author: "Matías Soto",
      role: "Consultor & Emprendedor",
      organization: "Paciente Clínico",
      rating: 5
    }
  ]

  const philosophy = profile.philosophy || defaultPhilosophy
  const testimonials = profile.testimonials || defaultTestimonials

  const handleContactClick = (channel) => {
    if (onRecordClick) {
      onRecordClick(profile.username, channel)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F5] text-[#43281C] font-sans antialiased selection:bg-[#FEF3C7] selection:text-[#92400E] pb-16">
      
      {/* Background Subtle Warm Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#FEF3C7]/60 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-[#FDE68A]/40 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#F3E8E2]/80 blur-3xl" />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 space-y-8">
        
        {/* ======================================================== */}
        {/* 1. HERO HEADER: Big circular avatar & warm greetings */}
        {/* ======================================================== */}
        <header className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-[#F3E8E2] shadow-sm shadow-amber-950/5 relative overflow-hidden">
          
          {/* Decorative Warm Top Accent Ribbon */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-[#B45309]" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10">
            
            {/* Friendly Large Circular Avatar */}
            <div className="relative group shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-tr from-[#D97706] via-[#FBBF24] to-[#FDE68A] shadow-lg shadow-amber-900/10">
                <img
                  src={personalInfo.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'}
                  alt={personalInfo.name}
                  className="w-full h-full rounded-full object-cover border-4 border-white"
                />
              </div>

              {/* Status Badge floating at bottom of avatar */}
              {(personalInfo.availableForWork ?? true) && (
                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                  <AvailableBadge 
                    available={personalInfo.availableForWork ?? true} 
                    text="Disponibilidad Inmediata"
                    compact={false}
                    size="sm"
                    className="bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] shadow-md"
                  />
                </div>
              )}
            </div>

            {/* Header Details */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D97706] bg-[#FEF3C7] px-3 py-0.5 rounded-full border border-[#FDE68A]">
                  @{profile.username}
                </span>
                <span className="text-xs text-[#78350F] flex items-center gap-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                  Perfil Verificado
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#43281C]">
                {personalInfo.name}
              </h1>

              <p className="text-base sm:text-lg font-semibold text-[#D97706] leading-snug">
                {personalInfo.title}
              </p>

              <p className="text-sm sm:text-base text-[#43281C]/85 leading-relaxed max-w-2xl font-normal">
                {personalInfo.bio}
              </p>

              {/* Location & Contact Meta */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 pt-1 text-xs text-[#78350F] font-medium">
                {personalInfo.location && (
                  <span className="flex items-center gap-1.5 bg-[#FDF8F5] px-2.5 py-1 rounded-lg border border-[#F3E8E2]">
                    <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                    {personalInfo.location}
                  </span>
                )}
                {personalInfo.email && (
                  <a
                    href={`mailto:${personalInfo.email}`}
                    onClick={() => handleContactClick('email')}
                    className="flex items-center gap-1.5 bg-[#FDF8F5] px-2.5 py-1 rounded-lg border border-[#F3E8E2] hover:border-[#D97706] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#D97706]" />
                    {personalInfo.email}
                  </a>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3">
                {personalInfo.linkedin && (
                  <a
                    href={personalInfo.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleContactClick('linkedin')}
                    title="Perfil de LinkedIn"
                    className="p-2.5 rounded-xl bg-[#FDF8F5] border border-[#F3E8E2] text-[#43281C] hover:bg-[#FEF3C7] hover:border-[#FDE68A] hover:text-[#92400E] transition-all hover:scale-105"
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
                    className="p-2.5 rounded-xl bg-[#FDF8F5] border border-[#F3E8E2] text-[#43281C] hover:bg-[#FEF3C7] hover:border-[#FDE68A] transition-all hover:scale-105"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}

                {/* QR Code trigger */}
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FDF8F5] border border-[#F3E8E2] text-xs font-bold text-[#78350F] hover:bg-[#FEF3C7] hover:border-[#FDE68A] transition-all hover:scale-102 cursor-pointer shadow-sm"
                >
                  <QrCode className="w-4 h-4 text-[#D97706]" />
                  <span>Código QR Tarjeta</span>
                </button>
              </div>

            </div>

          </div>

        </header>

        {/* ======================================================== */}
        {/* 2. SECTION: FILOSOFÍA & ENFOQUE HUMANO (WARM EXCLUSIVE) */}
        {/* ======================================================== */}
        <section className="bg-gradient-to-br from-[#FEF3C7]/40 via-white to-[#FDF8F5] rounded-3xl p-6 sm:p-8 border border-[#FDE68A]/60 shadow-sm shadow-amber-950/5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              <Heart className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#43281C]">
                Mi Enfoque & Filosofía de Trabajo
              </h2>
              <p className="text-xs text-[#78350F]">
                Los principios que guían mi práctica y relación con las personas.
              </p>
            </div>
          </div>

          {/* Quote Block */}
          <div className="relative p-5 sm:p-6 rounded-2xl bg-white border border-[#F3E8E2] shadow-sm mb-6">
            <Quote className="w-8 h-8 text-[#FDE68A] absolute top-4 right-4 opacity-70" />
            <p className="text-sm sm:text-base italic text-[#43281C] font-medium leading-relaxed max-w-2xl">
              "{philosophy.quote}"
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {philosophy.pillars?.map((pillar, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/80 border border-[#F3E8E2] hover:border-[#D97706]/40 transition-colors shadow-xs"
              >
                <div className="mb-2 p-2 rounded-xl bg-[#FEF3C7] w-fit">
                  {pillar.icon}
                </div>
                <h3 className="font-bold text-sm text-[#43281C] mb-1">
                  {pillar.title}
                </h3>
                <p className="text-xs text-[#78350F] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. SECTION: TESTIMONIOS & RECOMENDACIONES (WARM EXCLUSIVE) */}
        {/* ======================================================== */}
        {testimonials.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                <MessageSquare className="w-5 h-5 text-[#D97706]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#43281C]">
                  Testimonios & Recomendaciones
                </h2>
                <p className="text-xs text-[#78350F]">
                  Experiencias compartidas por pacientes, alumnos y líderes de equipo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {testimonials.map((test) => (
                <div
                  key={test.id}
                  className="p-5 rounded-2xl bg-[#FDF8F5] border border-[#F3E8E2] flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    {/* 5 Stars */}
                    <div className="flex items-center gap-1 mb-3 text-amber-500">
                      {[...Array(test.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-[#43281C]/90 italic leading-relaxed mb-4">
                      "{test.quote}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#F3E8E2]">
                    <div className="w-9 h-9 rounded-full bg-[#D97706] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {test.author?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#43281C]">{test.author}</h3>
                      <p className="text-[11px] text-[#78350F]">
                        {test.role} • <span className="font-semibold">{test.organization}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* 4. GRID: EXPERIENCIA, PROYECTOS & HABILIDADES */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main 2-Col Column (Experience & Projects) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Experience Timeline */}
            {experience.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <Briefcase className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#43281C]">
                    Trayectoria Profesional
                  </h2>
                </div>

                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#FDE68A] pl-8">
                  {experience.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Terracotta timeline dot */}
                      <span className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#D97706] shadow-sm" />

                      <div className="flex flex-wrap items-baseline justify-between gap-1 mb-1">
                        <h3 className="font-bold text-base text-[#43281C]">{item.role}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                          {item.startDate} — {item.current ? 'Presente' : item.endDate}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-[#D97706] mb-2">
                        {item.company}
                      </p>

                      <p className="text-xs sm:text-sm text-[#43281C]/80 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      {item.achievements?.length > 0 && (
                        <ul className="space-y-1.5">
                          {item.achievements.map((ach, idx) => (
                            <li key={idx} className="text-xs text-[#78350F] flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D97706]" />
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

            {/* Projects & Workshops */}
            {projects.length > 0 && (
              <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="p-2 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <BookOpen className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <h2 className="text-xl font-bold text-[#43281C]">
                    Programas, Talleres & Recursos
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="rounded-2xl border border-[#F3E8E2] bg-[#FDF8F5] overflow-hidden flex flex-col hover:border-[#D97706]/50 transition-all group"
                    >
                      {proj.image && (
                        <div className="h-36 overflow-hidden relative">
                          <img
                            src={proj.image}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-[#43281C] mb-1 group-hover:text-[#D97706] transition-colors">
                            {proj.title}
                          </h3>
                          <p className="text-xs text-[#78350F] line-clamp-3 mb-3 leading-relaxed">
                            {proj.description}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {proj.tags?.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
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
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706] hover:underline"
                            >
                              <span>Ver Información / Acceso</span>
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

          {/* Sidebar (Skills, Education, Languages) */}
          <div className="space-y-8">
            
            {/* Skills / Áreas de Especialidad */}
            {skills.length > 0 && (
              <section className="bg-white rounded-3xl p-6 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <Award className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <h2 className="text-base font-bold text-[#43281C]">
                    Especialidades & Enfoque
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {skills.map((skill) => (
                    <div key={skill.id}>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-[#43281C]">
                        <span>{skill.name}</span>
                        <span className="text-[#D97706] font-bold">{skill.level}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FEF3C7] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#D97706] to-[#F59E0B] transition-all duration-500"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education & Credentials */}
            {education.length > 0 && (
              <section className="bg-white rounded-3xl p-6 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <GraduationCap className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <h2 className="text-base font-bold text-[#43281C]">
                    Educación & Grados
                  </h2>
                </div>

                <div className="space-y-4">
                  {education.map((edu) => (
                    <div key={edu.id} className="border-l-2 border-[#D97706] pl-3">
                      <h3 className="font-bold text-xs sm:text-sm text-[#43281C]">{edu.degree}</h3>
                      <p className="text-xs font-semibold text-[#D97706]">{edu.institution}</p>
                      <span className="text-[11px] text-[#78350F] font-medium">{edu.year}</span>
                      {edu.details && (
                        <p className="text-xs text-[#78350F] mt-1 leading-relaxed">{edu.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <section className="bg-white rounded-3xl p-6 border border-[#F3E8E2] shadow-sm shadow-amber-950/5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <Globe className="w-4 h-4 text-[#D97706]" />
                  </div>
                  <h2 className="text-base font-bold text-[#43281C]">
                    Idiomas
                  </h2>
                </div>

                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#43281C]">{lang.name}</span>
                      <span className="px-2 py-0.5 rounded-md font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                        {lang.level}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Empty State Prompt if no sections are loaded */}
        {skills.length === 0 && projects.length === 0 && experience.length === 0 && education.length === 0 && (
          <section className="bg-white/80 border border-[#F3E8E2] rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-md">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#43281C]">
              Portafolio en Construcción
            </h2>
            <p className="text-xs sm:text-sm text-[#7F5539] max-w-md mx-auto leading-relaxed">
              Este perfil aún no cuenta con módulos de experiencia o áreas de acompañamiento agregados. Complétalos desde el editor para visualizarlos aquí.
            </p>
          </section>
        )}

        {/* Viral Conversion Footer */}
        <ViralFooter theme="warm" />

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
