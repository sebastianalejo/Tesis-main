import { Activity, CheckCircle2, Cpu, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCrimeIncidentsForMap } from '../hooks/useCrimeIncidentsForMap'

export function HomePage() {
  const { points, loading } = useCrimeIncidentsForMap()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Resumen</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Panel conectado a Firestore. Los datos de delitos se almacenan en la colección{' '}
          <span className="font-mono text-xs">crime_incidents</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Incidentes en Firestore */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Datos en Firestore</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {loading ? '…' : points.length === 0 ? 'Sin registros' : `${points.length} puntos`}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <Cpu className="size-5" aria-hidden />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {points.length === 0
              ? 'Importa datos CSV o JSON en «Datos» para verlos aquí y en el mapa.'
              : 'Registros con coordenadas disponibles en «Mapa de riesgo».'}
          </p>
        </div>

        {/* Estado API */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">API (Functions)</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">No desplegadas</p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Activity className="size-5" aria-hidden />
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Las Cloud Functions (predicción ML, importar datos) requieren plan{' '}
            <strong>Blaze</strong> en Firebase. Actívalas cuando estés listo para usarlas.
          </p>
        </div>

        {/* Flujo */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white shadow-sm sm:col-span-2 lg:col-span-1">
          <ShieldAlert className="size-8 opacity-90" aria-hidden />
          <p className="mt-3 text-sm font-medium opacity-95">Qué puedes hacer ahora</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm opacity-90">
            <li>
              Ver el <Link className="underline underline-offset-2" to="/mapa">mapa INEI DataCrime</Link>
            </li>
            <li>
              <Link className="underline underline-offset-2" to="/datos">Importar datos</Link> a Firestore
            </li>
            <li>Activar Blaze para predicción ML</li>
          </ol>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/mapa"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500"
        >
          <CheckCircle2 className="size-4" aria-hidden />
          Ver mapa
        </Link>
        <Link
          to="/datos"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Importar datos
        </Link>
      </div>
    </div>
  )
}
