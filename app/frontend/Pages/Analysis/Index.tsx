import React, { useState, useEffect } from 'react'
import { Link, usePage } from '@inertiajs/react'
import { PageProps, AiProvider, AnalysisType, GeoJSON } from '@/types'
import Layout from '@/components/layout/layout'
import InteractiveMap from '@/components/map/InteractiveMap'
import ChatPanel from '@/components/analysis/ChatPanel'
import { useAnalysisSession, useAnalysisSessions } from '@/lib/hooks/useAnalysisSession'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'

export default function AnalysisIndex() {
  const page = usePage<PageProps & { ai_providers?: AiProvider[] }>()
  const { auth, ai_providers: availableProviders = [], ai_defaults } = page.props
  const aiProviders = (availableProviders.length ? availableProviders : [ 'openai', 'gemini', 'custom' ]) as AiProvider[]
  const [ aiProvider, setAiProvider ] = useState<AiProvider>((auth.user?.ai_provider as AiProvider) || 'openai')
  const [selectedArea, setSelectedArea] = useState<GeoJSON.Feature | null>(null)
  const [analysisType, setAnalysisType] = useState<AnalysisType>('land_cover')
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionCreated, setSessionCreated] = useState(false)

  const { sessions, createSession } = useAnalysisSessions()
  const { session, messages, loading: sessionLoading, createMessage, retryMessage, error } = useAnalysisSession(currentSessionId)

  // Check for session query parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const sessionId = urlParams.get('session')
    if (sessionId && sessions.length > 0) {
      const foundSession = sessions.find(s => s.id === sessionId)
      if (foundSession) {
        setCurrentSessionId(sessionId)
        setSelectedArea(foundSession.area_of_interest as GeoJSON.Feature)
        setSessionCreated(true)
        // Clean up URL
        window.history.replaceState({}, '', '/analysis')
      }
    }
  }, [sessions])

  const userMetadata = (auth.user?.ai_metadata as Record<string, unknown> | undefined) || {}
  const customEndpoint = typeof userMetadata.custom_endpoint === 'string' ? userMetadata.custom_endpoint : ''
  const hasStoredKey = Boolean(auth.user?.has_ai_api_key)
  const hasDefaultCustomEndpoint = Boolean(ai_defaults?.has_custom_endpoint)
  const requiresCustomConfig = aiProvider === 'custom'
  const missingEndpoint = customEndpoint ? false : !hasDefaultCustomEndpoint
  const customSetupIncomplete = requiresCustomConfig && (!hasStoredKey || missingEndpoint)

  const handleAreaSelect = (feature: GeoJSON.Feature | null) => {
    setSelectedArea(feature)
  }

  const handleCreateSession = async (feature: GeoJSON.Feature) => {
    if (customSetupIncomplete) {
      alert('Custom provider requires an API key and endpoint. Update your AI settings first.')
      return
    }

    try {
      const newSession = await createSession({
        analysis_type: analysisType,
        area_of_interest: feature,
        metadata: {},
        ai_provider: aiProvider
      })
      setCurrentSessionId(newSession.id)
      setSessionCreated(true)
    } catch (err) {
      console.error('Failed to create session:', err)
    }
  }

  const handleSendMessage = async (content: string) => {
    if (customSetupIncomplete) {
      alert('Custom provider requires an API key and endpoint. Update your AI settings first.')
      return
    }

    // Require an existing analysis session before sending messages
    if (!currentSessionId) {
      alert('Please click "Run analysis" first to create an analysis session.')
      return
    }

    // Send the message
    await createMessage({ content })
  }

  const handleRunAnalysis = async () => {
    if (customSetupIncomplete) {
      alert('Custom provider requires an API key and endpoint. Update your AI settings first.')
      return
    }

    if (!selectedArea) {
      alert('Please draw an area on the map first.')
      return
    }

    if (currentSessionId || sessionCreated) {
      // Session already exists for this analysis
      return
    }

    try {
      await handleCreateSession(selectedArea)
    } catch (err) {
      console.error('Failed to run analysis:', err)
      alert('Failed to create analysis session. Please try again.')
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
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

          <Card className="p-4 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">AI Provider</label>
              <Select
                value={aiProvider}
                onValueChange={(value) => setAiProvider(value as AiProvider)}
                disabled={sessionCreated}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider === 'openai' && 'OpenAI'}
                      {provider === 'gemini' && 'Google Gemini'}
                      {provider === 'perplexity' && 'Perplexity'}
                      {provider === 'custom' && 'Custom HTTP'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-gray-600">
              {aiProvider === 'custom' ? (
                <>
                  Configure your endpoint and API key in settings.
                  <div className="mt-1">
                    <Link href="/settings/ai" className="text-blue-600 hover:underline">
                      Manage AI settings
                    </Link>
                  </div>
                </>
              ) : (
                'Uses workspace defaults unless you have saved your own key.'
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Status:</p>
              <p className="capitalize">{session?.status || 'No session'}</p>
            </div>
          </Card>

          <div className="flex items-end gap-2">
            <Button onClick={handleNewAnalysis} variant="outline">
              New Analysis
            </Button>
            <Button
              onClick={handleRunAnalysis}
              disabled={!selectedArea || sessionCreated || customSetupIncomplete}
            >
              Run analysis
            </Button>
          </div>
        </div>

        {customSetupIncomplete && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-900 rounded">
            Custom provider requires both an API key and endpoint. Visit{' '}
            <Link href="/settings/ai" className="font-semibold underline">
              AI Settings
            </Link>{' '}
            to finish setup.
          </div>
        )}

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
              onRetryMessage={retryMessage}
              loading={sessionLoading}
              sessionStatus={session?.status}
              className="h-[600px]"
            />
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-2xl font-bold mb-4">Recent Sessions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.slice(0, 3).map((s) => (
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
                  <p className="text-xs text-gray-500 capitalize mb-2">
                    Provider: {s.ai_provider}
                  </p>
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

