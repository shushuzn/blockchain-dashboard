const axios = require('axios')

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}

const failedWebhooks = new Map()

function shouldRetry(status) {
  return !status || status >= 500 || status === 429 || status === 408
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWebhook(webhookUrl, payload, headers = {}, options = {}) {
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured')
  }
  
  const { maxRetries = RETRY_CONFIG.maxRetries } = options
  let lastError = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BlockchainDashboard/1.0',
          ...headers
        },
        timeout: 10000
      })
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        attempts: attempt + 1
      }
    } catch (error) {
      lastError = error
      const status = error.response?.status
      
      if (attempt < maxRetries && shouldRetry(status)) {
        const delay = Math.min(
          RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
          RETRY_CONFIG.maxDelay
        )
        console.warn(`[Webhook] Retry ${attempt + 1}/${maxRetries} after ${delay}ms (status: ${status})`)
        await sleep(delay)
        continue
      }
      
      const errorInfo = {
        success: false,
        status: status || 0,
        message: error.message,
        attempts: attempt + 1
      }
      
      failedWebhooks.set(webhookUrl, {
        lastAttempt: Date.now(),
        lastError: error.message,
        failureCount: (failedWebhooks.get(webhookUrl)?.failureCount || 0) + 1
      })
      
      console.error('[Webhook] Send failed after retries:', errorInfo)
      
      return errorInfo
    }
  }
  
  return {
    success: false,
    status: 0,
    message: lastError?.message || 'Max retries exceeded',
    attempts: maxRetries + 1
  }
}

function buildAlertPayload(alert) {
  return {
    text: `🔔 *Blockchain Alert*`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${alert.chain}* - ${alert.metric}\nValue: *${alert.value}* > Threshold: ${alert.threshold}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `⏰ ${new Date().toISOString()}`
          }
        ]
      }
    ],
    attachments: [
      {
        color: alert.value > alert.threshold ? '#ef4444' : '#f59e0b',
        fields: [
          { title: 'Chain', value: alert.chain, short: true },
          { title: 'Metric', value: alert.metric, short: true },
          { title: 'Value', value: String(alert.value), short: true },
          { title: 'Threshold', value: String(alert.threshold), short: true }
        ]
      }
    ]
  }
}

async function sendAlertWebhook(webhookConfig, alert) {
  if (!webhookConfig || !webhookConfig.url) {
    return { success: false, message: 'Webhook not configured' }
  }
  
  const payload = buildAlertPayload(alert)
  
  return sendWebhook(webhookConfig.url, payload, webhookConfig.headers)
}

module.exports = {
  sendWebhook,
  sendAlertWebhook,
  buildAlertPayload,
  RETRY_CONFIG,
  getFailedWebhooks: () => Object.fromEntries(failedWebhooks),
  clearFailedWebhook: (url) => failedWebhooks.delete(url)
}
