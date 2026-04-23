const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')

const webhooks = new Map()
const MAX_RETRIES = 3

const webhookEvents = [
  'chain.gas.spike',
  'chain.gas.drop',
  'chain.block.fork',
  'chain.status.change',
  'alert.triggered',
  'alert.resolved',
  'defi.tvl.change',
  'defi.apy.spike',
  'system.health.degraded',
  'anomaly.detected',
]

const webhookRegistry = new Map()

function registerWebhook(webhookId, webhook) {
  webhookRegistry.set(webhookId, webhook)
}

function unregisterWebhook(webhookId) {
  webhookRegistry.delete(webhookId)
}

function dispatchWebhook(event, data) {
  webhookRegistry.forEach((webhook, id) => {
    if (webhook.events.includes(event)) {
      sendWebhook(webhook, event, data)
    }
  })
}

async function sendWebhook(webhook, event, data) {
  const payload = {
    id: uuidv4(),
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  const maxRetries = webhook.retry?.maxRetries || MAX_RETRIES
  const backoff = webhook.retry?.backoff || 'exponential'

  for (let attempt = 1; attempt <= maxRetries; i++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-ID': webhook.id,
          'X-Webhook-Event': event,
          'X-Webhook-Signature': generateSignature(payload, webhook.secret),
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        console.log(`Webhook ${webhook.id} delivered successfully`)
        logDelivery(webhook.id, event, payload.id, 'success')
        return
      }

      throw new Error(`HTTP ${response.status}`)
    } catch (err) {
      const delay = backoff === 'exponential' ? Math.pow(2, attempt - 1) * 1000 : attempt * 1000
      console.error(`Webhook delivery failed (attempt ${attempt}/${maxRetries}):`, err.message)

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        logDelivery(webhook.id, event, payload.id, 'failed')
      }
    }
  }
}

function generateSignature(payload, secret) {
  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(JSON.stringify(payload))
  return `sha256=${hmac.digest('hex')}`
}

const deliveryLogs = []

function logDelivery(webhookId, event, payloadId, status) {
  deliveryLogs.push({
    webhookId,
    event,
    payloadId,
    status,
    timestamp: new Date().toISOString(),
  })

  if (deliveryLogs.length > 1000) {
    deliveryLogs.shift()
  }
}

router.post('/', async (req, res) => {
  try {
    const { url, events, secret, retry, filters } = req.body

    if (!url || !events || events.length === 0) {
      return res.status(400).json({ error: 'url and events are required' })
    }

    const webhook = {
      id: uuidv4(),
      url,
      events,
      secret: secret || uuidv4(),
      retry: retry || { enabled: true, maxRetries: 3, backoff: 'exponential' },
      filters: filters || {},
      createdAt: new Date().toISOString(),
    }

    webhooks.set(webhook.id, webhook)
    registerWebhook(webhook.id, webhook)

    res.status(201).json({
      id: webhook.id,
      secret: webhook.secret,
      message: 'Webhook registered successfully',
    })
  } catch (error) {
    console.error('Webhook registration error:', error)
    res.status(500).json({ error: 'Failed to register webhook' })
  }
})

router.get('/', (req, res) => {
  const webhookList = Array.from(webhooks.values()).map((w) => ({
    id: w.id,
    url: w.url,
    events: w.events,
    createdAt: w.createdAt,
  }))
  res.json(webhookList)
})

router.get('/events', (req, res) => {
  res.json(webhookEvents.map((e) => ({ event: e })))
})

router.get('/logs', (req, res) => {
  const { webhookId, limit = 50 } = req.query
  let logs = [...deliveryLogs]

  if (webhookId) {
    logs = logs.filter((l) => l.webhookId === webhookId)
  }

  res.json(logs.slice(-limit))
})

router.delete('/:id', (req, res) => {
  const { id } = req.params

  if (!webhooks.has(id)) {
    return res.status(404).json({ error: 'Webhook not found' })
  }

  unregisterWebhook(id)
  webhooks.delete(id)
  res.json({ success: true, message: 'Webhook deleted' })
})

router.post('/test', async (req, res) => {
  const { url, secret } = req.body

  if (!url) {
    return res.status(400).json({ error: 'url is required' })
  }

  const payload = {
    id: uuidv4(),
    event: 'test',
    timestamp: new Date().toISOString(),
    data: { message: 'Test webhook' },
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': secret ? generateSignature(payload, secret) : undefined,
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      res.json({ success: true, message: 'Test webhook sent' })
    } else {
      res.status(response.status).json({ success: false, error: `HTTP ${response.status}` })
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = {
  router,
  webhooks,
  webhookEvents,
  dispatchWebhook,
  registerWebhook,
  unregisterWebhook,
  sendWebhook,
}
