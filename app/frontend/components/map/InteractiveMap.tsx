/* eslint-disable @typescript-eslint/no-var-requires */
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { MaplibreTerradrawControl } from '@watergis/maplibre-gl-terradraw'
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder'
import 'maplibre-gl/dist/maplibre-gl.css'
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css'
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css'
import { GeoJSON } from '@/types'

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
  const hasRequestedGeolocationRef = useRef(false)

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
    mapInstance.addControl(new maplibregl.NavigationControl({
      visualizePitch: false,
      showCompass: false
    }), 'bottom-right')

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
        // 'delete',
        // 'download'
      ],
      open: true
    })

    mapInstance.addControl(drawControl, 'top-left')

    // Geocoder powered by Nominatim (similar to the example you shared)
    const geocoderApi = {
      forwardGeocode: async (config: { query: string }) => {
        const features: any[] = []

        try {
          const request =
            'https://nominatim.openstreetmap.org/search?' +
            new URLSearchParams({
              q: config.query,
              format: 'geojson',
              polygon_geojson: '1',
              addressdetails: '1'
            }).toString()

          const response = await fetch(request)
          const geojson = await response.json()

          for (const feature of geojson.features) {
            if (!feature.bbox) continue

            const center = [
              feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
              feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2
            ] as [number, number]

            features.push({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: center
              },
              place_name: feature.properties.display_name,
              properties: feature.properties,
              text: feature.properties.display_name,
              place_type: ['place'],
              center
            })
          }
        } catch (e) {
          console.error('Failed to forwardGeocode with error:', e)
        }

        return { features }
      }
    }

    const geocoderControl = new (MaplibreGeocoder as any)(geocoderApi, {
      maplibregl,
      showResultsWhileTyping: true,
      showResultMarkers: true,
      placeholder: 'Search for a location...'
    } as any)

    mapInstance.addControl(geocoderControl, 'top-right')

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
      // When TerraDraw hasn't finished enabling yet, calling clear/addFeatures
      // can throw "Terra Draw is not enabled". Ignore that specific case since
      // it will succeed once TerraDraw is ready, and we don't want noisy logs.
      if (err instanceof Error && err.message.includes('Terra Draw is not enabled')) {
        return
      }
      console.error('Error syncing initialArea to TerraDraw:', err)
    }
  }, [initialArea])

  // Center map on user's location when there is no initial area
  useEffect(() => {
    if (!map.current) return
    if (initialArea) return
    if (hasRequestedGeolocationRef.current) return

    if (!('geolocation' in navigator)) {
      hasRequestedGeolocationRef.current = true
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!map.current) return

        const { latitude, longitude } = position.coords
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 1000
        })

        hasRequestedGeolocationRef.current = true
      },
      () => {
        hasRequestedGeolocationRef.current = true
      }
    )
  }, [initialArea])

  return (
    <div className={`relative ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  )
}