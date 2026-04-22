const axios = require('axios')

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send'

const offlineQueue = []
const MAX_QUEUE_SIZE = 1000

function addToOfflineQueue(message, tokens) {
  offlineQueue.push({
    message,
    tokens,
    timestamp: Date.now(),
    attempts: 0,
  })

  if (offlineQueue.length > MAX_QUEUE_SIZE) {
    offlineQueue.shift()
  }
}

async function sendPushNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    return { success: false, error: 'No tokens provided' }
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: {
      type: 'alert',
      timestamp: Date.now(),
      ...data,
    },
  }))

  try {
    const response = await axios.post(EXPO_PUSH_API, messages, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })

    const receipts = response.data.data
    const failedTokens = []

    receipts.forEach((receipt, index) => {
      if (receipt.status === 'error') {
        failedTokens.push(tokens[index])
        console.error(`Push notification failed for token ${tokens[index]}: ${receipt.message}`)
      }
    })

    return {
      success: true,
      sent: tokens.length - failedTokens.length,
      failed: failedTokens,
      receipts,
    }
  } catch (error) {
    console.error('Push notification service error:', error.message)
    addToOfflineQueue({ title, body, data }, tokens)
    return { success: false, error: error.message }
  }
}

async function processOfflineQueue() {
  if (offlineQueue.length === 0) {
    return { processed: 0 }
  }

  let processed = 0

  for (const item of offlineQueue) {
    if (item.attempts >= 3) {
      continue
    }

    try {
      await sendPushNotification(item.tokens, item.message.title, item.message.body, item.message.data)
      item.attempts++
      processed++
    } catch (err) {
      console.error('Failed to process offline queue item:', err.message)
    }
  }

  offlineQueue.splice(0, processed)

  return { processed }
}

async function getOfflineQueueStatus() {
  return {
    queueSize: offlineQueue.length,
    items: offlineQueue.map((item) => ({
      tokens: item.tokens.length,
      timestamp: item.timestamp,
      attempts: item.attempts,
    })),
  }
}

function clearOfflineQueue() {
  offlineQueue.length = 0
}

module.exports = {
  sendPushNotification,
  addToOfflineQueue,
  processOfflineQueue,
  getOfflineQueueStatus,
  clearOfflineQueue,
}
