import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
const WS_BASE = import.meta.env.VITE_WS_URL || API_BASE.replace(/\/api\/?$/, '/ws').replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')

class WebSocketService {
  constructor() {
    this.client = null
    this.subscriptions = {}
  }
  connect(token) {
  if (this.client && this.client.connected) {
    return Promise.resolve()
  }
  if (this.connecting) {
    return this.connecting
  }
    this.connecting = new Promise((resolve, reject) => {
    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_BASE),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('WebSocket conectado')
        this.connecting = null
        resolve()
      },
      onStompError: (error) => {
        console.error('Error STOMP:', error)
        this.connecting = null
        reject(error)
      },
    })
    this.client.activate()
  })
  return this.connecting
}
  
  disconnect() {
    if (this.client && this.client.connected) {
      this.client.deactivate()
      this.subscriptions = {}
    }
  }

  suscribirse(destino, callback) {
    if (this.client && this.client.connected) {
      const subscription = this.client.subscribe(destino, (message) => {
        callback(JSON.parse(message.body))
      })
      this.subscriptions[destino] = subscription
      return subscription
    }
  }

  publicar(destino, mensaje) {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination: destino,
        body: JSON.stringify(mensaje),
      })
    }
  }

  desuscribirse(destino) {
    if (this.subscriptions[destino]) {
      this.subscriptions[destino].unsubscribe()
      delete this.subscriptions[destino]
    }
  }
}

export const wsService = new WebSocketService()
