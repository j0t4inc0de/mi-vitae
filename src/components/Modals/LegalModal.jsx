import React, { useState, useEffect } from 'react'
import { X, Shield, FileText, CheckCircle2, Mail, ExternalLink } from 'lucide-react'

/**
 * LegalModal - Terms of Service & Privacy Policy Modal for Mi Vitae (We Are Samod)
 * Compliant with Chilean Law 19.628 and electronic commerce standards.
 */
export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              {activeTab === 'terms' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 id="legal-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Información Legal y Transparencia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mi Vitae · Desarrollado por We Are Samod (Santiago, Chile)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 p-1.5 gap-2 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Términos del Servicio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Política de Privacidad
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          
          {activeTab === 'terms' ? (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Última actualización: Enero 2026
                </p>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  1. Aceptación y Alcance del Servicio
                </h4>
                <p>
                  Bienvenido a <strong>Mi Vitae</strong> (accesible en{' '}
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">mivitae.wearesamod.com</span>),
                  una plataforma web de portafolios profesionales digitales operada por <strong>We Are Samod Studio</strong>,
                  con domicilio en Santiago de Chile. Al acceder, registrarte o utilizar nuestros servicios, declaras ser mayor de edad o contar con autorización legal y aceptas quedar vinculado por los presentes Términos del Servicio.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  2. Uso de la Plataforma y Portafolios Web
                </h4>
                <p>
                  Mi Vitae otorga a los usuarios una licencia personal, no exclusiva e intransferible para crear, diseñar, editar y publicar su portafolio web profesional e interactivo bajo su subdominio asignado (<code>mi-vitae.wearesamod.com/[usuario]</code>). Queda estrictamente prohibido utilizar el servicio para alojar contenido ilegal, difamatorio, fraudulento, engañoso o que vulnere derechos de propiedad intelectual de terceros.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  3. Propiedad de los Datos y Contenidos del Usuario
                </h4>
                <p>
                  Tú eres y serás el único propietario legítimo de todos los textos, imágenes, fotografías de perfil, descripciones de proyectos y enlaces que publiques en tu portafolio. Mi Vitae no reclama derechos de propiedad sobre tu trayectoria ni tus creaciones profesionales.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  4. Planes, Periodo Gratuito y Suscripciones (Flow / Webpay)
                </h4>
                <p>
                  Ofrecemos una promoción de bienvenida consistente en el <strong>1er mes 100% bonificado ($0 CLP)</strong> tras completar nuestro breve formulario de feedback inicial. Posterior al período promocional, la suscripción mensual estándar tiene un valor de <strong>$3.490 CLP</strong>. Todos los pagos son procesados de forma segura a través de <strong>Flow.cl</strong> con tarjetas de débito y crédito bajo el estándar Webpay Plus de Transbank.
                </p>
                <p className="mt-2">
                  No existen contratos de permanencia forzosa. Puedes cancelar tu suscripción en cualquier instante con un solo clic desde tu panel de usuario o comunicándote directamente a nuestro soporte.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  5. Disponibilidad y Soporte Técnico
                </h4>
                <p>
                  We Are Samod trabaja continuamente para garantizar una alta disponibilidad de los portafolios (infraestructura global Cloudflare Edge y Supabase Cloud). En caso de consultas técnicas, dudas operativas o sugerencias, nuestro equipo está a tu disposición en <a href="mailto:contacto@mivitae.wearesamod.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">contacto@mivitae.wearesamod.com</a> o vía WhatsApp en <span className="font-semibold text-slate-800 dark:text-slate-200">+56 9 3757 3764</span>.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  6. Legislación Aplicable y Jurisdicción
                </h4>
                <p>
                  Estos Términos se rigen e interpretan bajo las leyes de la República de Chile. Cualquier discrepancia será sometida a los tribunales ordinarios de justicia de la comuna y ciudad de Santiago, Chile.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Conforme a la Ley N° 19.628 sobre Protección de la Vida Privada (Chile)
                </p>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  1. Compromiso de Privacidad y Responsable del Tratamiento
                </h4>
                <p>
                  En <strong>Mi Vitae</strong> y <strong>We Are Samod</strong> respetamos profundamente tu privacidad y la confidencialidad de tus antecedentes profesionales. Esta Política describe con total transparencia cómo recolectamos, protegemos y gestionamos tus datos personales.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  2. Datos que Recolectamos
                </h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>Datos de Identificación y Contacto:</strong> Nombre completo, correo electrónico, teléfono/WhatsApp, ciudad y país de residencia.</li>
                  <li><strong>Información Profesional y Académica:</strong> Título laboral, biografía/extracto, experiencia laboral, estudios, habilidades técnicas y enlaces a proyectos o redes (LinkedIn, GitHub, Behance).</li>
                  <li><strong>Métricas de Visualización:</strong> Conteo anonimizado de visitas recibidas en tu portafolio, clics a tu WhatsApp y descargas de CV para tus métricas personales en el Dashboard.</li>
                </ul>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  3. Finalidad del Tratamiento de Datos
                </h4>
                <p>
                  Los datos personales suministrados son utilizados exclusivamente para:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1.5">
                  <li>Generar y renderizar tu portafolio web público según el diseño seleccionado.</li>
                  <li>Permitir que reclutadores y clientes potenciales te contacten directamente a través de tu botón de WhatsApp o correo electrónico.</li>
                  <li>Gestionar tu cuenta de usuario, notificaciones transaccionales y facturación.</li>
                  <li><strong>Nunca vendemos, alquilamos ni transferimos tus datos a agencias de publicidad o terceros ajenos.</strong></li>
                </ul>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  4. Seguridad y Almacenamiento en la Nube
                </h4>
                <p>
                  Tus datos son almacenados en servidores de última generación bajo cifrado SSL/TLS de 256 bits, con respaldo distribuido y políticas de seguridad Row Level Security (RLS) en Supabase Cloud.
                </p>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  5. Derechos de Acceso, Rectificación y Supresión (ARCO)
                </h4>
                <p>
                  De conformidad con la Ley 19.628 de la República de Chile, puedes editar en cualquier momento tus datos directamente desde el Editor Studio de Mi Vitae, o solicitar la eliminación total y definitiva de tu perfil escribiéndonos a <a href="mailto:contacto@mivitae.wearesamod.com" className="text-indigo-600 dark:text-indigo-400 font-semibold underline">contacto@mivitae.wearesamod.com</a>.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Compromiso We Are Samod · Datos 100% protegidos</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  )
}
