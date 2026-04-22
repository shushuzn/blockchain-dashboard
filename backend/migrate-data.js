#!/usr/bin/env node

/**
 * Data Migration Script
 * Migrates localStorage data to SQLite database
 * 
 * Usage: node migrate-data.js [--dry-run] [--verbose]
 */

const fs = require('fs')
const path = require('path')

const HISTORY_KEY = 'mcm_history_v2'
const CONFIG_KEY = 'mcm_config_v3'
const ALERT_STATE_KEY = 'mcm_alert_state_v2'

const DRY_RUN = process.argv.includes('--dry-run')
const VERBOSE = process.argv.includes('--verbose')

function log(message) {
  console.log(`[MIGRATE] ${message}`)
}

function verbose(message) {
  if (VERBOSE) console.log(`[VERBOSE] ${message}`)
}

function parseLocalStorage() {
  const dataDir = path.join(__dirname, '..', 'browser_data')
  
  log('Looking for localStorage data...')
  
  const historyFile = path.join(dataDir, 'localStorage_mcm_history_v2.json')
  const configFile = path.join(dataDir, 'localStorage_mcm_config_v3.json')
  
  let history = {}
  let config = null
  
  if (fs.existsSync(historyFile)) {
    const content = fs.readFileSync(historyFile, 'utf8')
    history = JSON.parse(content)
    log(`Found history data: ${Object.keys(history).length} chains`)
  } else {
    log('No history data file found, will start fresh')
  }
  
  if (fs.existsSync(configFile)) {
    const content = fs.readFileSync(configFile, 'utf8')
    config = JSON.parse(content)
    log('Found config data')
  } else {
    log('No config data file found, will start fresh')
  }
  
  return { history, config }
}

async function migrateToDatabase(history, config) {
  if (DRY_RUN) {
    log('DRY RUN - No actual database changes will be made')
  }
  
  try {
    const sequelize = require('./src/config/database')
    const History = require('./src/models/History')
    const Config = require('./src/models/Config')
    
    await sequelize.authenticate()
    log('Database connection established')
    
    await sequelize.sync()
    log('Database tables synchronized')
    
    let historyCount = 0
    let chainCount = 0
    
    for (const [chainId, points] of Object.entries(history)) {
      if (!points || points.length === 0) continue
      
      chainCount++
      verbose(`Processing chain: ${chainId} (${points.length} points)`)
      
      for (const point of points) {
        try {
          if (!DRY_RUN) {
            await History.create({
              chainId,
              timestamp: point.t,
              gas: point.gas,
              baseFee: point.baseFee,
              blobFee: point.blobFee,
              util: point.util
            })
          }
          historyCount++
        } catch (error) {
          console.error(`Failed to insert point for ${chainId}:`, error.message)
        }
      }
    }
    
    log(`Migrated ${historyCount} history points across ${chainCount} chains`)
    
    if (config && !DRY_RUN) {
      const existingConfig = await Config.findOne({ where: { userId: 'default' } })
      
      if (existingConfig) {
        await existingConfig.update({
          alertEnabled: config.alertEnabled || false,
          telegramToken: config.telegramToken || '',
          telegramChatId: config.telegramChatId || '',
          smtpHost: config.smtpHost || 'smtp.gmail.com',
          smtpPort: config.smtpPort || '587',
          smtpUser: config.smtpUser || '',
          smtpPass: config.smtpPass || '',
          smtpTo: config.smtpTo || '',
          cooldownMin: config.cooldownMin || 5,
          thresholds: JSON.stringify(config.thresholds || {}),
          alertLog: JSON.stringify(config.alertLog || [])
        })
        log('Updated existing config')
      } else {
        await Config.create({
          userId: 'default',
          alertEnabled: config.alertEnabled || false,
          telegramToken: config.telegramToken || '',
          telegramChatId: config.telegramChatId || '',
          smtpHost: config.smtpHost || 'smtp.gmail.com',
          smtpPort: config.smtpPort || '587',
          smtpUser: config.smtpUser || '',
          smtpPass: config.smtpPass || '',
          smtpTo: config.smtpTo || '',
          cooldownMin: config.cooldownMin || 5,
          thresholds: JSON.stringify(config.thresholds || {}),
          alertLog: JSON.stringify(config.alertLog || [])
        })
        log('Created new config')
      }
    } else if (config && DRY_RUN) {
      verbose('Would migrate config data')
    }
    
    await sequelize.close()
    log('Migration complete!')
    
    return { historyCount, chainCount }
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('='.repeat(50))
  log('Blockchain Dashboard Data Migration Tool')
  console.log('='.repeat(50))
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log()
  
  const { history, config } = parseLocalStorage()
  
  const hasData = Object.keys(history).length > 0 || config !== null
  
  if (!hasData) {
    log('No data to migrate')
    process.exit(0)
  }
  
  const answer = DRY_RUN ? 'y' : await prompt('Proceed with migration? (y/N): ')
  
  if (answer.toLowerCase() !== 'y') {
    log('Migration cancelled')
    process.exit(0)
  }
  
  await migrateToDatabase(history, config)
}

function prompt(question) {
  return new Promise((resolve) => {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

if (require.main === module) {
  main()
}

module.exports = { parseLocalStorage, migrateToDatabase }