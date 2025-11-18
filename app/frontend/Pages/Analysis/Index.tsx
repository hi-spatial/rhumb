import React, { useState } from 'react'
import { usePage } from '@inertiajs/react'
import { PageProps } from '@/types'
import Layout from '@/components/layout/layout'
import InteractiveMap from '@/components/map/InteractiveMap'
import ChatPanel from '@/components/analysis/ChatPanel'
import { useAnalysisSession, useAnalysisSessions } from '@/lib/hooks/useAnalysisSession'
import { AnalysisType, GeoJSON } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export default function AnalysisIndex() {
  const { auth } = usePage<PageProps>().props
  const [selectedArea, setSelectedArea] = useState<GeoJSON.Feature | null>(null)
  const [analysisType, setAnalysisType] = useState<AnalysisType>('land_cover')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionCreated, setSessionCreated] = useState(false)

  const { sessions, createSession, loading: sessionsLoading } = useAnalysisSessions()
  const { session, messages, loading: sessionLoading, createMessage, error } = useAnalysisSession(currentSessionId)

  const handleAreaSelect = (feature: GeoJSON.Feature | null) => {
    setSelectedArea(feature)
    if (feature && !sessionCreated) {
      handleCreateSession(feature)
    }
  }

  const handleCreateSession = async (feature: GeoJSON.Feature) => {
    try {
      const newSession = await createSession({
        analysis_type: analysisType,
        area_of_interest: feature,
        metadata: {}
      })
      setCurrentSessionId(newSession.id)
      setSessionCreated(true)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (!currentSessionId) {
      if (selectedArea) {
        await handleCreateSession(selectedArea)
      } else {
        alert('Please select an area on the map first')
        return
      }
    }
    await createMessage({ content })
  }

  const handleNewAnalysis = () => {
    setSelectedArea(null)
    setCurrentSessionId(null)
    setSessionCreated(false)
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Geospatial Analysis</h1>
          <p className="text-xl text-gray-600">Select an area on the map and analyze it with AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-4">
            <label className="block text-sm font-medium mb-2">Analysis Type</label>
            <Select
              value={analysisType}
              onValueChange={(value) => setAnalysisType(value as AnalysisType)}
              disabled={sessionCreated}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heat_island">Urban Heat Island</SelectItem>
                <SelectItem value="land_cover">Land Cover</SelectItem>
                <SelectItem value="land_cover_change">Land Cover Change</SelectItem>
                <SelectItem value="air_pollution">Air Pollution</SelectItem>
              </SelectContent>
            </Select>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Status:</p>
              <p className="capitalize">{session?.status || 'No session'}</p>
            </div>
          </Card>

          <div className="flex items-end">
            <Button onClick={handleNewAnalysis} variant="outline">
              New Analysis
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
              <InteractiveMap
                onAreaSelect={handleAreaSelect}
                initialArea={selectedArea}
                className="w-full h-full"
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={sessionLoading}
              className="h-[600px]"
            />
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Recent Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 6).map((s) => (
                <Card
                  key={s.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition"
                  onClick={() => {
                    setCurrentSessionId(s.id)
                    setSelectedArea(s.area_of_interest as GeoJSON.Feature)
                    setSessionCreated(true)
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium capitalize">{s.analysis_type.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-1 rounded capitalize ${
                      s.status === 'completed' ? 'bg-green-100 text-green-800' :
                      s.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      s.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

