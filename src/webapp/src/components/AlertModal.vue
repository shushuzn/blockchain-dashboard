<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Alert Settings</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <div class="form-row">
            <div class="toggle-row">
              <label class="form-label">Enable Alerts</label>
              <div class="toggle-switch" @click="toggleAlertEnabled">
                <div 
                  class="toggle-track" 
                  :style="{ background: alertEnabled ? '#3f0f0f' : '#1f2937' }"
                >
                  <div 
                    class="toggle-thumb" 
                    :style="{ 
                      left: alertEnabled ? '16px' : '2px',
                      background: alertEnabled ? '#ef4444' : '#6b7280'
                    }"
                  ></div>
                </div>
                <span class="toggle-label">{{ alertEnabled ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Telegram Configuration</div>
            
            <div class="form-row">
              <label class="form-label">Bot Token</label>
              <input 
                v-model="telegramToken" 
                type="text" 
                class="form-input" 
                placeholder="123456:ABC-DEF..."
              >
            </div>

            <div class="form-row">
              <label class="form-label">Chat ID</label>
              <input 
                v-model="telegramChatId" 
                type="text" 
                class="form-input" 
                placeholder="-1001234567890"
              >
            </div>

            <div class="form-row">
              <button class="btn btn-secondary" @click="testTelegram">
                Test Telegram
              </button>
              <span v-if="telegramStatus" class="status-text" :style="{ color: telegramStatusColor }">
                {{ telegramStatus }}
              </span>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Email Configuration</div>
            
            <div class="form-row">
              <label class="form-label">SMTP Host</label>
              <input 
                v-model="smtpHost" 
                type="text" 
                class="form-input" 
                placeholder="smtp.gmail.com"
              >
            </div>

            <div class="form-row form-row-inline">
              <div>
                <label class="form-label">Port</label>
                <input 
                  v-model="smtpPort" 
                  type="text" 
                  class="form-input" 
                  placeholder="587"
                >
              </div>
              <div>
                <label class="form-label">To Email</label>
                <input 
                  v-model="smtpTo" 
                  type="email" 
                  class="form-input" 
                  placeholder="your@email.com"
                >
              </div>
            </div>

            <div class="form-row">
              <label class="form-label">SMTP Username</label>
              <input 
                v-model="smtpUser" 
                type="text" 
                class="form-input" 
                placeholder="your@email.com"
              >
            </div>

            <div class="form-row">
              <label class="form-label">SMTP Password</label>
              <input 
                v-model="smtpPass" 
                type="password" 
                class="form-input" 
                placeholder="App Password"
              >
              <div class="form-hint">
                For Gmail, use an <a href="https://support.google.com/accounts/answer/185833" target="_blank">App Password</a>
              </div>
            </div>

            <div class="form-row">
              <button class="btn btn-secondary" @click="testEmail">
                Test Email
              </button>
              <span v-if="emailStatus" class="status-text" :style="{ color: emailStatusColor }">
                {{ emailStatus }}
              </span>
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-title">Alert Thresholds</div>
            <div class="form-row">
              <label class="form-label">Cooldown (minutes)</label>
              <input 
                v-model.number="cooldownMin" 
                type="number" 
                class="form-input" 
                min="1" 
                max="60"
              >
              <div class="form-hint">
                Minimum time between alerts for the same metric
              </div>
            </div>

            <div class="threshold-chains">
              <div v-for="chain in chains" :key="chain.id" class="threshold-chain">
                <div class="threshold-chain-name">
                  <span class="chain-dot" :style="{ background: chain.color }"></span>
                  {{ chain.name }}
                </div>
                <div class="threshold-row">
                  <label>Priority Fee &gt;</label>
                  <input 
                    v-model.number="thresholds[chain.id].gas" 
                    type="number" 
                    step="0.1" 
                    min="0"
                  >
                  <span class="unit">gwei</span>
                </div>
                <div class="threshold-row">
                  <label>Base Fee &gt;</label>
                  <input 
                    v-model.number="thresholds[chain.id].baseFee" 
                    type="number" 
                    step="0.1" 
                    min="0"
                  >
                  <span class="unit">gwei</span>
                </div>
                <div v-if="chain.hasBlob" class="threshold-row">
                  <label>Blob Fee &gt;</label>
                  <input 
                    v-model.number="thresholds[chain.id].blobFee" 
                    type="number" 
                    step="0.001" 
                    min="0"
                  >
                  <span class="unit">gwei</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-danger" @click="clearAlertLog">
            Clear Alert Log
          </button>
          <div class="footer-actions">
            <button class="btn" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="saveSettings">Save</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useConfigStore } from '../stores/config'
import { useChainStore } from '../stores/chain'
import { alertsApi } from '../api'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const configStore = useConfigStore()
const chainStore = useChainStore()

const alertEnabled = ref(false)
const telegramToken = ref('')
const telegramChatId = ref('')
const smtpHost = ref('smtp.gmail.com')
const smtpPort = ref('587')
const smtpUser = ref('')
const smtpPass = ref('')
const smtpTo = ref('')
const cooldownMin = ref(5)
const thresholds = ref({})
const telegramStatus = ref('')
const telegramStatusColor = ref('#6b7280')
const emailStatus = ref('')
const emailStatusColor = ref('#6b7280')

const chains = computed(() => chainStore.chains)

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadConfig()
  }
})

