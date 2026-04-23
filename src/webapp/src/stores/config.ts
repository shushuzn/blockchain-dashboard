import { defineStore } from 'pinia'
import { configApi } from '../api'
import { getLogger } from '../utils/logger'

const logger = getLogger('configStore')

export interface ThresholdConfig {
  gas: number
  baseFee: number
  blobFee: number
  mev: number
}

export interface ChainThresholds {
  ethereum: ThresholdConfig
  base: ThresholdConfig
  arbitrum: ThresholdConfig
  optimism: ThresholdConfig
  bsc: ThresholdConfig
  polygon: ThresholdConfig
}

export interface AlertEntry {
  time: string
  chain: string
  metric: string
  value: string
  threshold: string
}

export interface ConfigState {
  alertEnabled: boolean
  telegramToken: string
  telegramChatId: string
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  smtpTo: string
  cooldownMin: number
  thresholds: ChainThresholds
  alertLog: AlertEntry[]
  alertState: Record<string, unknown>
  configFromApi: boolean
  logLevel?: string
}

export const useConfigStore = defineStore('config', {
  state: (): ConfigState => ({
    alertEnabled: false,
    telegramToken: '',
    telegramChatId: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpTo: '',
    cooldownMin: 5,
    thresholds: {
      ethereum: { gas: 50, baseFee: 50, blobFee: 0.1, mev: 10 },
      base: { gas: 30, baseFee: 30, blobFee: 0.1, mev: 0 },
      arbitrum: { gas: 5, baseFee: 5, blobFee: 0, mev: 5 },
      optimism: { gas: 5, baseFee: 5, blobFee: 0, mev: 5 },
      bsc: { gas: 10, baseFee: 10, blobFee: 0, mev: 0 },
      polygon: { gas: 20, baseFee: 20, blobFee: 0, mev: 0 }
    },
    alertLog: [],
    alertState: {},
    configFromApi: false,
    logLevel: undefined
  }),

  actions: {
    async loadConfig() {
      try {
        const apiConfig = await configApi.getConfig()
        this.applyConfig(apiConfig as unknown as Partial<ConfigState>)
        this.configFromApi = true
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        logger.warn('Failed to load config from API, using localStorage:', { error: errorMessage })
        this.loadConfigFromLocal()
        this.configFromApi = false
      }
    },

    loadConfigFromLocal() {
      try {
        const config = localStorage.getItem('mcm_config_v3')
        if (config) {
          const parsed = JSON.parse(config)
          this.applyConfig(parsed)
        }
      } catch(e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        logger.warn('Failed to load config from localStorage:', { error: errorMessage })
      }

      try {
        const alertState = localStorage.getItem('mcm_alert_state_v2')
        if (alertState) {
          this.alertState = JSON.parse(alertState)
        }
      } catch(e: unknown) {
        this.alertState = {}
      }
    },

    applyConfig(parsed: Partial<ConfigState> | Record<string, unknown>) {
      this.alertEnabled = Boolean(parsed.alertEnabled) || false
      this.telegramToken = String(parsed.telegramToken || '')
      this.telegramChatId = String(parsed.telegramChatId || '')
      this.smtpHost = String(parsed.smtpHost || 'smtp.gmail.com')
      this.smtpPort = String(parsed.smtpPort || '587')
      this.smtpUser = String(parsed.smtpUser || '')
      this.smtpPass = String(parsed.smtpPass || '')
      this.smtpTo = String(parsed.smtpTo || '')
      this.cooldownMin = Number(parsed.cooldownMin) || 5
      
      if (parsed.thresholds) {
        const thresholds = parsed.thresholds as Partial<ChainThresholds>
        this.thresholds = { ...this.thresholds, ...thresholds }
      }
      
      if (parsed.alertLog) {
        this.alertLog = parsed.alertLog as AlertEntry[]
      }
      
      if (parsed.alertState) {
        this.alertState = parsed.alertState as Record<string, unknown>
      }
    },

    async saveConfig() {
      const configData = {
        alertEnabled: this.alertEnabled,
        telegramToken: this.telegramToken,
        telegramChatId: this.telegramChatId,
        smtpHost: this.smtpHost,
        smtpPort: this.smtpPort,
        smtpUser: this.smtpUser,
        smtpPass: this.smtpPass,
        smtpTo: this.smtpTo,
        cooldownMin: this.cooldownMin,
        thresholds: this.thresholds,
        alertLog: this.alertLog
      }

      if (this.configFromApi) {
        try {
          await configApi.saveConfig(configData)
          this.saveConfigToLocal(configData)
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.warn('Failed to save config to API, saving locally:', { error: errorMessage })
          this.saveConfigToLocal(configData)
        }
      } else {
        this.saveConfigToLocal(configData)
      }
    },

    saveConfigToLocal(configData: Partial<ConfigState>) {
      try {
        localStorage.setItem('mcm_config_v3', JSON.stringify(configData))
      } catch(e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        logger.error('Failed to save config locally:', { error: errorMessage })
      }
    },

    async saveAlertState() {
      if (this.configFromApi) {
        try {
          await configApi.saveConfig({ alertState: this.alertState })
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.warn('Failed to save alert state to API:', { error: errorMessage })
        }
      }

      try {
        localStorage.setItem('mcm_alert_state_v2', JSON.stringify(this.alertState))
      } catch(e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        logger.error('Failed to save alert state locally:', { error: errorMessage })
      }
    },

    addAlert(chain: string, metric: string, value: number, threshold: number) {
      const names: Record<string, string> = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' }
      const alert: AlertEntry = {
        time: new Date().toLocaleTimeString(),
        chain: chain,
        metric: names[metric] || metric,
        value: typeof value === 'number' ? value.toFixed(3) : String(value),
        threshold: typeof threshold === 'number' ? threshold.toFixed(3) : String(threshold)
      }

      this.alertLog.unshift(alert)
      if (this.alertLog.length > 50) {
        this.alertLog.pop()
      }

      this.saveConfig()
    },

    async clearAlertLog() {
      this.alertLog = []
      this.alertState = {}

      if (this.configFromApi) {
        try {
          await configApi.clearAlertLog()
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          logger.warn('Failed to clear alert log on API:', { error: errorMessage })
        }
      }

      this.saveConfig()
      this.saveAlertState()
    }
  }
})