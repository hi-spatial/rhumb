import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import MaplibreGlDraw from 'maplibre-gl-draw'
import 'maplibre-gl/dist/maplibre-gl.css'
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css'
import { GeoJSON } from '@/types'
import DrawingToolbar, { DrawingMode } from './DrawingToolbar'
import LocationSearch from './LocationSearch'

interface InteractiveMapProps {
  onAreaSelect?: (geojson: GeoJSON.Feature) => void
  initialArea?: GeoJSON.Feature | null
  className?: string
}

export default function InteractiveMap({ onAreaSelect, initialArea, className }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const draw = useRef<MaplibreGlDraw | null>(null)
  const [currentMode, setCurrentMode] = useState<DrawingMode>('select')
  const [hasFeatures, setHasFeatures] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

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
      zoom: 2,
      doubleClickZoom: false // Disable double-click zoom to prevent conflicts with drawing
    })

    // Add navigation control
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // Initialize MapLibre GL Draw with custom styles
    draw.current = new MaplibreGlDraw({
      displayControlsDefault: false,
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill
        {
          id: 'gl-draw-polygon-fill-inactive',
          type: 'fill',
          filter: ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'static']
          ],
          paint: {
            'fill-color': '#3bb2d0',
            'fill-outline-color': '#3bb2d0',
            'fill-opacity': 0.1
          }
        },
        {
          id: 'gl-draw-polygon-fill-active',
          type: 'fill',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          paint: {
            'fill-color': '#fbb03b',
            'fill-outline-color': '#fbb03b',
            'fill-opacity': 0.1
          }
        },
        // Polygon outline
        {
          id: 'gl-draw-polygon-stroke-inactive',
          type: 'line',
          filter: ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Polygon'],
            ['!=', 'mode', 'static']
          ],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#3bb2d0',
            'line-width': 2
          }
        },
        {
          id: 'gl-draw-polygon-stroke-active',
          type: 'line',
          filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#fbb03b',
            'line-width': 2
          }
        },
        // Line styling - MADE MORE VISIBLE
        {
          id: 'gl-draw-line-inactive',
          type: 'line',
          filter: ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'LineString'],
            ['!=', 'mode', 'static']
          ],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#3bb2d0',
            'line-width': 3
          }
        },
        {
          id: 'gl-draw-line-active',
          type: 'line',
          filter: ['all',
            ['==', '$type', 'LineString'],
            ['==', 'active', 'true']
          ],
          layout: {
            'line-cap': 'round',
            'line-join': 'round'
          },
          paint: {
            'line-color': '#fbb03b',
            'line-dasharray': [0.2, 2],
            'line-width': 3
          }
        },
        // Point styling
        {
          id: 'gl-draw-point-inactive',
          type: 'circle',
          filter: ['all',
            ['==', 'active', 'false'],
            ['==', '$type', 'Point'],
            ['==', 'meta', 'feature'],
            ['!=', 'mode', 'static']
          ],
          paint: {
            'circle-radius': 5,
            'circle-color': '#3bb2d0'
          }
        },
        {
          id: 'gl-draw-point-active',
          type: 'circle',
          filter: ['all',
            ['==', '$type', 'Point'],
            ['==', 'active', 'true'],
            ['!=', 'meta', 'midpoint']
          ],
          paint: {
            'circle-radius': 7,
            'circle-color': '#fbb03b'
          }
        },
        // Vertices (shown while editing)
        {
          id: 'gl-draw-polygon-and-line-vertex-inactive',
          type: 'circle',
          filter: ['all',
            ['==', 'meta', 'vertex'],
            ['==', '$type', 'Point'],
            ['!=', 'mode', 'static']
          ],
          paint: {
            'circle-radius': 5,
            'circle-color': '#fff',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fbb03b'
          }
        }
      ]
    })

    map.current.addControl(draw.current as any)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Listen for drawing events
  useEffect(() => {
    if (!map.current || !draw.current) return

    const handleDrawCreate = (e: { features: GeoJSON.Feature[] }) => {
      console.log('Draw create:', e)
      setHasFeatures(true)
      // Only call onAreaSelect when a feature is completely created
      if (onAreaSelect && e.features && e.features.length > 0) {
        // Get the complete feature from the draw instance
        const allFeatures = draw.current?.getAll()
        if (allFeatures && allFeatures.features.length > 0) {
          // Use the last created feature
          const lastFeature = allFeatures.features[allFeatures.features.length - 1]
          onAreaSelect(lastFeature)
        }
      }
    }

    const handleDrawUpdate = (e: { features: GeoJSON.Feature[], action: string }) => {
      console.log('Draw update:', e)
      // Only update on move_end or finish actions, not during drawing
      if (onAreaSelect && e.features && e.features.length > 0) {
        onAreaSelect(e.features[0])
      }
    }

    const handleDrawDelete = () => {
      console.log('Draw delete')
      // Check if there are any remaining features
      if (draw.current) {
        const allFeatures = draw.current.getAll()
        setHasFeatures(allFeatures.features.length > 0)
        if (allFeatures.features.length === 0 && onAreaSelect) {
          onAreaSelect(null as unknown as GeoJSON.Feature)
        }
      }
    }

    map.current.on('draw.create', handleDrawCreate)
    map.current.on('draw.update', handleDrawUpdate)
    map.current.on('draw.delete', handleDrawDelete)

    return () => {
      if (map.current) {
        map.current.off('draw.create', handleDrawCreate)
        map.current.off('draw.update', handleDrawUpdate)
        map.current.off('draw.delete', handleDrawDelete)
      }
    }
  }, [onAreaSelect])

  // Handle mode changes
  const handleModeChange = useCallback((mode: DrawingMode) => {
    if (!draw.current) return

    setCurrentMode(mode)

    // Map our modes to MapLibre GL Draw modes
    switch (mode) {
      case 'point':
        draw.current.changeMode('draw_point')
        break
      case 'line_string':
        draw.current.changeMode('draw_line_string')
        break
      case 'polygon':
        draw.current.changeMode('draw_polygon')
        break
      case 'rectangle':
        // MapLibre GL Draw doesn't have a built-in rectangle mode
        // We'll use draw_polygon and let users create it manually
        draw.current.changeMode('draw_polygon')
        break
      case 'circle':
        // MapLibre GL Draw doesn't have a built-in circle mode
        // We'll use draw_polygon as approximation
        draw.current.changeMode('draw_polygon')
        break
      case 'select':
      default:
        draw.current.changeMode('simple_select')
        break
    }
  }, [])

  // Handle location search selection
  const handleLocationSelect = useCallback((location: { lat: number, lng: number, bounds?: [[number, number], [number, number]], name: string }) => {
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
  }, [])

  // Clear all features
  const handleClear = useCallback(() => {
    if (!draw.current) return
    
    draw.current.deleteAll()
    setHasFeatures(false)
    setCurrentMode('select')
    
    if (onAreaSelect) {
      onAreaSelect(null as unknown as GeoJSON.Feature)
    }
  }, [onAreaSelect])

  // Fit map to geometry bounds
  const fitToGeometry = useCallback((feature: GeoJSON.Feature) => {
    if (!map.current || !feature.geometry) return

    try {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates as [number, number]
        map.current.flyTo({
          center: [lng, lat],
          zoom: 12,
          duration: 1000
        })
      } else {
        // Calculate bounds for other geometry types
        let bounds: maplibregl.LngLatBoundsLike | undefined

        if (feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0] as [number, number][]
          if (coordinates.length > 0) {
            const lngs = coordinates.map(coord => coord[0])
            const lats = coordinates.map(coord => coord[1])
            bounds = [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)]
            ]
          }
        } else if (feature.geometry.type === 'LineString') {
          const coordinates = feature.geometry.coordinates as [number, number][]
          if (coordinates.length > 0) {
            const lngs = coordinates.map(coord => coord[0])
            const lats = coordinates.map(coord => coord[1])
            bounds = [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)]
            ]
          }
        }

        if (bounds) {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15,
            duration: 1000
          })
        }
      }
    } catch (error) {
      console.error('Error fitting to geometry:', error)
    }
  }, [])

  // Handle initial area loading and auto-navigation
  useEffect(() => {
    if (!map.current || !draw.current) return

    if (initialArea) {
      // Clear existing features first
      draw.current.deleteAll()
      
      // Add the initial area
      const featureIds = draw.current.add(initialArea)
      
      setTimeout(() => {
        setHasFeatures(featureIds.length > 0)
        fitToGeometry(initialArea)
      }, 100)
    } else {
      // Clear all features if no initial area
      draw.current.deleteAll()
      setTimeout(() => {
        setHasFeatures(false)
      }, 0)
    }
  }, [initialArea, fitToGeometry])

  // Get drawing instruction text
  const getDrawingInstructions = () => {
    switch (currentMode) {
      case 'point':
        return 'Click on the map to place a point'
      case 'line_string':
        return 'Click to start drawing a line, double-click or press Enter to finish'
      case 'polygon':
        return 'Click to start drawing a polygon, double-click or press Enter to finish'
      case 'rectangle':
        return 'Draw a polygon with 4 points to create a rectangle'
      case 'circle':
        return 'Draw a polygon to approximate a circle'
      case 'select':
        return 'Click on features to select and edit them'
      default:
        return null
    }
  }

  return (
    <div className={`relative ${className || ''}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Drawing Toolbar */}
      <DrawingToolbar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onClear={handleClear}
        hasFeatures={hasFeatures}
        className="absolute top-4 left-4 z-10"
      />

      {/* Location Search */}
      <LocationSearch
        onLocationSelect={handleLocationSelect}
        className="absolute top-4 right-4 z-10 w-80"
        placeholder="Search for a location..."
      />

      {/* Drawing Instructions */}
      {currentMode && currentMode !== 'select' && (
        <div className="absolute bottom-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-lg max-w-sm">
          <p className="text-sm text-gray-700">
            {getDrawingInstructions()}
          </p>
        </div>
      )}
    </div>
  )
}