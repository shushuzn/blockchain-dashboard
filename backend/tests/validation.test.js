const {
  registerSchema,
  loginSchema,
  configSchema,
  alertSchema,
  paginationSchema,
  validateBody,
  validateQuery
} = require('../src/utils/validation')

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should require password', () => {
      const invalidData = {
        email: 'test@example.com'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('configSchema', () => {
    it('should validate valid config', () => {
      const validData = {
        userId: 'test-user',
        alertEnabled: true,
        cooldownMin: 10,
        thresholds: {
          ethereum: { gas: 100 }
        }
      }
      
      const result = configSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept empty config', () => {
      const result = configSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate cooldown range', () => {
      const invalidData = {
        cooldownMin: 100
      }
      
      const result = configSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('alertSchema', () => {
    it('should validate valid alert', () => {
      const validData = {
        chain: 'ethereum',
        metric: 'gas',
        value: 50,
        threshold: 100
      }
      
      const result = alertSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid chain', () => {
      const invalidData = {
        chain: 'invalid-chain',
        metric: 'gas',
        value: 50,
        threshold: 100
      }
      
      const result = alertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject invalid metric', () => {
      const invalidData = {
        chain: 'ethereum',
        metric: 'invalid',
        value: 50,
        threshold: 100
      }
      
      const result = alertSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('paginationSchema', () => {
    it('should provide default values', () => {
      const result = paginationSchema.parse({})
      
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('should coerce string values', () => {
      const result = paginationSchema.parse({
        page: '2',
        limit: '50'
      })
      
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('should enforce maximum limit', () => {
      const result = paginationSchema.parse({
        limit: 500
      })
      
      expect(result.success).toBe(false)
    })
  })
})

describe('Validation Middleware', () => {
  describe('validateBody', () => {
    it('should create middleware function', () => {
      const middleware = validateBody(registerSchema)
      expect(typeof middleware).toBe('function')
    })
  })

  describe('validateQuery', () => {
    it('should create middleware function', () => {
      const middleware = validateQuery(paginationSchema)
      expect(typeof middleware).toBe('function')
    })
  })
})
