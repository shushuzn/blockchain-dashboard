import { useConfigStore } from '../stores/config'

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4
}

let currentLevel = LOG_LEVELS.INFO
let isProduction = import.meta.env.PROD

function getLogLevel() {
  const configStore = useConfigStore()
  const level = configStore.logLevel || import.meta.env.VITE_LOG_LEVEL || 'info'
  return LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString()
  const levelStr = level.padEnd(5)
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
  return `[${timestamp}] ${levelStr} ${message}${metaStr}`
}

export function getLogger(name) {
  return {
    debug(message, meta = {}) {
      if (getLogLevel() <= LOG_LEVELS.DEBUG && !isProduction) {
        console.log(formatMessage('DEBUG', message, { ...meta, component: name }))
      }
    },

    info(message, meta = {}) {
      if (getLogLevel() <= LOG_LEVELS.INFO) {
        console.log(formatMessage('INFO', message, { ...meta, component: name }))
      }
    },

    warn(message, meta = {}) {
      if (getLogLevel() <= LOG_LEVELS.WARN) {
        console.warn(formatMessage('WARN', message, { ...meta, component: name }))
      }
    },

    error(message, meta = {}) {
      if (getLogLevel() <= LOG_LEVELS.ERROR) {
        console.error(formatMessage('ERROR', message, { ...meta, component: name }))
      }
    },

    setLevel(level) {
      currentLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO
    },

    getLevel() {
      return Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === getLogLevel())
    }
  }
}

export default getLogger