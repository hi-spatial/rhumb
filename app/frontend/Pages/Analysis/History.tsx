import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import { AnalysisMessage } from '@/types'
import Layout from '@/components/layout/layout'
import { useAnalysisSessions } from '@/lib/hooks/useAnalysisSession'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AnalysisHistory() {
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 5
  const { sessions, loading, error, pagination } = useAnalysisSessions(currentPage, perPage)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())
  const [sessionMessages, setSessionMessages] = useState<Record<string, AnalysisMessage[]>>({})
  const [loadingMessages, setLoadingMessages] = useState<Set<string>>(new Set())

  // Reset expanded sessions when page changes
  useEffect(() => {
    setExpandedSessions(new Set())
  }, [currentPage])

  const toggleSession = async (sessionId: string) => {
    if (expandedSessions.has(sessionId)) {
      // Collapse
      const newExpanded = new Set(expandedSessions)
      newExpanded.delete(sessionId)
      setExpandedSessions(newExpanded)
    } else {
      // Expand - fetch messages if not already loaded
      setExpandedSessions(new Set([...expandedSessions, sessionId]))
      
      if (!sessionMessages[sessionId]) {
        setLoadingMessages(new Set([...loadingMessages, sessionId]))
        try {
          const response = await fetch(`/api/analysis_sessions/${sessionId}`, {
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || ''
            },
            credentials: 'include'
          })

          if (response.ok) {
            const data = await response.json()
            setSessionMessages(prev => ({
              ...prev,
              [sessionId]: data.messages || []
            }))
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err)
        } finally {
          const newLoading = new Set(loadingMessages)
          newLoading.delete(sessionId)
          setLoadingMessages(newLoading)
        }
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMessagePreview = (messages: AnalysisMessage[]) => {
    if (messages.length === 0) return 'No messages yet'
    const lastMessage = messages[messages.length - 1]
    const preview = lastMessage.content.substring(0, 100)
    return preview.length < lastMessage.content.length ? `${preview}...` : preview
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Analysis History</h1>
            <p className="text-xl text-gray-600">View and manage your past analysis sessions</p>
          </div>
          <Link href="/analysis">
            <Button variant="outline">New Analysis</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">No analysis sessions yet.</p>
            <Link href="/analysis">
              <Button>Start Your First Analysis</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {sessions.map((session) => {
              const isExpanded = expandedSessions.has(session.id)
              const messages = sessionMessages[session.id] || []
              const isLoadingMessages = loadingMessages.has(session.id)

              return (
                <Card key={session.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold capitalize">
                          {session.analysis_type.replace('_', ' ')}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <span className="capitalize">Provider: {session.ai_provider}</span>
                        <span>Created: {formatDate(session.created_at)}</span>
                      </div>
                      {messages.length > 0 && !isExpanded && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          Last message: {getMessagePreview(messages)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSession(session.id)}
                      >
                        {isExpanded ? 'Collapse' : 'View Messages'}
                      </Button>
                      <Link href={`/analysis?session=${session.id}`} as="button">
                        <Button variant="outline" size="sm">
                          Open in Analysis
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      {isLoadingMessages ? (
                        <div className="text-center py-8">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          <p className="mt-2 text-sm text-gray-600">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No messages in this session</p>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {messages.map((message) => (
                            <div
                              key={message.id}
                              className={`rounded-lg px-4 py-3 ${
                                message.role === 'user'
                                  ? 'bg-blue-50 border border-blue-200 ml-auto max-w-[80%]'
                                  : message.role === 'assistant'
                                  ? 'bg-gray-50 border border-gray-200 mr-auto max-w-[80%]'
                                  : 'bg-yellow-50 border border-yellow-200 mx-auto max-w-[80%]'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-medium capitalize text-gray-700">
                                  {message.role}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                                {message.content}
                              </div>
                              {message.payload && Object.keys(message.payload).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    View payload
                                  </summary>
                                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(message.payload, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
            </div>
            
            {pagination && pagination.total_pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, pagination.total_count)} of {pagination.total_count} sessions
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination.prev && setCurrentPage(pagination.prev)}
                    disabled={!pagination.prev || loading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                      let pageNum: number
                      if (pagination.total_pages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.total_pages - 2) {
                        pageNum = pagination.total_pages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pagination.next && setCurrentPage(pagination.next)}
                    disabled={!pagination.next || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

