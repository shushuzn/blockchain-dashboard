const axios = require('axios')

async function sendWebhook(webhookUrl, payload, headers = {}) {
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured')
  }
  
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    })
    
    return {
      success: true,
      status: response.status,
      data: response.data
    }
  } catch (error) {
    const errorInfo = {
      success: false,
      status: error.response?.status || 0,
      message: error.message
    }
    
    console.error('[Webhook] Send failed:', errorInfo)
    
    return errorInfo
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
  buildAlertPayload
}
