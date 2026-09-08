import React from 'react'
import { Link } from '../router/Router'
import { AlertCircle } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold mb-2">Página No Encontrada</h1>
      <p className="text-slate-500 max-w-md mb-6 text-sm">
        La ruta a la que intentas acceder no existe o fue movida.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"
      >
        Volver al Inicio
      </Link>
    </div>
  )
}
