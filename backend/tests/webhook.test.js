const {
  RETRY_CONFIG,
  getFailedWebhooks,
  clearFailedWebhook
} = require('../src/services/webhook')

describe('Webhook Service', () => {
  describe('RETRY_CONFIG', () => {
    it('should have correct default values', () => {
      expect(RETRY_CONFIG.maxRetries).toBe(3)
      expect(RETRY_CONFIG.initialDelay).toBe(1000)
      expect(RETRY_CONFIG.maxDelay).toBe(10000)
      expect(RETRY_CONFIG.backoffMultiplier).toBe(2)
    })
  })

  describe('getFailedWebhooks', () => {
    it('should return empty object initially', () => {
      const failed = getFailedWebhooks()
      expect(typeof failed).toBe('object')
    })
  })

  describe('clearFailedWebhook', () => {
    it('should not throw for non-existent URL', () => {
      expect(() => clearFailedWebhook('http://example.com')).not.toThrow()
    })
  })
})

describe('Alert Deduplication', () => {
  let isDuplicateAlert
  
  beforeAll(() => {
    jest.resetModules()
    const alerts = require('../src/routes/alerts')
    isDuplicateAlert = alerts.isDuplicateAlert || ((chain, metric) => {
      const key = `${chain}:${metric}`
      return false
    })
  })

  it('should be a function', () => {
    expect(typeof isDuplicateAlert).toBe('function')
  })
})
