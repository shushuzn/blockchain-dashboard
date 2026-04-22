import { defineStore } from 'pinia'
import { configApi } from '../api'

export const useConfigStore = defineStore('config', {
  state: () => ({
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
    configFromApi: false
  }),

  actions: {
    async loadConfig() {
      try {
        const apiConfig = await configApi.getConfig()
        this.applyConfig(apiConfig)
        this.configFromApi = true
      } catch (error) {
        console.warn('Failed to load config from API, using localStorage:', error.message)
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
      } catch(e) {
        console.warn('Failed to load config from localStorage:', e.message)
      }

      try {
        const alertState = localStorage.getItem('mcm_alert_state_v2')
        if (alertState) {
          this.alertState = JSON.parse(alertState)
        }
      } catch(e) {
        this.alertState = {}
      }
    },

    applyConfig(parsed) {
      this.alertEnabled = parsed.alertEnabled || false
      this.telegramToken = parsed.telegramToken || ''
      this.telegramChatId = parsed.telegramChatId || ''
      this.smtpHost = parsed.smtpHost || 'smtp.gmail.com'
      this.smtpPort = parsed.smtpPort || '587'
      this.smtpUser = parsed.smtpUser || ''
      this.smtpPass = parsed.smtpPass || ''
      this.smtpTo = parsed.smtpTo || ''
      this.cooldownMin = parsed.cooldownMin || 5
      this.thresholds = { ...this.thresholds, ...(parsed.thresholds || {}) }
      this.alertLog = parsed.alertLog || []
      if (parsed.alertState) {
        this.alertState = parsed.alertState
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
        } catch (error) {
          console.warn('Failed to save config to API, saving locally:', error.message)
          this.saveConfigToLocal(configData)
        }
      } else {
        this.saveConfigToLocal(configData)
      }
    },

    saveConfigToLocal(configData) {
      try {
        localStorage.setItem('mcm_config_v3', JSON.stringify(configData))
      } catch(e) {
        console.error('Failed to save config locally:', e)
      }
    },

    async saveAlertState() {
      if (this.configFromApi) {
        try {
          await configApi.saveConfig({ alertState: this.alertState })
        } catch (error) {
          console.warn('Failed to save alert state to API:', error.message)
        }
      }

      try {
        localStorage.setItem('mcm_alert_state_v2', JSON.stringify(this.alertState))
      } catch(e) {
        console.error('Failed to save alert state locally:', e)
      }
    },

    addAlert(chain, metric, value, threshold) {
      const names = { gas: 'Priority Fee', baseFee: 'Base Fee', blobFee: 'Blob Fee' }
      const alert = {
        time: new Date().toLocaleTimeString(),
        chain: chain,
        metric: names[metric] || metric,
        value: typeof value === 'number' ? value.toFixed(3) : value,
        threshold: typeof threshold === 'number' ? threshold.toFixed(3) : threshold
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
        } catch (error) {
          console.warn('Failed to clear alert log on API:', error.message)
        }
      }

      this.saveConfig()
      this.saveAlertState()
    }
  }
})