import type { MapPoint } from '../hooks/useCrimeIncidentsForMap'

export type PointWithDate = MapPoint & { date: Date }

export function simulateDates(points: MapPoint[], daysBack: number): PointWithDate[] {
  if (points.length === 0) return []

  const rangeMs = daysBack * 24 * 60 * 60 * 1000
  const endMs = Date.now()

  return points.map((p) => {
    const offset = Math.random() * rangeMs
    const date = new Date(endMs - offset)

    if (typeof p.hour === 'number') {
      date.setHours(p.hour, Math.floor(Math.random() * 60), 0, 0)
    }

    return { ...p, date }
  })
}
