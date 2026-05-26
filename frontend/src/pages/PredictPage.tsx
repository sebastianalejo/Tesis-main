import { AlertCircle, ChevronRight, Loader2, MapPin, Sparkles } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { CRIME_TYPES, DISTRICTS } from '../data/sampleIncidents'
import { predictLocal, type PredictInput, type PredictResult, type RiskLevel } from '../ml/localPredict'

const DAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const

const RISK_CONFIG: Record<RiskLevel, { label: string; bg: string; ring: string; bar: string; text: string }> = {
  bajo:  { label: 'BAJO',  bg: 'bg-emerald-50',  ring: 'ring-emerald-200', bar: 'bg-emerald-500', text: 'text-emerald-800' },
  medio: { label: 'MEDIO', bg: 'bg-orange-50',   ring: 'ring-orange-200',  bar: 'bg-orange-500',  text: 'text-orange-900' },
  alto:  { label: 'ALTO',  bg: 'bg-red-50',      ring: 'ring-red-200',     bar: 'bg-red-600',     text: 'text-red-800'    },
}

const BAR_COLORS: Record<RiskLevel, string> = {
  bajo: 'bg-emerald-500', medio: 'bg-orange-500', alto: 'bg-red-600',
}

function RiskBar({ level, pct }: { level: RiskLevel; pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 text-right text-xs text-slate-500 capitalize">{level}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-slate-100 h-2">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${BAR_COLORS[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-xs font-mono text-slate-600">{pct}%</span>
    </div>
  )
}

function ConfidenceGauge({ value, level }: { value: number; level: RiskLevel }) {
  const cfg = RISK_CONFIG[level]
  return (
    <div className="text-center">
      <div className={`inline-flex size-24 flex-col items-center justify-center rounded-full ring-4 ${cfg.ring} ${cfg.bg}`}>
        <span className={`text-2xl font-bold ${cfg.text}`}>{value}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">confianza</span>
      </div>
    </div>
  )
}

export function PredictPage() {
  const { authToken } = useAuth()

  const [crimeType, setCrimeType] = useState(CRIME_TYPES[0].type)
  const [hour, setHour] = useState(22)
  const [day, setDay] = useState<(typeof DAYS)[number]>('viernes')
  const [district, setDistrict] = useState(DISTRICTS[7].name) // LA VICTORIA
  const [latitude, setLatitude]   = useState(DISTRICTS[7].lat)
  const [longitude, setLongitude] = useState(DISTRICTS[7].lng)
  const [frequency, setFrequency] = useState(270)

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [result, setResult]   = useState<PredictResult | null>(null)

  function handleDistrictChange(name: string) {
    setDistrict(name)
    const d = DISTRICTS.find((x) => x.name === name)
    if (d) { setLatitude(d.lat); setLongitude(d.lng); setFrequency(d.base_freq) }
  }

  const payload = useMemo<PredictInput>(
    () => ({
      crime_type: crimeType,
      hour: Number(hour),
      day_of_week: day,
      district: district.toUpperCase(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      historical_frequency: Number(frequency),
    }),
    [crimeType, hour, day, district, latitude, longitude, frequency],
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!authToken) return
    setLoading(true); setError(null); setResult(null)
    try {
      setResult(await predictLocal(payload))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al calcular la predicción')
    } finally {
      setLoading(false)
    }
  }

  const cfg = result ? RISK_CONFIG[result.prediction] : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Predicción de riesgo</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Elige un escenario y obtén el nivel de riesgo estimado (<strong>bajo / medio / alto</strong>) junto
          con la distribución de los registros similares en Firestore.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">

        {/* ── Formulario ─────────────────────────────────────────── */}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3"
        >
          <div className="grid gap-4 sm:grid-cols-2">

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Tipo de delito</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
              >
                {CRIME_TYPES.map((c) => (
                  <option key={c.type} value={c.type}>
                    {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Hora (0–23)</span>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={23}
                  className="flex-1 accent-teal-600"
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                />
                <span className="w-12 rounded-lg border border-slate-200 bg-slate-50 py-1 text-center font-mono text-sm">
                  {String(hour).padStart(2, '0')}:00
                </span>
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Día</span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                value={day}
                onChange={(e) => setDay(e.target.value as typeof day)}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                <MapPin className="size-3.5 text-teal-600" />
                Distrito
              </span>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/25"
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
              >
                {DISTRICTS.sort((a, b) => a.name.localeCompare(b.name)).map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Frecuencia histórica — <span className="font-mono text-teal-700">{frequency}</span>
              </span>
              <input
                type="range" min={1} max={500}
                className="w-full accent-teal-600"
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 (baja)</span><span>500 (muy alta)</span>
              </div>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !authToken}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {loading
              ? <Loader2 className="size-4 animate-spin" />
              : <Sparkles className="size-4" />}
            {loading ? 'Calculando…' : 'Predecir riesgo'}
          </button>
        </form>

        {/* ── Resultado ──────────────────────────────────────────── */}
        <aside className="space-y-4 lg:col-span-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Resultado</p>

            {!result && !loading && (
              <p className="text-sm text-slate-400">
                Completa el formulario y pulsa «Predecir riesgo».
              </p>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin text-teal-600" />
                Consultando registros en Firestore…
              </div>
            )}

            {result && cfg && (
              <div className="space-y-5">
                {/* Nivel predicho */}
                <div className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${cfg.bg} ${cfg.ring}`}>
                  <span className={`text-xl font-bold ${cfg.text}`}>
                    Riesgo {cfg.label}
                  </span>
                  <ConfidenceGauge value={result.confidence} level={result.prediction} />
                </div>

                {/* Barras distribución */}
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Distribución en {result.samples} registro(s)</p>
                  <div className="space-y-1.5">
                    {(['alto', 'medio', 'bajo'] as RiskLevel[]).map((l) => (
                      <RiskBar key={l} level={l} pct={result.percentages[l]} />
                    ))}
                  </div>
                </div>

                {/* Factores */}
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">Factores detectados</p>
                  <ul className="space-y-1">
                    {result.factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-slate-700">
                        <ChevronRight className="mt-0.5 size-3 shrink-0 text-teal-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Método */}
                <p className="text-[11px] text-slate-400">
                  {result.method === 'firestore'
                    ? `Basado en ${result.samples} registros de Firestore (tipo + distrito)`
                    : 'Heurística (carga datos de muestra en «Importar datos» para mayor precisión)'}
                </p>
              </div>
            )}
          </div>

          {/* JSON del escenario */}
          <details className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700 select-none">
              Ver escenario JSON
            </summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-white p-3 font-mono text-[11px] leading-relaxed ring-1 ring-slate-200">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </details>
        </aside>
      </div>
    </div>
  )
}
