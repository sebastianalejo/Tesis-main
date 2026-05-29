import { useMemo, useRef, useState, useEffect } from 'react'
import { riskDotColor } from './maps/riskColors'
import type { PointWithDate } from '../utils/simulateDates'

export type TimeRange = '7d' | '1m' | '3m' | '6m'

interface Props {
  points: PointWithDate[]
  range: TimeRange
  height?: number
}

const RANGE_CONFIG: Record<TimeRange, { label: string; days: number }> = {
  '7d': { label: '7 días', days: 7 },
  '1m': { label: '1 mes', days: 30 },
  '3m': { label: '3 meses', days: 90 },
  '6m': { label: '6 meses', days: 180 },
}

interface Bucket {
  name: string
  sortKey: string
  bajo: number
  medio: number
  alto: number
}

function getBucketKey(date: Date, range: TimeRange): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  if (range === '7d' || range === '1m') return d.toISOString().slice(0, 10)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().slice(0, 10)
}

function bucketLabel(date: Date, range: TimeRange): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  if (range === '7d') return days[date.getDay()]
  if (range === '1m') return `${date.getDate()}/${date.getMonth() + 1}`
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
  const week = Math.ceil((date.getDate() + startOfMonth.getDay()) / 7)
  return `S${week}`
}

function computeChartData(points: PointWithDate[], range: TimeRange) {
  const buckets: Record<string, Bucket> = {}

  for (const p of points) {
    if (!p.date) continue
    const key = getBucketKey(p.date, range)
    if (!buckets[key]) {
      buckets[key] = {
        name: bucketLabel(p.date, range),
        sortKey: key,
        bajo: 0,
        medio: 0,
        alto: 0,
      }
    }
    const rl = p.riskLevel?.toLowerCase()
    if (rl === 'bajo' || rl === 'medio' || rl === 'alto') {
      buckets[key][rl]++
    }
  }

  const sorted = Object.values(buckets).sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2))
  const firstTotal = firstHalf.reduce((s, b) => s + b.bajo + b.medio + b.alto, 0)
  const secondTotal = secondHalf.reduce((s, b) => s + b.bajo + b.medio + b.alto, 0)
  const change = firstTotal > 0 ? ((secondTotal - firstTotal) / firstTotal) * 100 : 0

  return { chartData: sorted, totalChange: change }
}

const BAR_COLORS: Record<string, string> = {
  bajo: riskDotColor('bajo'),
  medio: riskDotColor('medio'),
  alto: riskDotColor('alto'),
}

const BAR_KEYS: Array<'bajo' | 'medio' | 'alto'> = ['bajo', 'medio', 'alto']
const BAR_LABELS: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' }

export function IncidentTrendChart({ points, range, height = 240 }: Props) {
  const { chartData, totalChange } = useMemo(() => computeChartData(points, range), [points, range])
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        No hay datos para mostrar
      </div>
    )
  }

  const margin = { top: 10, right: 10, bottom: 28, left: 36 }
  const width = Math.max(containerWidth, 100)
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const maxTotal = Math.max(...chartData.map((d) => d.bajo + d.medio + d.alto), 1)
  const yTicks = 4
  const yStep = Math.ceil(maxTotal / yTicks)

  const barGap = 3
  const barCount = chartData.length
  const totalGaps = (barCount - 1) * barGap
  const barW = Math.max(4, (innerW - totalGaps) / barCount)

  const trendUp = totalChange >= 0
  const trendingLabel = `${trendUp ? '↑ +' : '↓ '}${Math.abs(totalChange).toFixed(0)}%`

  function toX(i: number) {
    return margin.left + i * (barW + barGap)
  }

  function barHeight(val: number) {
    return (val / maxTotal) * innerH
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Últimos {RANGE_CONFIG[range].label.toLowerCase()}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            trendUp
              ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
          }`}
        >
          {trendingLabel}
        </span>
      </div>

      <div ref={containerRef} className="w-full">
        <svg width={width} height={height} className="overflow-visible">
          <g>
            {Array.from({ length: yTicks + 1 }, (_, i) => {
              const val = i * yStep
              const y = margin.top + innerH - barHeight(val)
              return (
                <g key={i}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + innerW}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />
                  <text
                    x={margin.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize={10}
                  >
                    {val}
                  </text>
                </g>
              )
            })}
          </g>

          <g>
            {chartData.map((d, i) => {
              const x = toX(i)
              let accumulated = 0
              return (
                <g key={i}>
                  {BAR_KEYS.map((key) => {
                    const val = d[key]
                    if (val === 0) return null
                    const h = barHeight(val)
                    const y = margin.top + innerH - accumulated - h
                    accumulated += h
                    return (
                      <rect
                        key={key}
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(h, 1)}
                        fill={BAR_COLORS[key]}
                        rx={key === 'alto' && i === barCount - 1 ? 2 : 0}
                        ry={key === 'alto' && i === barCount - 1 ? 2 : 0}
                      />
                    )
                  })}
                </g>
              )
            })}
          </g>

          <g>
            {chartData.map((d, i) => {
              const x = toX(i)
              const labelWidth = barW >= 20 ? 60 : 40
              const skip = barCount > 12 && i % Math.ceil(barCount / 12) !== 0
              return (
                <text
                  key={i}
                  x={x + barW / 2}
                  y={margin.top + innerH + 16}
                  textAnchor="end"
                  transform={`rotate(-40, ${x + barW / 2}, ${margin.top + innerH + 16})`}
                  fill={skip ? 'transparent' : '#94a3b8'}
                  fontSize={10}
                  style={{ pointerEvents: 'none' }}
                >
                  {d.name}
                </text>
              )
            })}
          </g>

          <g>
            {chartData.map((d, i) => {
              const total = d.bajo + d.medio + d.alto
              const x = toX(i)
              const y = margin.top + innerH - barHeight(total) - 14
              if (total === 0 || barW < 16) return null
              return (
                <text
                  key={i}
                  x={x + barW / 2}
                  y={y}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={9}
                  style={{ pointerEvents: 'none' }}
                >
                  {total}
                </text>
              )
            })}
          </g>

          <g>
            {(['bajo', 'medio', 'alto'] as const).map((key, i) => (
              <g key={key} transform={`translate(${margin.left + 12 + i * 80}, 2)`}>
                <rect x={0} y={0} width={10} height={10} rx={2} fill={BAR_COLORS[key]} />
                <text x={14} y={9} fill="#475569" fontSize={11}>
                  {BAR_LABELS[key]}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
