<template>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ChainMonitor from './components/ChainMonitor.vue'
import ChartsView from './components/ChartsView.vue'
import MemeView from './components/MemeView.vue'
import CustomDashboard from './components/CustomDashboard.vue'
import AlertModal from './components/AlertModal.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useConfigStore } from './stores/config'
import { useChainStore } from './stores/chain'

const configStore = useConfigStore()
const chainStore = useChainStore()

const currentTab = ref('monitor')
const showAlertModal = ref(false)
const showSettingsModal = ref(false)
const tabs = [
  { id: 'monitor', name: 'Monitor' },
  { id: 'charts', name: 'Charts' },
  { id: 'meme', name: 'Meme' },
  { id: 'dashboard', name: 'Dashboard' }
]

const currentComponent = computed(() => {
  const components = {
    monitor: ChainMonitor,
    charts: ChartsView,
    meme: MemeView,
    dashboard: CustomDashboard
  }
  return components[currentTab.value]
})

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
</style>