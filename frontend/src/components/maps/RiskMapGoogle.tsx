import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useCallback, useEffect, useRef } from 'react'
import type { MapPoint } from '../../hooks/useCrimeIncidentsForMap'
import { riskDotColor } from './riskColors'

const containerStyle = { width: '100%', height: 'min(70vh, 560px)' }
const defaultCenter = { lat: -12.0464, lng: -77.0428 }

type Props = {
  apiKey: string
  points: MapPoint[]
}

export function RiskMapGoogle({ apiKey, points }: Props) {
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'riskmap-google-script',
    googleMapsApiKey: apiKey,
    version: 'weekly',
  })

  const fitBounds = useCallback((map: google.maps.Map, pts: MapPoint[]) => {
    if (pts.length === 0) return
    if (pts.length === 1) {
      map.setCenter({ lat: pts[0].lat, lng: pts[0].lng })
      map.setZoom(14)
      return
    }
    const bounds = new google.maps.LatLngBounds()
    pts.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
    map.fitBounds(bounds, 48)
  }, [])

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      fitBounds(map, points)
    },
    [fitBounds, points],
  )

  useEffect(() => {
    const map = mapRef.current
    if (map && isLoaded) fitBounds(map, points)
  }, [points, fitBounds, isLoaded])

  if (loadError) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        No se pudo cargar Google Maps. Revisa la clave de API y que Maps JavaScript API esté activada.
      </p>
    )
  }

  if (!isLoaded) {
    return (
      <div
        className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600"
        role="status"
      >
        Cargando mapa…
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-inner">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onLoad}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {points.map((p) => (
          <Marker
            key={p.id}
            position={{ lat: p.lat, lng: p.lng }}
            title={[p.crimeType, p.district].filter(Boolean).join(' · ')}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: p.source === 'inei' ? 8 : 9,
              fillColor: p.source === 'inei' ? '#38bdf8' : riskDotColor(p.riskLevel),
              fillOpacity: 0.95,
              strokeColor: p.source === 'inei' ? '#0369a1' : '#ffffff',
              strokeWeight: 2,
            }}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
