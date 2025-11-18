import React, { useState, useRef, useEffect } from 'react'
import { AnalysisMessage, MessageRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ChatPanelProps {
  messages: AnalysisMessage[]
  onSendMessage: (content: string) => void
  loading?: boolean
  className?: string
}

export default function ChatPanel({ messages, onSendMessage, loading, className }: ChatPanelProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !loading) {
      onSendMessage(input.trim())
      setInput('')
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
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Analysis Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-lg px-4 py-2 ${getMessageClassName(message.role)}`}
            >
              <div className="text-sm font-medium mb-1 capitalize">{message.role}</div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.payload && Object.keys(message.payload).length > 0 && (
                <div className="mt-2 text-xs opacity-75">
                  {JSON.stringify(message.payload, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="bg-gray-200 text-gray-900 rounded-lg px-4 py-2 mr-auto max-w-[80%]">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span>Analyzing...</span>
            </div>
          </div>
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

