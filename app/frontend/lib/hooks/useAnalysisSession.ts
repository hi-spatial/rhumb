import { useState, useEffect, useCallback } from 'react'
import { AnalysisSession, AnalysisMessage, AnalysisType, AiProvider } from '@/types'

interface CreateSessionParams {
  analysis_type: AnalysisType
  area_of_interest: GeoJSON.Geometry | GeoJSON.Feature | GeoJSON.FeatureCollection
  metadata?: Record<string, unknown>
  ai_provider: AiProvider
}

interface CreateMessageParams {
  content: string
  payload?: Record<string, unknown>
}

export function useAnalysisSession(sessionId: string | null) {
  const [session, setSession] = useState<AnalysisSession | null>(null)
  const [messages, setMessages] = useState<AnalysisMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSession = useCallback(async () => {
    if (!sessionId) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analysis_sessions/${sessionId}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch session')
      }

      const data = await response.json()
      setSession(data.analysis_session)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const createMessage = useCallback(async (params: CreateMessageParams) => {
    if (!sessionId) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/analysis_sessions/${sessionId}/analysis_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          analysis_message: params
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.join(', ') || 'Failed to create message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      
      // Poll for updates
      setTimeout(() => {
        fetchSession()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sessionId, fetchSession])

  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      setMessages([])
      setError(null)
      setLoading(false)
      return
    }

    fetchSession()
    const interval = setInterval(fetchSession, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [sessionId, fetchSession])

  return {
    session,
    messages,
    loading,
    error,
    createMessage,
    refresh: fetchSession
  }
}

export function useAnalysisSessions() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analysis_sessions', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.analysis_sessions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSession = useCallback(async (params: CreateSessionParams) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/analysis_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          analysis_session: params
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.errors?.join(', ') || 'Failed to create session')
      }

      const data = await response.json()
      setSessions(prev => [data.analysis_session, ...prev])
      return data.analysis_session
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  return {
    sessions,
    loading,
    error,
    createSession,
    refresh: fetchSessions
  }
}

