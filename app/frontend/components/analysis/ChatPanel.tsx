import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from '@inertiajs/react'
import { MessageRole } from '@/types'
import { MessageWithState } from '@/lib/hooks/useAnalysisSession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ChatPanelProps {
  messages: MessageWithState[]
  onSendMessage: (content: string) => void
  onRetryMessage?: (messageId: string) => void
  loading?: boolean
  className?: string
}

export default function ChatPanel({ messages, onSendMessage, onRetryMessage, loading, className }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const previousMessagesLengthRef = useRef(messages.length)

  const checkIfNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return false
    const container = messagesContainerRef.current
    const threshold = 100 // pixels from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom < threshold
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (force || shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setIsNearBottom(true)
    }
  }, [shouldAutoScroll])

  const handleScroll = useCallback(() => {
    const nearBottom = checkIfNearBottom()
    setIsNearBottom(nearBottom)
    // If user manually scrolls to bottom, enable auto-scroll again
    if (nearBottom) {
      setShouldAutoScroll(true)
    }
  }, [checkIfNearBottom])

  // Track when messages change
  useEffect(() => {
    const messagesLengthChanged = messages.length !== previousMessagesLengthRef.current
    const isNewMessage = messages.length > previousMessagesLengthRef.current
    
    if (messagesLengthChanged) {
      if (isNewMessage) {
        // New message added - scroll if user is at bottom or if it's a user message
        const lastMessage = messages[messages.length - 1]
        const isUserMessage = lastMessage?.role === 'user'
        
        if (isUserMessage || isNearBottom) {
          setShouldAutoScroll(true)
          setTimeout(() => scrollToBottom(true), 100)
        } else {
          setShouldAutoScroll(false)
        }
      }
      previousMessagesLengthRef.current = messages.length
    }
  }, [messages, isNearBottom, scrollToBottom])

  // Initial scroll to bottom when component mounts with messages
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        setIsNearBottom(true)
        setShouldAutoScroll(true)
      }, 100)
    }
  }, []) // Only on mount

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      onSendMessage(input.trim())
      setInput('')
      // Force scroll when user sends a message
      setShouldAutoScroll(true)
      setTimeout(() => scrollToBottom(true), 100)
    }
  }

  const getMessageClassName = (role: MessageRole) => {
    switch (role) {
      case 'user':
        return 'bg-blue-500 text-white ml-auto'
      case 'assistant':
        return 'bg-gray-200 text-gray-900 mr-auto'
      case 'system':
        return 'bg-yellow-100 text-yellow-900 mx-auto'
      default:
        return 'bg-gray-100 text-gray-900'
    }
  }

  return (
    <Card className={`flex flex-col h-full ${className || ''}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Analysis Chat</h3>
        <Link
          href="/analysis/history"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View History
        </Link>
      </div>
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start a conversation about your selected area.</p>
            <p className="text-sm mt-2">Ask questions like:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>"What can you tell me about this area?"</li>
              <li>"Analyze the land cover in this region"</li>
              <li>"What insights can you provide?"</li>
            </ul>
          </div>
        ) : (
          messages.map((message) => {
            const isFailed = message.isFailed
            const isLoading = message.isLoading && !message.content
            
            return (
              <div
                key={message.id}
                className={`max-w-[80%] rounded-lg px-4 py-2 ${getMessageClassName(message.role)} ${
                  isFailed ? 'border-2 border-red-300' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="text-sm font-medium capitalize">{message.role}</div>
                  {isFailed && onRetryMessage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetryMessage(message.id)}
                      className="text-xs h-6 px-2"
                    >
                      Retry
                    </Button>
                  )}
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }}>●</span>
                      <span className="animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }}>●</span>
                    </div>
                    <span className="text-sm">AI is analyzing...</span>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">{message.content || (isFailed ? message.error : '')}</div>
                    {message.payload && Object.keys(message.payload).length > 0 && (
                      <div className="mt-2 text-xs opacity-75">
                        {JSON.stringify(message.payload, null, 2)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your selected area..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  )
}

