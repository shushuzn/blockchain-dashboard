const request = require('supertest')
const app = require('../server')

describe('API Health Check', () => {
  test('GET /api/health should return 200 OK', async () => {
    const response = await request(app).get('/api/health')
    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('timestamp')
  })

  test('GET /api/health should return valid timestamp', async () => {
    const response = await request(app).get('/api/health')
    const timestamp = new Date(response.body.timestamp)
    expect(timestamp instanceof Date).toBe(true)
    expect(!isNaN(timestamp)).toBe(true)
  })
})

// Cleanup
afterAll(() => {
  // No cleanup needed for Express app in test environment
})
