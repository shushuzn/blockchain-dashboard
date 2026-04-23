#!/usr/bin/env node

const { Command } = require('commander')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const CONFIG_FILE = '.bcdrc'
const API_BASE_URL = process.env.BCD_API_URL || 'http://localhost:8000/api'

const program = new Command()

program
  .name('bcd')
  .description('Blockchain Dashboard CLI')
  .version('1.0.0')

program
  .command('init')
  .description('Initialize configuration')
  .option('-k, --api-key <key>', 'API key')
  .option('-u, --url <url>', 'API URL', API_BASE_URL)
  .action(async (options) => {
    const config = {
      apiKey: options.apiKey || '',
      url: options.url || API_BASE_URL,
      createdAt: new Date().toISOString(),
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    console.log('Configuration saved to', CONFIG_FILE)
  })

program
  .command('monitor')
  .description('Monitor chain data')
  .argument('<chain>', 'Chain to monitor (ethereum, base, arbitrum, optimism)')
  .option('-w, --watch', 'Watch mode')
  .option('-j, --json', 'Output as JSON')
  .action(async (chain, options) => {
    try {
      const config = loadConfig()
      const response = await axios.get(`${config.url}/history`, {
        params: { chainId: chain },
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      })

      const data = response.data

      if (options.json) {
        console.log(JSON.stringify(data, null, 2))
      } else {
        console.log(`\n📊 ${chain.toUpperCase()} Dashboard`)
        console.log('='.repeat(40))
        if (data.gas !== undefined) {
          console.log(`Gas: ${data.gas?.toFixed(2)} gwei`)
        }
        if (data.baseFee !== undefined) {
          console.log(`Base Fee: ${data.baseFee?.toFixed(2)} gwei`)
        }
        if (data.blobFee !== undefined) {
          console.log(`Blob Fee: ${data.blobFee?.toFixed(4)} ETH`)
        }
        if (data.util !== undefined) {
          console.log(`Utilization: ${data.util?.toFixed(1)}%`)
        }
      }

      if (options.watch) {
        console.log('\nWatching for updates... (Ctrl+C to exit)')
        setInterval(async () => {
          try {
            const res = await axios.get(`${config.url}/history`, {
              params: { chainId: chain },
            })
            console.clear()
            console.log(`📊 ${chain.toUpperCase()} - ${new Date().toLocaleTimeString()}`)
            console.log('='.repeat(40))
            console.log(`Gas: ${res.data.gas?.toFixed(2)} gwei`)
            console.log(`Base Fee: ${res.data.baseFee?.toFixed(2)} gwei`)
          } catch (err) {
            console.error('Error:', err.message)
          }
        }, 10000)
      }
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('alert')
  .description('Manage alerts')
  .argument('<action>', 'Action: create, list, delete')
  .option('-c, --chain <chain>', 'Chain')
  .option('-m, --metric <metric>', 'Metric (gas, baseFee, blobFee)')
  .option('-t, --threshold <value>', 'Threshold value', parseFloat)
  .option('-n, --notification <type>', 'Notification type (telegram, email)')
  .action(async (action, options) => {
    const config = loadConfig()
    const headers = config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}

    try {
      switch (action) {
        case 'list': {
          const response = await axios.get(`${config.url}/alerts`, { headers })
          console.log('\n📋 Alerts')
          console.log('='.repeat(50))
          if (Array.isArray(response.data)) {
            response.data.forEach((alert, i) => {
              console.log(`${i + 1}. ${alert.chain} - ${alert.metric}: ${alert.threshold}`)
            })
          } else {
            console.log('No alerts configured')
          }
          break
        }

        case 'create': {
          if (!options.chain || !options.metric || !options.threshold) {
            console.error('Error: --chain, --metric, and --threshold are required')
            process.exit(1)
          }
          const response = await axios.post(
            `${config.url}/config`,
            {
              thresholds: {
                [options.chain]: {
                  [options.metric]: options.threshold,
                },
              },
            },
            { headers }
          )
          console.log('✅ Alert created successfully')
          break
        }

        case 'delete': {
          console.log('Use dashboard UI to delete alerts')
          break
        }

        default:
          console.error('Unknown action:', action)
          process.exit(1)
      }
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Check service status')
  .action(async () => {
    const config = loadConfig()
    try {
      const response = await axios.get(`${config.url}/health`)
      console.log('\n🔍 Service Status')
      console.log('='.repeat(40))
      console.log(`Status: ${response.data.status}`)
      console.log(`Cache: ${response.data.cache || 'disconnected'}`)
      console.log(`Version: ${response.data.version || 'unknown'}`)
      console.log(`Timestamp: ${response.data.timestamp}`)
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('export')
  .description('Export data')
  .argument('<format>', 'Format: json, csv')
  .option('-c, --chain <chain>', 'Chain to export')
  .option('-o, --output <file>', 'Output file')
  .action(async (format, options) => {
    const config = loadConfig()
    const headers = config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}

    try {
      const params = {}
      if (options.chain) params.chainId = options.chain

      const response = await axios.get(`${config.url}/history`, { params, headers })
      const data = response.data

      let output
      if (format === 'json') {
        output = JSON.stringify(data, null, 2)
      } else if (format === 'csv') {
        if (Array.isArray(data)) {
          const headers = Object.keys(data[0] || {})
          const csv = [
            headers.join(','),
            ...data.map((row) => headers.map((h) => row[h]).join(',')),
          ].join('\n')
          output = csv
        }
      }

      if (options.output) {
        fs.writeFileSync(options.output, output)
        console.log(`Data exported to ${options.output}`)
      } else {
        console.log(output)
      }
    } catch (err) {
      console.error('Error:', err.message)
      process.exit(1)
    }
  })

program
  .command('config')
  .description('View or update configuration')
  .option('-s, --set <key=value>', 'Set configuration')
  .action(async (options) => {
    if (options.set) {
      const [key, value] = options.set.split('=')
      const config = loadConfig()
      config[key] = value
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
      console.log(`✅ ${key} = ${value}`)
    } else {
      const config = loadConfig()
      console.log('\n⚙️  Configuration')
      console.log('='.repeat(40))
      Object.entries(config).forEach(([key, value]) => {
        console.log(`${key}: ${value}`)
      })
    }
  })

function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('Config not found. Run: bcd init')
    return { url: API_BASE_URL, apiKey: '' }
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
}

program.parse()
