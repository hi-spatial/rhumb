import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css'
import { GeoJSON } from '@/types'
import LocationSearch from './LocationSearch'

interface InteractiveMapProps {
  onAreaSelect?: (geojson: GeoJSON.Feature) => void
  initialArea?: GeoJSON.Feature | null
  className?: string
  initialCenter?: [number, number]
  initialZoom?: number
}

export default function InteractiveMap({
  onAreaSelect,
  initialArea,
  className,
  initialCenter,
  initialZoom
}: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const terraDrawRef = useRef<any>(null)
  const onAreaSelectRef = useRef<typeof onAreaSelect | undefined>(undefined)

  // Keep latest callback in a ref so the effect can be [] like TerraDrawMap
  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect
  }, [onAreaSelect])

  // Initialize map and TerraDraw (mirror TerraDrawMap.tsx)
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/bright',
      center: initialCenter || [-91.874, 42.76],
      zoom: initialZoom ?? 12
    })
    map.current = mapInstance

    // Navigation controls
    mapInstance.addControl(new maplibregl.NavigationControl({}), 'top-right')

    // TerraDraw control, same config as TerraDrawMap.tsx
    const drawControl = new MaplibreTerradrawControl({
      modes: [
        'point',
        'linestring',
        'polygon',
        'rectangle',
        'circle',
        'freehand',
        'angled-rectangle',
        'sensor',
        'sector',
        'select',
        'delete-selection',
        'delete',
        'download'
      ],
      open: true
    })

    mapInstance.addControl(drawControl, 'top-left')

    const terraDraw = drawControl.getTerraDrawInstance()
    terraDrawRef.current = terraDraw

    // Add initial area once if provided
    if (initialArea) {
      try {
        terraDraw.addFeatures([initialArea as any])
      } catch (err) {
        console.error('Error adding initial area to TerraDraw:', err)
      }
    }

    // Notify parent when user finishes drawing
    const handleFinish = (id: any) => {
      const cb = onAreaSelectRef.current
      if (!cb) return

      try {
        const features = terraDraw.getSnapshot() as any[]
        const feature = features.find((f: any) => f.id === id)
        if (feature) {
          cb(feature as GeoJSON.Feature)
        }
      } catch (err) {
        console.error('Error reading TerraDraw features:', err)
      }
    }

    terraDraw.on('finish', handleFinish)

    // Cleanup
    return () => {
      try {
        terraDraw.off('finish', handleFinish)
      } catch {
        // ignore
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      terraDrawRef.current = null
    }
    // We intentionally omit dependencies to keep behavior identical to TerraDrawMap.tsx
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If initialArea changes after mount (e.g. selecting a past session),
  // update the TerraDraw store without sending callbacks back up.
  useEffect(() => {
    if (!terraDrawRef.current) return
    const terraDraw = terraDrawRef.current

    try {
      terraDraw.clear()
      if (initialArea) {
        terraDraw.addFeatures([initialArea as any])
      }
    } catch (err) {
      console.error('Error syncing initialArea to TerraDraw:', err)
    }
  }, [initialArea])

  // Location search → move/fly the map only
  const handleLocationSelect = useCallback(
    (location: {
      lat: number
      lng: number
      bounds?: [[number, number], [number, number]]
      name: string
    }) => {
      if (!map.current) return

      if (location.bounds) {
        const [[south, west], [north, east]] = location.bounds
        map.current.fitBounds([west, south, east, north], {
          padding: 50,
          maxZoom: 15
        })
      } else {
        map.current.flyTo({
          center: [location.lng, location.lat],
          zoom: 12,
          duration: 1000
        })
      }
    },
    []
  )

  return (
    <div className={`relative ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full" />

      {/* Location search powered by OpenStreetMap Nominatim */}
      <LocationSearch
        onLocationSelect={handleLocationSelect}
        className="absolute top-4 right-4 z-10 w-80"
        placeholder="Search for a location..."
      />
    </div>
  )
}