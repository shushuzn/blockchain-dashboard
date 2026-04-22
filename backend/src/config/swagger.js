/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 *   - name: Health
 *     description: Health check
 *   - name: History
 *     description: Chain history data
 *   - name: Config
 *     description: User configuration
 *   - name: Alerts
 *     description: Alert management
 *   - name: Push
 *     description: Push notifications
 *   - name: Meme
 *     description: Meme coins data
 *   - name: Lido
 *     description: Lido TVL data
 *   - name: Aave
 *     description: Aave TVL data
 *   - name: Export
 *     description: Data export
 *   - name: Webhook
 *     description: Webhook endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin]
 *     Token:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         refreshToken:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     HistoryPoint:
 *       type: object
 *       properties:
 *         chainId:
 *           type: string
 *         timestamp:
 *           type: integer
 *         gas:
 *           type: number
 *         baseFee:
 *           type: number
 *         blobFee:
 *           type: number
 *         util:
 *           type: number
 *     Config:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         alertEnabled:
 *           type: boolean
 *         thresholds:
 *           type: object
 *         cooldownMin:
 *           type: integer
 *     Alert:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         chain:
 *           type: string
 *         metric:
 *           type: string
 *         value:
 *           type: number
 *         threshold:
 *           type: number
 *         timestamp:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blockchain Dashboard API',
      version: '1.0.0',
      description: 'API documentation for Blockchain Dashboard backend',
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './server.js'],
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec
