<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Settings</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="modal-section">
            <div class="modal-section-title">Appearance</div>
            
            <div class="theme-selector">
              <button 
                class="theme-btn" 
                :class="{ active: currentTheme === 'dark' }"
                @click="setTheme('dark')"
              >
                🌙 Dark
              </button>
              <button 
                class="theme-btn" 
                :class="{ active: currentTheme === 'light' }"
                @click="setTheme('light')"
              >
                ☀️ Light
              </button>
              <button 
                class="theme-btn" 
                :class="{ active: currentTheme === 'auto' }"
                @click="setTheme('auto')"
              >
                🔄 Auto
              </button>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Data Refresh</div>
            
            <div class="form-row">
              <label class="form-label">Auto Refresh Interval (seconds)</label>
              <input 
                v-model.number="refreshInterval" 
                type="number" 
                class="form-input" 
                min="5" 
                max="300"
              >
              <div class="form-hint">
                How often to refresh chain data (5-300 seconds)
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">History Sample Interval (minutes)</label>
              <input 
                v-model.number="sampleInterval" 
                type="number" 
                class="form-input" 
                min="1" 
                max="60"
              >
              <div class="form-hint">
                How often to record data points for charts (1-60 minutes)
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Storage</div>
            
            <div class="storage-info">
              <div class="storage-row">
                <span class="storage-label">History Data</span>
                <span class="storage-value">{{ storageInfo.historyPoints }} points</span>
              </div>
              <div class="storage-row">
                <span class="storage-label">Alert Log</span>
                <span class="storage-value">{{ storageInfo.alertCount }} entries</span>
              </div>
              <div class="storage-meter">
                <div class="storage-fill" :style="{ width: storageInfo.usagePercent + '%' }"></div>
              </div>
              <div class="storage-row">
                <span class="storage-label">Storage Used</span>
                <span class="storage-value">{{ storageInfo.usage }} / 5 MB</span>
              </div>
            </div>

            <div class="form-row">
              <button class="btn btn-danger" @click="clearAllData">
                Clear All Data
              </button>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Data Management</div>
            
            <div class="form-row">
              <button class="btn btn-secondary" @click="exportData">
                📥 Export Data
              </button>
              <span class="form-hint">Download history and config as JSON</span>
            </div>

            <div class="form-row">
              <button class="btn btn-secondary" @click="importData">
                📤 Import Data
              </button>
              <span class="form-hint">Restore from previously exported JSON</span>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">About</div>
            <div class="about-info">
              <p><strong>Blockchain Dashboard</strong></p>
              <p>Version: 1.0.0</p>
              <p class="about-links">
                <a href="https://github.com/shushuzn/blockchain-dashboard" target="_blank">GitHub</a>
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn" @click="closeModal">Cancel</button>
          <button class="btn btn-primary" @click="saveSettings">Save</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useChainStore } from '../stores/chain'
import { useConfigStore } from '../stores/config'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const chainStore = useChainStore()
const configStore = useConfigStore()

const refreshInterval = ref(15)
const sampleInterval = ref(15)
const currentTheme = ref('dark')

const setTheme = (theme) => {
  currentTheme.value = theme
  localStorage.setItem('app_theme', theme)
  const effectiveTheme = theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  document.documentElement.setAttribute('data-theme', effectiveTheme)
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadSettings()
    calculateStorage()
    currentTheme.value = localStorage.getItem('app_theme') || 'dark'
  }
})

const loadSettings = () => {
  refreshInterval.value = Math.round(chainStore.refreshInterval / 1000)
  sampleInterval.value = chainStore.sampleInterval
}

const storageInfo = ref({
  historyPoints: 0,
  alertCount: 0,
  usage: '0 MB',
  usagePercent: 0
})

const calculateStorage = () => {
  let historyCount = 0
  for (const chainId in chainStore.history) {
    historyCount += chainStore.history[chainId]?.length || 0
  }
  
  const alertCount = configStore.alertLog.length
  
  let totalSize = 0
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('mcm_')) {
      try {
        totalSize += localStorage.getItem(key).length * 2
      } catch (e) {}
    }
  }
  
  const usageMB = (totalSize / 1024 / 1024).toFixed(2)
  
  storageInfo.value = {
    historyPoints: historyCount,
    alertCount: alertCount,
    usage: usageMB + ' MB',
    usagePercent: Math.min(100, (totalSize / (5 * 1024 * 1024) * 100))
  }
}

const closeModal = () => {
  emit('close')
}

const saveSettings = () => {
  chainStore.refreshInterval = refreshInterval.value * 1000
  chainStore.sampleInterval = sampleInterval.value
  
  localStorage.setItem('mcm_settings', JSON.stringify({
    refreshInterval: chainStore.refreshInterval,
    sampleInterval: chainStore.sampleInterval
  }))
  
  closeModal()
}

