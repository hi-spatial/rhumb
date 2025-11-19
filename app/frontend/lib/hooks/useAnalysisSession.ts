import { useState, useEffect, useCallback, useRef } from 'react'
import { AnalysisSession, AnalysisMessage, AnalysisType, AiProvider } from '@/types'
import { getCable } from '@/lib/cable'

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

export interface MessageWithState extends AnalysisMessage {
  isLoading?: boolean
  isFailed?: boolean
  error?: string
}

export function useAnalysisSession(sessionId: string | null) {
  const [session, setSession] = useState<AnalysisSession | null>(null)
  const [messages, setMessages] = useState<MessageWithState[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const pendingMessageRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<number | null>(null)
  const lastMessageCountRef = useRef(0)
  const isRetryingRef = useRef(false)

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
      const newSession = data.analysis_session
      const newMessages = (data.messages || []).map((msg: AnalysisMessage) => ({
        ...msg,
        isLoading: false,
        isFailed: false
      }))
      
      setSession(newSession)
      
      // If session failed and we have pending messages, mark them as failed
      if (newSession?.status === 'failed') {
        setMessages(prev => {
          const hasPending = prev.some(m => m.isLoading && m.id.startsWith('pending-'))
          if (hasPending) {
            // Replace pending with failed message
            const filtered = prev.filter(m => !(m.isLoading && m.id.startsWith('pending-')))
            // Find the error message from newMessages
            const errorMsg = newMessages.find((m: MessageWithState) => m.role === 'system' && m.content.includes('failed'))
            if (errorMsg) {
              return [...filtered, { ...errorMsg, isFailed: true, error: errorMsg.content }]
            }
            // If no error message yet, create one
            return [...filtered, {
              id: `failed-${Date.now()}`,
              role: 'system' as const,
              content: 'Analysis failed',
              payload: {},
              created_at: new Date().toISOString(),
              isLoading: false,
              isFailed: true,
              error: 'Analysis failed'
            }]
          }
          // No pending, just update with new messages
          return newMessages
        })
      } else {
        // Normal update - replace with fetched messages
        setMessages(newMessages)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const createMessage = useCallback(async (params: CreateMessageParams, skipUserMessage = false) => {
    if (!sessionId) return

    setError(null)
    pendingMessageRef.current = params.content
    
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
      
      // Handle message addition based on retry scenario
      setMessages(prev => {
        // Always remove any existing pending loading messages first
        const filtered = prev.filter(m => !(m.isLoading && m.id.startsWith('pending-')))
        
        if (skipUserMessage) {
          // Retry scenario: user message already exists, don't add it again
          // Just add loading indicator - the backend will broadcast the new user message
          // and we'll handle it via Action Cable
          return [
            ...filtered,
            { 
              id: `pending-${Date.now()}`,
              role: 'assistant',
              content: '',
              payload: {},
              created_at: new Date().toISOString(),
              isLoading: true,
              isFailed: false
            } as MessageWithState
          ]
        }
        
        // Normal send: check if this exact message already exists (prevent duplicates)
        const messageExists = filtered.some(m => m.id === data.message.id)
        if (messageExists) {
          // Message already exists, just add loading indicator
          return [
            ...filtered,
            { 
              id: `pending-${Date.now()}`,
              role: 'assistant',
              content: '',
              payload: {},
              created_at: new Date().toISOString(),
              isLoading: true,
              isFailed: false
            } as MessageWithState
          ]
        }
        
        // Add new user message and loading indicator
        return [
          ...filtered,
          { ...data.message, isLoading: false, isFailed: false },
          { 
            id: `pending-${Date.now()}`,
            role: 'assistant',
            content: '',
            payload: {},
            created_at: new Date().toISOString(),
            isLoading: true,
            isFailed: false
          } as MessageWithState
        ]
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      pendingMessageRef.current = null
    }
  }, [sessionId])

  const retryMessage = useCallback(async (messageId: string) => {
    if (!sessionId || isRetryingRef.current) return

    const failedMessage = messages.find(m => m.id === messageId && m.isFailed)
    if (!failedMessage) return

    // Find the user message that triggered this failed response
    const failedIndex = messages.findIndex(m => m.id === messageId)
    const userMessage = messages[failedIndex - 1]
    
    if (userMessage && userMessage.role === 'user') {
      isRetryingRef.current = true
      
      // Remove failed message and any pending loading messages
      setMessages(prev => prev.filter(m => 
        m.id !== messageId && 
        !(m.isLoading && m.id.startsWith('pending-'))
      ))
      
      // Retry - skip adding user message since it already exists
      await createMessage({ content: userMessage.content }, true)
      
      // Reset retry flag after receiving a response (handled in Action Cable callback)
    }
  }, [sessionId, messages, createMessage])

  // Set up Action Cable subscription with fallback polling
  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      setMessages([])
      setError(null)
      setLoading(false)
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      return
    }

    // Fetch initial session data
    fetchSession().then(() => {
      lastMessageCountRef.current = messages.length
    })

    // Subscribe to Action Cable updates
    const cable = getCable()
    const subscription = cable.subscribe(
      'AnalysisSessionChannel',
      { session_id: sessionId },
      (data: any) => {
        // Handle message broadcasts
        if (data.type === 'message' && data.message) {
          const msg = data.message
          setMessages(prev => {
            // Remove pending loading messages when we get a real message
            const filtered = prev.filter(m => !(m.isLoading && m.id.startsWith('pending-')))
            
            // Check if message already exists (prevent duplicates)
            const exists = filtered.some(m => m.id === msg.id)
            if (exists) {
              // Update existing message
              return filtered.map(m => 
                m.id === msg.id 
                  ? { 
                      ...msg, 
                      isLoading: false, 
                      isFailed: msg.role === 'system' && msg.content.includes('failed')
                    }
                  : m
              )
            }
            
            // Prevent duplicate user messages from Action Cable broadcasts
            // This can happen when retrying - backend creates new message but we already have the user message
            if (msg.role === 'user') {
              // Check for duplicate by content - if we're retrying and already have this exact content, ignore it
              const duplicateUser = filtered.some(m => 
                m.role === 'user' && 
                m.content === msg.content
              )
              if (duplicateUser && isRetryingRef.current) {
                // We're retrying and user message already exists, ignore this broadcast
                // The loading indicator is already added, just wait for assistant response
                console.log('Ignoring duplicate user message during retry:', msg.id)
                return filtered
              }
            }
            
            // Add new message - mark as failed if it's a system error message
            const isFailed = msg.role === 'system' && msg.content.includes('failed')
            
            // Reset retry flag when we receive assistant/system response
            if (msg.role === 'assistant' || msg.role === 'system') {
              isRetryingRef.current = false
            }
            
            const newMessages = [...filtered, { 
              ...msg, 
              isLoading: false, 
              isFailed,
              error: isFailed ? msg.content : undefined
            }]
            lastMessageCountRef.current = newMessages.length
            return newMessages
          })
          pendingMessageRef.current = null
        } 
        
        // Handle session updates - CRITICAL: This stops loading immediately on failure
        if (data.type === 'session_update' && data.session) {
          setSession(prev => prev ? { ...prev, ...data.session } : null)
          
          // If session failed, IMMEDIATELY mark pending message as failed
          if (data.session.status === 'failed') {
            // Reset retry flag on failure
            isRetryingRef.current = false
            setMessages(prev => {
              const hasPending = prev.some(m => m.isLoading && m.id.startsWith('pending-'))
              if (hasPending) {
                // Transform pending message to failed message
                return prev.map(m => 
                  m.isLoading && m.id.startsWith('pending-')
                    ? { 
                        ...m, 
                        isLoading: false, 
                        isFailed: true, 
                        error: 'Analysis failed',
                        content: 'Analysis failed - waiting for error details...',
                        role: 'system' as const
                      }
                    : m
                )
              }
              return prev
            })
            pendingMessageRef.current = null
          } else if (data.session.status === 'completed') {
            // Reset retry flag on completion
            isRetryingRef.current = false
            // Session completed - remove any pending loading messages
            setMessages(prev => prev.filter(m => !(m.isLoading && m.id.startsWith('pending-'))))
            pendingMessageRef.current = null
          }
        }
      }
    )

    subscriptionRef.current = subscription

    // Fallback: Poll for updates if Action Cable isn't working
    // This ensures loading stops even if WebSocket fails
    const startPolling = () => {
      if (pollIntervalRef.current) return
      
      pollIntervalRef.current = window.setInterval(() => {
        // Check current state
        setMessages(prev => {
          const hasPending = prev.some(m => m.isLoading && m.id.startsWith('pending-'))
          if (!hasPending) {
            // No pending messages, stop polling
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            return prev
          }
          return prev
        })
        
        // Fetch latest session state
        fetchSession()
      }, 2000) // Poll every 2 seconds as fallback
    }

    // Start polling after a short delay to give Action Cable a chance
    const pollTimeout = setTimeout(startPolling, 3000)

    return () => {
      subscription.unsubscribe()
      subscriptionRef.current = null
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      clearTimeout(pollTimeout)
    }
  }, [sessionId, fetchSession])

  return {
    session,
    messages,
    loading,
    error,
    createMessage,
    retryMessage,
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

