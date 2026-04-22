const { encrypt, decrypt, hashPassword, generateToken } = require('../src/utils/encryption')

describe('Encryption Utils', () => {
  test('encrypt and decrypt should work correctly', () => {
    const testString = 'test-password-123'
    const encrypted = encrypt(testString)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(testString)
  })

  test('decrypt should return original text if decryption fails', () => {
    const testString = 'test-string'
    const result = decrypt(testString)
    expect(result).toBe(testString)
  })

  test('encrypt should handle empty string', () => {
    const result = encrypt('')
    expect(result).toBe('')
  })

  test('decrypt should handle empty string', () => {
    const result = decrypt('')
    expect(result).toBe('')
  })

  test('hashPassword should generate consistent hash', () => {
    const testPassword = 'test-password'
    const hash1 = hashPassword(testPassword)
    const hash2 = hashPassword(testPassword)
    expect(hash1).toBe(hash2)
  })

  test('generateToken should generate token of correct length', () => {
    const token = generateToken(16)
    expect(token).toHaveLength(32) // 16 bytes * 2 hex chars
  })
})
