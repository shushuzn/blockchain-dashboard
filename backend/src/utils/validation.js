const { z } = require('zod')

const emailSchema = z.string().email('Invalid email format')
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password too long')
const optionalPasswordSchema = z.string().min(6).max(100).optional().or(z.literal(''))

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
})

const configSchema = z.object({
  userId: z.string().optional(),
  alertEnabled: z.boolean().optional(),
  cooldownMin: z.number().int().min(1).max(60).optional(),
  thresholds: z.object({
    ethereum: z.object({
      gas: z.number().min(0).optional(),
      baseFee: z.number().min(0).optional(),
      blobFee: z.number().min(0).optional(),
      mev: z.number().min(0).optional(),
    }).optional(),
    base: z.object({
      gas: z.number().min(0).optional(),
      baseFee: z.number().min(0).optional(),
      blobFee: z.number().min(0).optional(),
    }).optional(),
    arbitrum: z.object({
      gas: z.number().min(0).optional(),
      baseFee: z.number().min(0).optional(),
    }).optional(),
    optimism: z.object({
      gas: z.number().min(0).optional(),
      baseFee: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
})

const alertSchema = z.object({
  chain: z.enum(['ethereum', 'base', 'arbitrum', 'optimism']),
  metric: z.enum(['gas', 'baseFee', 'blobFee', 'mev']),
  value: z.number().min(0),
  threshold: z.number().min(0),
})

const pushRegisterSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  token: z.string().min(1, 'Push token is required'),
  preferences: z.object({
    gasAlerts: z.boolean().optional(),
    blobAlerts: z.boolean().optional(),
    mevAlerts: z.boolean().optional(),
  }).optional(),
})

const pushSendSchema = z.object({
  tokens: z.array(z.string()).min(1, 'At least one token is required'),
  title: z.string().min(1, 'Title is required').max(100),
  body: z.string().min(1, 'Body is required').max(500),
  data: z.record(z.any()).optional(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

const historyQuerySchema = z.object({
  chainId: z.string().optional(),
  from: z.coerce.number().optional(),
  to: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
})

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Validation failed' })
    }
  }
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Invalid query parameters' })
    }
  }
}

function validateParams(schema) {
  return (req, res, next) => {
    try {
      req.params = schema.parse(req.params)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Invalid parameters' })
    }
  }
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  changePasswordSchema,
  configSchema,
  alertSchema,
  pushRegisterSchema,
  pushSendSchema,
  paginationSchema,
  historyQuerySchema,
  validateBody,
  validateQuery,
  validateParams,
}
