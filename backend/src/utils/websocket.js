const WebSocket = require('ws')

let wss = null
const clients = new Map()

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' })

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId()
    clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      connectedAt: Date.now(),
    })

    console.log(`WebSocket client connected: ${clientId}`)

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message)
        handleMessage(clientId, data)
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    })

    ws.on('close', () => {
      clients.delete(clientId)
      console.log(`WebSocket client disconnected: ${clientId}`)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error)
      clients.delete(clientId)
    })

    send(ws, {
      type: 'connected',
      clientId,
      timestamp: Date.now(),
    })
  })

  console.log('WebSocket server initialized')
  return wss
}

function handleMessage(clientId, data) {
  const client = clients.get(clientId)
  if (!client) return

  switch (data.type) {
    case 'subscribe':
      if (data.channel) {
        client.subscriptions.add(data.channel)
        send(client.ws, {
          type: 'subscribed',
          channel: data.channel,
        })
      }
      break

    case 'unsubscribe':
      if (data.channel) {
        client.subscriptions.delete(data.channel)
        send(client.ws, {
          type: 'unsubscribed',
          channel: data.channel,
        })
      }
      break

    case 'ping':
      send(client.ws, { type: 'pong', timestamp: Date.now() })
      break
  }
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data))
  }
}

function broadcast(channel, data) {
  const message = JSON.stringify({
    type: 'data',
    channel,
    data,
    timestamp: Date.now(),
  })

  clients.forEach((client) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message)
    }
  })
}

function broadcastAll(data) {
  const message = JSON.stringify({
    type: 'broadcast',
    data,
    timestamp: Date.now(),
  })

  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message)
    }
  })
}

function getClientCount() {
  return clients.size
}

function getSubscribers(channel) {
  let count = 0
  clients.forEach((client) => {
    if (client.subscriptions.has(channel)) {
      count++
    }
  })
  return count
}

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function close() {
  if (wss) {
    wss.close()
    clients.clear()
  }
}

module.exports = {
  initWebSocket,
  broadcast,
  broadcastAll,
  getClientCount,
  getSubscribers,
  close,
}
