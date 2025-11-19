// Action Cable client implementation
class ActionCable {
  private ws: WebSocket | null = null
  private subscriptions: Map<string, (data: unknown) => void> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false

  connect(url: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}${url}`
      
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        this.isConnected = true
        console.log('Action Cable connected')
        resolve()
      }

      this.ws.onerror = (error) => {
        this.isConnected = false
        reject(error)
      }

      this.ws.onclose = () => {
        this.ws = null
        this.isConnected = false
        if (this.subscriptions.size > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          setTimeout(() => {
            this.connect(url).then(() => {
              // Resubscribe all subscriptions
              this.subscriptions.forEach((_callback, identifier) => {
                this.send({
                  command: 'subscribe',
                  identifier
                })
              })
            }).catch(() => {
              // Silently fail reconnection attempts
            })
          }, this.reconnectDelay * this.reconnectAttempts)
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle Action Cable protocol messages
          if (data.type === 'ping') {
            return
          }

          if (data.type === 'welcome') {
            this.isConnected = true
            return
          }

          if (data.type === 'confirm_subscription') {
            return
          }

          if (data.type === 'reject_subscription') {
            console.error('Subscription rejected:', data)
            return
          }

          // Action Cable broadcasts: When Rails broadcasts via stream_from,
          // the data you pass to broadcast() is sent as-is, wrapped in a 'message' key
          // So if we broadcast { type: 'message', message: {...} }
          // It arrives as { message: { type: 'message', message: {...} } }
          if (data.message) {
            const messageData = data.message
            
            // Check if it's our broadcast format (has type field)
            if (messageData.type === 'message' || messageData.type === 'session_update') {
              // This is our broadcast - forward to callbacks
              this.subscriptions.forEach((callback) => {
                callback(messageData)
              })
              return
            }
          }

          // Direct broadcast format (data itself is the broadcast)
          // Try this if message wrapping doesn't work
          if (data.type === 'message' || data.type === 'session_update') {
            this.subscriptions.forEach((callback) => {
              callback(data)
            })
            return
          }

          // Last resort: if data has our structure but no type, try to infer
          if ((data.message && typeof data.message === 'object' && 'id' in data.message) ||
              (data.session && typeof data.session === 'object' && 'status' in data.session)) {
            // Might be our format wrapped differently
            this.subscriptions.forEach((callback) => {
              callback(data)
            })
            return
          }

          // If it has identifier, it's a protocol message, ignore
          if (data.identifier) {
            return
          }

          // Unknown format - try to pass through anyway
          if (Object.keys(data).length > 0 && !data.type) {
            this.subscriptions.forEach((callback) => {
              callback(data)
            })
          }
        } catch (error) {
          console.error('Error parsing Action Cable message:', error, event.data)
        }
      }
    })
  }

  subscribe(channel: string, params: Record<string, unknown>, callback: (data: unknown) => void) {
    const identifier = JSON.stringify({
      channel,
      ...params
    })

    this.subscriptions.set(identifier, callback)

    const performSubscribe = () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          command: 'subscribe',
          identifier
        })
      } else {
        // Wait for connection
        this.connect('/cable').then(() => {
          this.send({
            command: 'subscribe',
            identifier
          })
        }).catch((error) => {
          console.error('Failed to subscribe:', error)
        })
      }
    }

    performSubscribe()

    return {
      unsubscribe: () => {
        this.subscriptions.delete(identifier)
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({
            command: 'unsubscribe',
            identifier
          })
        }
      }
    }
  }

  private send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  disconnect() {
    this.subscriptions.clear()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Singleton instance
let cableInstance: ActionCable | null = null

export function getCable(): ActionCable {
  if (!cableInstance) {
    cableInstance = new ActionCable()
  }
  return cableInstance
}

