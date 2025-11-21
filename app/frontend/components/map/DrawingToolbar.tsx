import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Minus, 
  Square, 
  Circle, 
  Pentagon,
  Trash2,
  Hand
} from 'lucide-react'

export type DrawingMode = 'point' | 'line_string' | 'polygon' | 'rectangle' | 'circle' | 'select' | null

interface DrawingToolbarProps {
  currentMode: DrawingMode
  onModeChange: (mode: DrawingMode) => void
  onClear: () => void
  hasFeatures: boolean
  className?: string
}

export default function DrawingToolbar({ 
  currentMode, 
  onModeChange, 
  onClear, 
  hasFeatures,
  className = '' 
}: DrawingToolbarProps) {
  const tools = [
    {
      mode: 'select' as DrawingMode,
      icon: Hand,
      label: 'Select',
      tooltip: 'Select and edit features'
    },
    {
      mode: 'point' as DrawingMode,
      icon: MapPin,
      label: 'Point',
      tooltip: 'Draw point'
    },
    {
      mode: 'line_string' as DrawingMode,
      icon: Minus,
      label: 'Line',
      tooltip: 'Draw line'
    },
    {
      mode: 'polygon' as DrawingMode,
      icon: Pentagon,
      label: 'Polygon',
      tooltip: 'Draw polygon'
    },
    {
      mode: 'rectangle' as DrawingMode,
      icon: Square,
      label: 'Rectangle',
      tooltip: 'Draw rectangle'
    },
    {
      mode: 'circle' as DrawingMode,
      icon: Circle,
      label: 'Circle',
      tooltip: 'Draw circle'
    }
  ]

  return (
    <div className={`flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2 ${className}`}>
      {tools.map(({ mode, icon: Icon, label, tooltip }) => (
        <Button
          key={mode}
          variant={currentMode === mode ? "default" : "outline"}
          size="sm"
          onClick={() => onModeChange(mode)}
          title={tooltip}
          className="w-10 h-10 p-0 flex items-center justify-center"
        >
          <Icon className="w-4 h-4" />
          <span className="sr-only">{label}</span>
        </Button>
      ))}
      
      {hasFeatures && (
        <>
          <div className="border-t border-gray-200 my-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            title="Clear all features"
            className="w-10 h-10 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span className="sr-only">Clear</span>
          </Button>
        </>
      )}
    </div>
  )
}
