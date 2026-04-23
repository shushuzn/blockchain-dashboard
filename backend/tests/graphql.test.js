const request = require('supertest')

describe('GraphQL API Tests', () => {
  let app

  beforeAll(() => {
    app = require('../server')
  })

  describe('Query: chains', () => {
    it('should fetch all chains', async () => {
      const query = `
        query {
          chains {
            id
            name
            color
            hasBlob
            hasMEV
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('chains')
      expect(Array.isArray(response.body.data.chains)).toBe(true)
      expect(response.body.data.chains.length).toBeGreaterThan(0)

      const chain = response.body.data.chains[0]
      expect(chain).toHaveProperty('id')
      expect(chain).toHaveProperty('name')
      expect(chain).toHaveProperty('color')
    })
  })

  describe('Query: chain', () => {
    it('should fetch specific chain by id', async () => {
      const query = `
        query {
          chain(id: "ethereum") {
            id
            name
            color
            hasBlob
            hasMEV
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('chain')
      expect(response.body.data.chain.id).toBe('ethereum')
      expect(response.body.data.chain.name).toBeTruthy()
    })

    it('should return null for non-existent chain', async () => {
      const query = `
        query {
          chain(id: "non-existent") {
            id
            name
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data.chain).toBeNull()
    })
  })

  describe('Query: prices', () => {
    it('should fetch prices', async () => {
      const query = `
        query {
          prices {
            eth {
              usd
              usd_24h_change
            }
            btc {
              usd
              usd_24h_change
            }
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('prices')
      expect(response.body.data.prices).toHaveProperty('eth')
      expect(response.body.data.prices).toHaveProperty('btc')
    })
  })

  describe('Query: config', () => {
    it('should fetch config', async () => {
      const query = `
        query {
          config {
            alertEnabled
            cooldownMin
            thresholds {
              ethereum {
                gas
                baseFee
              }
            }
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('config')
      expect(response.body.data.config).toHaveProperty('alertEnabled')
      expect(response.body.data.config).toHaveProperty('thresholds')
    })
  })

  describe('Query: health', () => {
    it('should fetch health status', async () => {
      const query = `
        query {
          health {
            status
            uptime
            cache
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('health')
      expect(response.body.data.health).toHaveProperty('status')
      expect(response.body.data.health.status).toBe('ok')
    })
  })

  describe('Query: memeCoins', () => {
    it('should fetch meme coins', async () => {
      const query = `
        query {
          memeCoins {
            symbol
            name
            price_usd
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('memeCoins')
      expect(Array.isArray(response.body.data.memeCoins)).toBe(true)
    })
  })

  describe('Query: alerts', () => {
    it('should fetch alerts with limit', async () => {
      const query = `
        query {
          alerts(limit: 5) {
            id
            time
            chain
            metric
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('alerts')
      expect(Array.isArray(response.body.data.alerts)).toBe(true)
    })
  })

  describe('Query: metrics', () => {
    it('should fetch metrics', async () => {
      const query = `
        query {
          metrics {
            uptime
            requests
            errors
            cache
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body.data).toHaveProperty('metrics')
      expect(response.body.data.metrics).toHaveProperty('uptime')
    })
  })

  describe('Error Handling', () => {
    it('should return error for invalid query', async () => {
      const query = `
        query {
          invalidField {
            something
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })
        .expect('Content-Type', /json/)
        .expect(400)
    })

    it('should return error for missing required argument', async () => {
      const query = `
        query {
          chain {
            id
          }
        }
      `

      const response = await request(app)
        .post('/graphql')
        .send({ query })

      expect(response.status).toBe(400)
    })
  })
})
