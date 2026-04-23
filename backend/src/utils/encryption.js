const crypto = require('crypto')
const { logger } = require('./logger')

const IV_LENGTH = 16
const MIN_KEY_LENGTH = 32

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is not set. ' +
      'Please set a strong encryption key (at least 32 characters). ' +
      'Example: ENCRYPTION_KEY=your-very-strong-32-char-encryption-key'
    )
  }

  if (key.length < MIN_KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY is too short (${key.length} chars). ` +
      `Minimum required length is ${MIN_KEY_LENGTH} characters. ` +
      `Current key: ${key.substring(0, 3)}...${key.substring(key.length - 3)}`
    )
  }

  return key
}

let ENCRYPTION_KEY
try {
  ENCRYPTION_KEY = getEncryptionKey()
  logger.info('Encryption key validated successfully')
} catch (error) {
  logger.error('Encryption module initialization failed', { error: error.message })
  throw new Error('Encryption module initialization failed: ' + error.message)
}

function encrypt(text) {
  if (!text) return text

  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return iv.toString('base64') + ':' + encrypted
  } catch (error) {
    logger.error('Encryption error', { error: error.message })
    throw new Error('Failed to encrypt data')
  }
}

function decrypt(text) {
  if (!text) return text

  try {
    const textParts = text.split(':')
    if (textParts.length !== 2) return text

    const iv = Buffer.from(textParts.shift(), 'base64')
    const encryptedText = Buffer.from(textParts.join(':'), 'base64')
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    logger.error('Decryption error', { error: error.message })
    throw new Error('Failed to decrypt data')
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  generateToken,
  getEncryptionKey
}