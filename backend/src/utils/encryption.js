const crypto = require('crypto')

const IV_LENGTH = 16 // For AES-256-CBC
const MIN_KEY_LENGTH = 32 // Minimum 32 characters for security

/**
 * Validate and get encryption key from environment
 * @returns {string} Validated encryption key
 * @throws {Error} If key is not set or too weak
 */
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
  
  // Check for weak/common keys
  const weakPatterns = [
    /^[a-z]+$/,           // Only lowercase
    /^[A-Z]+$/,           // Only uppercase
    /^[0-9]+$/,           // Only numbers
    /^[a-z0-9]+$/i,       // Only alphanumeric
    /password/i,
    /secret/i,
    /key/i,
    /admin/i,
    /123456/,
    /qwerty/,
    /blockchain-dashboard/
  ]
  
  for (const pattern of weakPatterns) {
    if (pattern.test(key)) {
      throw new Error(
        'ENCRYPTION_KEY appears to be weak or use common patterns. ' +
        'Please use a strong key with mixed characters.'
      )
    }
  }
  
  // Check entropy (should have a mix of character types)
  const hasLower = /[a-z]/.test(key)
  const hasUpper = /[A-Z]/.test(key)
  const hasNumber = /[0-9]/.test(key)
  const hasSpecial = /[^a-zA-Z0-9]/.test(key)
  
  const charTypes = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length
  if (charTypes < 3) {
    throw new Error(
      'ENCRYPTION_KEY should contain at least 3 of the following: ' +
      'lowercase letters, uppercase letters, numbers, special characters'
    )
  }
  
  return key
}

// Validate encryption key on module load
let ENCRYPTION_KEY
try {
  ENCRYPTION_KEY = getEncryptionKey()
  console.log('✅ Encryption key validated successfully')
} catch (error) {
  console.error('❌', error.message)
  // Throw error instead of exiting to let upper layer handle it gracefully
  throw new Error('Encryption module initialization failed: ' + error.message)
}

/**
 * Encrypt sensitive data
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text
 */
function encrypt(text) {
  if (!text) return text
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    return iv.toString('base64') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 * @param {string} text - Text to decrypt
 * @returns {string} Decrypted text
 */
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
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash password (for future use)
 * @param {string} password - Password to hash
 * @returns {string} Hashed password
 */
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
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