function validateChainId(chainId) {
  const validChains = ['ethereum', 'base', 'arbitrum', 'optimism', 'solana', 'bsc', 'polygon']
  return typeof chainId === 'string' && validChains.includes(chainId.toLowerCase())
}

function validateUserId(userId) {
  return typeof userId === 'string' && userId.length > 0 && userId.length <= 100
}

function validateDays(days) {
  const num = parseInt(days, 10)
  return !isNaN(num) && num >= 1 && num <= 365
}

function validateTimestamp(timestamp) {
  const num = parseInt(timestamp, 10)
  return !isNaN(num) && num > 0 && num <= Date.now() + 86400000
}

function validateNumericValue(value, min = -Infinity, max = Infinity) {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/[<>\"\'`;]/g, '').trim()
}

function validateAlertPayload(payload) {
  const errors = []
  
  if (!payload.chain || !validateChainId(payload.chain)) {
    errors.push('Invalid chain ID')
  }
  
  if (!payload.metric || typeof payload.metric !== 'string') {
    errors.push('Invalid metric')
  }
  
  if (!validateNumericValue(payload.value)) {
    errors.push('Invalid value')
  }
  
  if (!validateNumericValue(payload.threshold)) {
    errors.push('Invalid threshold')
  }
  
  return { valid: errors.length === 0, errors }
}

module.exports = {
  validateChainId,
  validateUserId,
  validateDays,
  validateTimestamp,
  validateNumericValue,
  sanitizeString,
  validateAlertPayload
}
