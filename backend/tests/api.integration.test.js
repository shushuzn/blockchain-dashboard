const request = require('supertest')

describe('API Integration Tests', () => {
  let app
  let authToken

  beforeAll(() => {
    app = require('../server')
  })

  describe('Health Endpoint', () => {
    it('GET /api/health should return 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
    })
  })

  describe('Metrics Endpoint', () => {
    it('GET /api/metrics should return metrics data', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('uptime')
    })
  })

  describe('Config Endpoint', () => {
    it('GET /api/config should return default config', async () => {
      const response = await request(app)
        .get('/api/config?userId=test')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('alertEnabled')
      expect(response.body).toHaveProperty('thresholds')
    })

    it('POST /api/config should save config', async () => {
      const configData = {
        userId: 'test-user',
        alertEnabled: true,
        cooldownMin: 10,
        thresholds: {
          ethereum: { gas: 100 }
        }
      }

      const response = await request(app)
        .post('/api/config')
        .send(configData)
        .expect('Content-Type', /json/)

      expect([200, 201]).toContain(response.status)
    })
  })

  describe('History Endpoint', () => {
    it('GET /api/history should return history data', async () => {
      const response = await request(app)
        .get('/api/history')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('GET /api/history?chainId=ethereum should filter by chain', async () => {
      const response = await request(app)
        .get('/api/history?chainId=ethereum')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('Auth Endpoints', () => {
    const testEmail = `test_${Date.now()}@example.com`
    const testPassword = 'testpass123'

    it('POST /api/auth/register should create user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect('Content-Type', /json/)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(testEmail)
      authToken = response.body.token
    })

    it('POST /api/auth/register should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: testEmail, password: testPassword })
        .expect(409)
    })

    it('POST /api/auth/login should authenticate user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(testEmail)
    })

    it('POST /api/auth/login should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' })
        .expect(401)
    })

    it('GET /api/auth/me should require auth', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401)
    })

    if (authToken) {
      it('GET /api/auth/me should return user profile', async () => {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(200)

        expect(response.body).toHaveProperty('user')
        expect(response.body.user.email).toBe(testEmail)
      })
    }
  })

  describe('Alert Endpoints', () => {
    it('GET /api/alerts should return alerts', async () => {
      const response = await request(app)
        .get('/api/alerts')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(Array.isArray(response.body) || response.body).toBeTruthy()
    })
  })

  describe('Push Endpoints', () => {
    it('GET /api/push/tokens should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/push/tokens')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })

    it('GET /api/push/queue-status should return queue status', async () => {
      const response = await request(app)
        .get('/api/push/queue-status')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toHaveProperty('queueSize')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits on auth endpoints', async () => {
      const email = `ratelimit_${Date.now()}@example.com`

      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'test' })
      }

      await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'test' })
        .expect(429)
    }, 15000)
  })

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health')

      expect(response.headers).toHaveProperty('x-content-type-options')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/api/unknown-route')
        .expect(404)
    })

    it('should return 400 for invalid JSON', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400)
    })
  })
})
