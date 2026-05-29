import { useRef, useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { IncidentTrendChart, type TimeRange } from './IncidentTrendChart'
import { simulateDates } from '../utils/simulateDates'
import { riskDotColor } from './maps/riskColors'
import type { MapPoint } from '../hooks/useCrimeIncidentsForMap'
import type { Stats } from '../pages/MapPage'

const RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: '7d', label: '7 días', days: 7 },
  { value: '1m', label: '1 mes', days: 30 },
  { value: '3m', label: '3 meses', days: 90 },
  { value: '6m', label: '6 meses', days: 180 },
]

interface Props {
  points: MapPoint[]
  allPointsCount: number
  stats: Stats
  crimeFilter: string
  districtFilter: string
  hourLabel: string
  riskLabels: string
}

export function PdfExportButton({
  points,
  allPointsCount,
  stats,
  crimeFilter,
  districtFilter,
  hourLabel,
  riskLabels,
}: Props) {
  const [range, setRange] = useState<TimeRange>('7d')
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const rangeOpt = RANGE_OPTIONS.find((o) => o.value === range)!
  const datedPoints = simulateDates(points, rangeOpt.days)
  const hasData = points.length > 0

  async function handleExport() {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width

      let heightLeft = pdfH
      let position = 0
      const pageH = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH)
      heightLeft -= pageH

      while (heightLeft > 0) {
        position = heightLeft - pdfH + pageH
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfW, pdfH)
        heightLeft -= pageH
      }

      pdf.save('reporte-riesgo-criminal.pdf')
    } catch (err) {
      console.error('Error al generar PDF:', err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        >
          {RANGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={!hasData || exporting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileDown className="size-4" />
          )}
          {exporting ? 'Generando…' : 'Descargar PDF'}
        </button>
        <span className="text-[11px] text-slate-400">
          {rangeOpt.label} — {datedPoints.length} incidentes
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Tendencia de incidentes
        </h3>
        <IncidentTrendChart points={datedPoints} range={range} />
      </div>

      <div className="absolute left-0 top-0 -z-10 opacity-0 pointer-events-none">
        <div ref={reportRef} className="w-[800px] bg-white p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Reporte de Mapa de Riesgo Criminal
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Lima Metropolitana — {new Date().toLocaleDateString('es-PE')}
            </p>
          </div>

          <div className="mb-6 rounded-lg bg-slate-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              Filtros aplicados
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600">
              <div>
                Rango de tiempo: <span className="font-medium text-slate-800">{rangeOpt.label}</span>
              </div>
              <div>
                Nivel de riesgo: <span className="font-medium text-slate-800">{riskLabels || 'Todos'}</span>
              </div>
              <div>
                Tipo de delito: <span className="font-medium text-slate-800">{crimeFilter || 'Todos'}</span>
              </div>
              <div>
                Distrito: <span className="font-medium text-slate-800">{districtFilter || 'Todos'}</span>
              </div>
              <div>
                Franja horaria: <span className="font-medium text-slate-800">{hourLabel}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Estadísticas</h2>
            <div className="flex gap-3">
              {(['alto', 'medio', 'bajo'] as const).map((key) => (
                <div
                  key={key}
                  className="flex-1 rounded-lg border border-slate-200 p-3 text-center"
                >
                  <div
                    className="mx-auto mb-1 size-3 rounded-full"
                    style={{ backgroundColor: riskDotColor(key) }}
                  />
                  <div className="text-lg font-bold text-slate-800">
                    {stats[key]}
                  </div>
                  <div className="text-[11px] capitalize text-slate-500">{key}</div>
                </div>
              ))}
              <div className="flex-1 rounded-lg border border-slate-200 p-3 text-center">
                <div className="text-lg font-bold text-slate-800">
                  {points.length}
                </div>
                <div className="text-[11px] text-slate-500">Visibles</div>
              </div>
              <div className="flex-1 rounded-lg border border-slate-200 p-3 text-center">
                <div className="text-lg font-bold text-slate-800">
                  {allPointsCount}
                </div>
                <div className="text-[11px] text-slate-500">Total</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              Tendencia — últimos {rangeOpt.label.toLowerCase()}
            </h2>
            <IncidentTrendChart points={datedPoints} range={range} />
          </div>
        </div>
      </div>
    </div>
  )
}
