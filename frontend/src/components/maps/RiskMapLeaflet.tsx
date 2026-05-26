import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import type { MapPoint } from '../../hooks/useCrimeIncidentsForMap'
import { riskDotColor } from './riskColors'

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428]

function FitIncidentBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14)
      return
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])
  return null
}

type Props = {
  points: MapPoint[]
}

export function RiskMapLeaflet({ points }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner">
      <MapContainer
        center={LIMA_CENTER}
        zoom={12}
        className="z-0 h-[min(70vh,560px)] w-full"
        scrollWheelZoom
      >
        <FitIncidentBounds points={points} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.source === 'inei' ? 8 : 9}
            pathOptions={{
              color: p.source === 'inei' ? '#0369a1' : '#fff',
              weight: p.source === 'inei' ? 2 : 2,
              fillColor: p.source === 'inei' ? '#38bdf8' : riskDotColor(p.riskLevel),
              fillOpacity: p.source === 'inei' ? 0.85 : 0.88,
            }}
          >
            <Popup>
              <div className="text-xs">
                {p.source === 'inei' && (
                  <p className="mb-1 font-semibold text-sky-800">INEI DataCrime / ArcGIS</p>
                )}
                {p.crimeType && <p className="font-medium">{p.crimeType}</p>}
                {p.district && <p className="text-slate-600">{p.district}</p>}
                {p.year !== undefined && Number.isFinite(p.year) && (
                  <p className="text-slate-600">Año: {p.year}</p>
                )}
                {p.source === 'firestore' && p.riskLevel && (
                  <p className="mt-1">
                    Riesgo: <strong>{p.riskLevel}</strong>
                  </p>
                )}
                <p className="font-mono text-[10px] text-slate-500">
                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
