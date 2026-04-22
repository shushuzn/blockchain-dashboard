require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('combined'))

// Routes
const historyRoutes = require('./src/routes/history')
const configRoutes = require('./src/routes/config')
const alertRoutes = require('./src/routes/alerts')
const memeRoutes = require('./src/routes/meme')

app.use('/api/history', historyRoutes)
app.use('/api/config', configRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/meme', memeRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log(`API routes:`)
  console.log(`  GET /api/health - Health check`)
  console.log(`  GET /api/history - Get chain history data`)
  console.log(`  POST /api/history - Add history data`)
  console.log(`  GET /api/config - Get user config`)
  console.log(`  POST /api/config - Save user config`)
  console.log(`  POST /api/alerts - Trigger alert`)
  console.log(`  GET /api/meme - Get Solana meme coins`)
})

module.exports = app