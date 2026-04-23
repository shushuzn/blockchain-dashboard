const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  asyncHandler,
  generateRequestId
} = require('../src/utils/errors')

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with default values', () => {
      const error = new AppError('Test error')
      
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('INTERNAL_ERROR')
      expect(error.isOperational).toBe(true)
    })

    it('should create error with custom values', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE')
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('CUSTOM_CODE')
    })

    it('should capture stack trace', () => {
      const error = new AppError('Test')
      expect(error.stack).toBeDefined()
    })
  })

  describe('ValidationError', () => {
    it('should have status 400 and VALIDATION_ERROR code', () => {
      const error = new ValidationError('Invalid input', { field: 'email' })
      
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual({ field: 'email' })
    })
  })

  describe('NotFoundError', () => {
    it('should have status 404 and NOT_FOUND code', () => {
      const error = new NotFoundError('User')
      
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('User not found')
    })

    it('should use default resource name', () => {
      const error = new NotFoundError()
      expect(error.message).toBe('Resource not found')
    })
  })

  describe('UnauthorizedError', () => {
    it('should have status 401', () => {
      const error = new UnauthorizedError('Invalid token')
      
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.message).toBe('Invalid token')
    })
  })

  describe('RateLimitError', () => {
    it('should have status 429', () => {
      const error = new RateLimitError('Slow down')
      
      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    })
  })
})

describe('asyncHandler', () => {
  it('should pass successful result through', async () => {
    const handler = asyncHandler(async (req, res) => {
      res.json({ success: true })
    })

    const req = {}
    const res = { json: jest.fn() }
    const next = jest.fn()

    await handler(req, res, next)
    
    expect(res.json).toHaveBeenCalledWith({ success: true })
    expect(next).not.toHaveBeenCalled()
  })

  it('should catch errors and pass to next', async () => {
    const error = new Error('Test error')
    const handler = asyncHandler(async () => {
      throw error
    })

    const req = {}
    const res = {}
    const next = jest.fn()

    await handler(req, res, next)
    
    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('generateRequestId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateRequestId()
    const id2 = generateRequestId()
    
    expect(id1).not.toBe(id2)
  })

  it('should start with req_', () => {
    const id = generateRequestId()
    expect(id.startsWith('req_')).toBe(true)
  })

  it('should contain timestamp', () => {
    const before = Date.now()
    const id = generateRequestId()
    const after = Date.now()
    
    const match = id.match(/req_(\d+)_/)
    expect(match).toBeTruthy()
    
    const timestamp = parseInt(match[1])
    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })
})