const clearAllData = async () => {
  if (!confirm('This will delete all history data and alert log. Are you sure?')) {
    return
  }
  
  localStorage.removeItem('mcm_history_v2')
  localStorage.removeItem('mcm_alert_state_v2')
  
  chainStore.history = {}
  await configStore.clearAlertLog()
  
  calculateStorage()
}

const exportData = () => {
  const data = {
    history: {},
    config: {
      alertEnabled: configStore.alertEnabled,
      telegramToken: configStore.telegramToken,
      telegramChatId: configStore.telegramChatId,
      smtpHost: configStore.smtpHost,
      smtpPort: configStore.smtpPort,
      smtpUser: configStore.smtpUser,
      smtpTo: configStore.smtpTo,
      cooldownMin: configStore.cooldownMin,
      thresholds: configStore.thresholds
    },
    alertLog: configStore.alertLog,
    settings: {
      refreshInterval: chainStore.refreshInterval,
      sampleInterval: chainStore.sampleInterval
    },
    exportedAt: new Date().toISOString()
  }
  
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('mcm_history')) {
      try {
        data.history[key] = localStorage.getItem(key)
      } catch (e) {}
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `blockchain-dashboard-export-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const importData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.history) {
        for (const [key, value] of Object.entries(data.history)) {
          if (typeof value === 'string') {
            localStorage.setItem(key, value)
          }
        }
      }
      
      if (data.config) {
        configStore.alertEnabled = data.config.alertEnabled || false
        configStore.telegramToken = data.config.telegramToken || ''
        configStore.telegramChatId = data.config.telegramChatId || ''
        configStore.smtpHost = data.config.smtpHost || 'smtp.gmail.com'
        configStore.smtpPort = data.config.smtpPort || '587'
        configStore.smtpUser = data.config.smtpUser || ''
        configStore.smtpTo = data.config.smtpTo || ''
        configStore.cooldownMin = data.config.cooldownMin || 5
        configStore.thresholds = data.config.thresholds || configStore.thresholds
        await configStore.saveConfig()
      }
      
      if (data.alertLog) {
        configStore.alertLog = data.alertLog
        await configStore.saveConfig()
      }
      
      if (data.settings) {
        chainStore.refreshInterval = data.settings.refreshInterval || 15000
        chainStore.sampleInterval = data.settings.sampleInterval || 15
        loadSettings()
      }
      
      alert('Data imported successfully!')
      calculateStorage()
    } catch (error) {
      alert('Failed to import data: ' + error.message)
    }
  }
  
  input.click()
}

onMounted(() => {
  calculateStorage()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 14px 18px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: #111827;
  z-index: 1;
}

.modal-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e2e8f0;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
}

.modal-close:hover {
  color: #e2e8f0;
}

.modal-body {
  padding: 18px;
}

.modal-section {
  margin-bottom: 20px;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-title {
  font-size: 0.68rem;
  color: #818cf8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #1f2937;
}

.form-row {
  margin-bottom: 12px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 0.72rem;
  color: #9ca3af;
  margin-bottom: 4px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.82rem;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
}

.form-hint {
  font-size: 0.62rem;
  color: #4b5563;
  margin-top: 3px;
}

.storage-info {
  background: #0d1117;
  border: 1px solid #161b22;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.storage-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.storage-row:last-of-type {
  margin-bottom: 0;
}

.storage-label {
  font-size: 0.72rem;
  color: #6b7280;
}

.storage-value {
  font-size: 0.72rem;
  color: #9ca3af;
}

.storage-meter {
  height: 4px;
  background: #1f2937;
  border-radius: 2px;
  margin: 10px 0;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 2px;
  transition: width 0.3s;
}

.about-info {
  font-size: 0.78rem;
  color: #9ca3af;
  line-height: 1.6;
}

.about-info strong {
  color: #e2e8f0;
}

.about-links a {
  color: #818cf8;
  text-decoration: none;
}

.about-links a:hover {
  text-decoration: underline;
}

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  position: sticky;
  bottom: 0;
  background: #111827;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #1f2937;
  background: #111827;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.15s;
}

.btn:hover {
  border-color: #374151;
  color: #e2e8f0;
}

.btn-primary {
  background: #3730a3;
  border-color: #4f46e5;
  color: #e0e7ff;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-secondary {
  background: #0d1117;
}

.btn-danger {
  background: #7f1d1d;
  border-color: #b91c1c;
  color: #fca5a5;
}

.btn-danger:hover {
  background: #991b1b;
}

.theme-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.theme-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #1f2937;
  background: #0d1117;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.78rem;
  transition: all 0.15s;
}

.theme-btn:hover {
  border-color: #374151;
  color: #e2e8f0;
}

.theme-btn.active {
  background: #3730a3;
  border-color: #6366f1;
  color: #e0e7ff;
}
</style>