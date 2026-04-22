const express = require('express')
const router = express.Router()
const { execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Validate and resolve onchainos path
function getOnchainosPath() {
  const envPath = process.env.ONCHAINOS_PATH
  
  if (!envPath) {
    throw new Error('ONCHAINOS_PATH environment variable is not set')
  }
  
  // Resolve to absolute path
  const resolvedPath = path.resolve(envPath)
  
  // Validate path exists
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`onchainos executable not found at: ${resolvedPath}`)
  }
  
  // Validate it's a file (not directory)
  const stats = fs.statSync(resolvedPath)
  if (!stats.isFile()) {
    throw new Error(`ONCHAINOS_PATH is not a file: ${resolvedPath}`)
  }
  
  return resolvedPath
}

// Get Solana meme coins
router.get('/', (req, res) => {
  try {
    const onchainosPath = getOnchainosPath()
    
    // Use execFileSync with array arguments to prevent command injection
    const result = execFileSync(
      onchainosPath,
      ['memepump', 'tokens', '--chain', 'solana'],
      { encoding: 'utf8', timeout: 30000 }
    )

    const tokens = JSON.parse(result.trim())
    res.json(tokens)
  } catch (error) {
    console.error('Error fetching meme coins:', error)
    res.status(500).json({
      error: 'Failed to fetch meme coins',
      details: error.message
    })
  }
})

// Health check for meme service
router.get('/health', (req, res) => {
  try {
    const onchainosPath = getOnchainosPath()
    
    // Use execFileSync with array arguments to prevent command injection
    execFileSync(
      onchainosPath,
      ['--version'],
      { encoding: 'utf8', timeout: 5000 }
    )
    res.json({ status: 'ok', message: 'onchainos CLI is available' })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'onchainos CLI not available',
      details: error.message 
    })
  }
})

module.exports = router