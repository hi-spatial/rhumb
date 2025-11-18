import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { GeoJSON } from '@/types'

interface InteractiveMapProps {
  onAreaSelect?: (geojson: GeoJSON.Feature) => void
  initialArea?: GeoJSON.Feature | null
  className?: string
}

export default function InteractiveMap({ onAreaSelect, initialArea, className }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState<[number, number][]>([])
  const polygonLayerId = 'polygon-layer'
  const polygonSourceId = 'polygon-source'

  const clearPolygonOnMap = () => {
    if (!map.current) return
    const source = map.current.getSource(polygonSourceId)
    if (source) {
      (source as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [] },
        properties: {}
      })
    }
    if (map.current.getLayer(polygonLayerId)) {
      map.current.removeLayer(polygonLayerId)
    }
    if (map.current.getLayer(`${polygonLayerId}-outline`)) {
      map.current.removeLayer(`${polygonLayerId}-outline`)
    }
    if (map.current.getSource(polygonSourceId)) {
      map.current.removeSource(polygonSourceId)
    }
  }

  const updatePolygonOnMap = (feature: GeoJSON.Feature) => {
    if (!map.current) return

    const source = map.current.getSource(polygonSourceId)
    if (source) {
      (source as maplibregl.GeoJSONSource).setData(feature)
    } else {
      map.current.addSource(polygonSourceId, {
        type: 'geojson',
        data: feature
      })

      map.current.addLayer({
        id: polygonLayerId,
        type: 'fill',
        source: polygonSourceId,
        paint: {
          'fill-color': '#088',
          'fill-opacity': 0.3
        }
      })

      map.current.addLayer({
        id: `${polygonLayerId}-outline`,
        type: 'line',
        source: polygonSourceId,
        paint: {
          'line-color': '#088',
          'line-width': 2
        }
      })
    }
  }

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [0, 0],
      zoom: 2
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    return () => {
      map.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (!map.current) return

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing) return

      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
      setPoints(prev => {
        const newPoints = [...prev, newPoint]

        if (newPoints.length >= 3) {
          const feature: GeoJSON.Feature = {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[...newPoints, newPoints[0]]]
            },
            properties: {}
          }

          updatePolygonOnMap(feature)
          if (onAreaSelect) {
            onAreaSelect(feature)
          }
        }

        return newPoints
      })
    }

    map.current.on('click', handleClick)

    return () => {
      map.current?.off('click', handleClick)
    }

  }, [isDrawing, onAreaSelect])

  useEffect(() => {
    if (!map.current) return

    let frameId: number | null = null

    if (initialArea) {
      updatePolygonOnMap(initialArea)
      if (initialArea.geometry.type === 'Polygon') {
        const coords = initialArea.geometry.coordinates[0]
        const nextPoints = coords.slice(0, -1) as [number, number][]
        frameId = requestAnimationFrame(() => {
          setPoints((prev) => {
            if (prev.length === nextPoints.length && prev.every((point, index) => point[0] === nextPoints[index][0] && point[1] === nextPoints[index][1])) {
              return prev
            }
            return nextPoints
          })
        })
      }
    } else {
      clearPolygonOnMap()
      frameId = requestAnimationFrame(() => {
        setPoints((prev) => (prev.length === 0 ? prev : []))
      })
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [initialArea])

  const toggleDrawing = () => {
    setIsDrawing(!isDrawing)
    if (!isDrawing) {
      setPoints([])
      if (map.current) {
        const source = map.current.getSource(polygonSourceId)
        if (source) {
          (source as maplibregl.GeoJSONSource).setData({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [] },
            properties: {}
          })
        }
      }
    }
  }

  const clearArea = () => {
    setPoints([])
    setIsDrawing(false)
    clearPolygonOnMap()
    if (onAreaSelect) {
      onAreaSelect(null as unknown as GeoJSON.Feature)
    }
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={toggleDrawing}
          className={`px-4 py-2 rounded shadow bg-white hover:bg-gray-50 ${
            isDrawing ? 'bg-blue-500 text-white' : ''
          }`}
        >
          {isDrawing ? 'Stop Drawing' : 'Draw Area'}
        </button>
        {points.length > 0 && (
          <button
            onClick={clearArea}
            className="px-4 py-2 rounded shadow bg-white hover:bg-gray-50 text-red-600"
          >
            Clear
          </button>
        )}
      </div>
      {isDrawing && (
        <div className="absolute bottom-4 left-4 z-10 bg-white px-4 py-2 rounded shadow">
          <p className="text-sm text-gray-700">
            Click on the map to add points. Need at least 3 points to create a polygon.
          </p>
        </div>
      )}
    </div>
  )
}

