<template>
  <ErrorBoundary>
    <div class="app">
      <header class="header">
        <h1>Blockchain Dashboard</h1>
        <div class="header-right">
          <span class="alert-indicator" :class="{ on: configStore.alertEnabled, off: !configStore.alertEnabled }">
            🔔 {{ configStore.alertEnabled ? 'Alerts On' : 'Alerts Off' }}
          </span>
          <button class="btn btn-alert" @click="showAlertModal = true">🔔 Alerts</button>
          <button class="btn" @click="showSettingsModal = true">⚙</button>
        </div>
      </header>

      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab" 
          :class="{ active: currentTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </button>
      </div>

      <component :is="currentComponent" />

      <div class="footer">
        Auto-refreshes every 15s &middot; Charts sampled every 15min &middot; ETH/BTC via CoinGecko
      </div>

      <AlertModal :show="showAlertModal" @close="showAlertModal = false" />
      <SettingsModal :show="showSettingsModal" @close="showSettingsModal = false" />
    </div>
  </ErrorBoundary>
  
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="['toast', `toast-${t.type}`]"
        >
          <span class="toast-icon">{{ getIcon(t.type) }}</span>
          <span class="toast-message">{{ t.message }}</span>
          <button @click="removeToast(t.id)" class="toast-close">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ChainMonitor from './components/ChainMonitor.vue'
import ChartsView from './components/ChartsView.vue'
import MemeView from './components/MemeView.vue'
import CustomDashboard from './components/CustomDashboard.vue'
import AlertModal from './components/AlertModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import LidoView from './components/LidoView.vue'
import AaveView from './components/AaveView.vue'
import AlertHistory from './components/AlertHistory.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import ToastContainer from './components/Toast.vue'
import { useToast } from './composables/useToast'
import { useConfigStore } from './stores/config'
import { useChainStore } from './stores/chain'

const configStore = useConfigStore()
const chainStore = useChainStore()
const { toasts, removeToast, getIcon } = useToast()

const currentTab = ref('monitor')
const showAlertModal = ref(false)
const showSettingsModal = ref(false)
const tabs = [
  { id: 'monitor', name: 'Monitor' },
  { id: 'charts', name: 'Charts' },
  { id: 'meme', name: 'Meme' },
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'alerts', name: 'Alerts' },
  { id: 'lido', name: 'Lido' },
  { id: 'aave', name: 'Aave' }
]

const components = {
  monitor: ChainMonitor,
  charts: ChartsView,
  meme: MemeView,
  dashboard: CustomDashboard,
  alerts: AlertHistory,
  lido: LidoView,
  aave: AaveView
}

const switchTab = (tabId) => {
  currentTab.value = tabId
}

onMounted(() => {
  chainStore.loadConfig()
  chainStore.loadHistory()
  chainStore.startRefresh()
})
</script>

<style scoped>
.app {
  padding: 16px 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}

h1 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #818cf8;
}

.header-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 0;
}

.tab {
  padding: 7px 14px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.82rem;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.15s;
}

.tab:hover {
  color: #9ca3af;
}

.tab.active {
  color: #a5b4fc;
  border-bottom-color: #6366f1;
}

.footer {
  font-size: 0.6rem;
  color: #374151;
  margin-top: 16px;
}

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #1f2937;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 4px solid;
}

.toast-error { border-left-color: #ef4444; }
.toast-warning { border-left-color: #f59e0b; }
.toast-success { border-left-color: #10b981; }
.toast-info { border-left-color: #3b82f6; }

.toast-icon { font-size: 1.25rem; flex-shrink: 0; }

.toast-message {
  flex: 1;
  font-size: 0.875rem;
  color: #f9fafb;
  word-break: break-word;
}

.toast-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
}

.toast-close:hover { color: #f9fafb; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>