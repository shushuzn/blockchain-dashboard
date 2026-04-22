class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

function errorResponse(res, error) {
  const statusCode = error.statusCode || 500
  const response = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  }
  
  if (error.details) {
    response.details = error.details
  }
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack
  }
  
  console.error(`[ERROR] ${error.code}: ${error.message}`)
  
  return res.status(statusCode).json(response)
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

function logError(error, req = null) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    }
  }
  
  if (req) {
    logEntry.request = {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.get('user-agent'),
        'x-request-id': req.get('x-request-id')
      },
      ip: req.ip
    }
  }
  
  console.error('[ERROR]', JSON.stringify(logEntry, null, 2))
  return logEntry
}

function notFoundHandler(req, res) {
  errorResponse(res, new NotFoundError('Endpoint'))
}

function globalErrorHandler(err, req, res, next) {
  if (err.isOperational) {
    return errorResponse(res, err)
  }
  
  logError(err, req)
  
  return errorResponse(res, new AppError(
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    500,
    'INTERNAL_ERROR'
  ))
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  errorResponse,
  asyncHandler,
  logError,
  notFoundHandler,
  globalErrorHandler
}