const loadConfig = () => {
  alertEnabled.value = configStore.alertEnabled
  telegramToken.value = configStore.telegramToken
  telegramChatId.value = configStore.telegramChatId
  smtpHost.value = configStore.smtpHost
  smtpPort.value = configStore.smtpPort
  smtpUser.value = configStore.smtpUser
  smtpPass.value = configStore.smtpPass
  smtpTo.value = configStore.smtpTo
  cooldownMin.value = configStore.cooldownMin
  thresholds.value = JSON.parse(JSON.stringify(configStore.thresholds))
}

const toggleAlertEnabled = () => {
  alertEnabled.value = !alertEnabled.value
}

const closeModal = () => {
  emit('close')
}

const saveSettings = async () => {
  configStore.alertEnabled = alertEnabled.value
  configStore.telegramToken = telegramToken.value
  configStore.telegramChatId = telegramChatId.value
  configStore.smtpHost = smtpHost.value
  configStore.smtpPort = smtpPort.value
  configStore.smtpUser = smtpUser.value
  configStore.smtpPass = smtpPass.value
  configStore.smtpTo = smtpTo.value
  configStore.cooldownMin = cooldownMin.value
  configStore.thresholds = JSON.parse(JSON.stringify(thresholds.value))
  
  await configStore.saveConfig()
  closeModal()
}

const clearAlertLog = async () => {
  if (confirm('Clear all alert history?')) {
    await configStore.clearAlertLog()
  }
}

const testTelegram = async () => {
  if (!telegramToken.value || !telegramChatId.value) {
    telegramStatus.value = 'Fill both fields'
    telegramStatusColor.value = '#f87171'
    return
  }

  telegramStatus.value = 'Sending...'
  telegramStatusColor.value = '#6b7280'

  try {
    await alertsApi.testAlert('telegram', {
      telegramToken: telegramToken.value,
      telegramChatId: telegramChatId.value
    })
    telegramStatus.value = 'Sent!'
    telegramStatusColor.value = '#10b981'
  } catch (error) {
    telegramStatus.value = error.response?.data?.error || 'Error'
    telegramStatusColor.value = '#f87171'
  }
}

const testEmail = async () => {
  if (!smtpUser.value || !smtpPass.value || !smtpTo.value) {
    emailStatus.value = 'Fill all fields'
    emailStatusColor.value = '#f87171'
    return
  }

  emailStatus.value = 'Sending...'
  emailStatusColor.value = '#6b7280'

  try {
    await alertsApi.testAlert('email', {
      smtpHost: smtpHost.value,
      smtpPort: smtpPort.value,
      smtpUser: smtpUser.value,
      smtpPass: smtpPass.value,
      smtpTo: smtpTo.value
    })
    emailStatus.value = 'Sent!'
    emailStatusColor.value = '#10b981'
  } catch (error) {
    emailStatus.value = error.response?.data?.error || 'Error'
    emailStatusColor.value = '#f87171'
  }
}
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
  max-width: 500px;
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

.form-row-inline {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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

.form-input::placeholder {
  color: #374151;
}

.form-hint {
  font-size: 0.62rem;
  color: #4b5563;
  margin-top: 3px;
}

.form-hint a {
  color: #6b7280;
  text-decoration: underline;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-track {
  width: 30px;
  height: 16px;
  border-radius: 8px;
  position: relative;
  transition: background 0.2s;
}

.toggle-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  transition: all 0.2s;
}

.toggle-label {
  font-size: 0.72rem;
  color: #6b7280;
}

.threshold-chains {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.threshold-chain {
  background: #0d1117;
  border: 1px solid #161b22;
  border-radius: 8px;
  padding: 10px;
}

.threshold-chain-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #a5b4fc;
  margin-bottom: 8px;
}

.chain-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.threshold-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.threshold-row:last-child {
  margin-bottom: 0;
}

.threshold-row label {
  flex: 1;
  font-size: 0.68rem;
  color: #6b7280;
}

.threshold-row input {
  width: 70px;
  padding: 4px 8px;
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 4px;
  color: #e2e8f0;
  font-size: 0.75rem;
  text-align: right;
}

.threshold-row input:focus {
  outline: none;
  border-color: #6366f1;
}

.threshold-row .unit {
  font-size: 0.62rem;
  color: #4b5563;
  width: 35px;
}

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  bottom: 0;
  background: #111827;
}

.footer-actions {
  display: flex;
  gap: 8px;
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

.status-text {
  font-size: 0.72rem;
  margin-left: 10px;
}
</style>