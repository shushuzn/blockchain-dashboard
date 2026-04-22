<template>
  <div class="monitor-view">
    <div class="chain-tabs">
      <button 
        v-for="chain in chains" 
        :key="chain.id"
        class="chain-tab" 
        :class="{ active: activeChain === chain.id }"
        @click="switchChain(chain.id)"
      >
        {{ chain.name }}
      </button>
    </div>

    <div class="eth-banner">
      <div>
        <div class="label">ETH</div>
        <div class="price">{{ ethPrice }}</div>
      </div>
      <div>
        <div class="label">24h</div>
        <div :class="['change', ethChange >= 0 ? 'green' : 'red']">{{ ethChangeText }}</div>
      </div>
      <div>
        <div class="label">BTC</div>
        <div class="price">{{ btcPrice }}</div>
      </div>
      <div>
        <div class="label">Updated</div>
        <div class="updated">{{ lastUpdated }}</div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="grid">
        <div v-for="i in 6" :key="i" class="card loading">
          <div class="card-label">Loading...</div>
          <div class="card-value">--</div>
        </div>
      </div>
    </div>

    <div v-else-if="chainData" class="chain-data">
      <div class="chain-meta">
        <span class="chain-color" :style="{ background: currentChain.color }"></span>
        {{ currentChain.name }}
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-label">Latest Block</div>
          <div class="card-value cyan">{{ chainData.blockFmt }}</div>
          <div class="card-sub">{{ chainData.blockSub }}</div>
        </div>
        <div class="card" :style="{ borderColor: chainData.gas > threshold.gas ? '#ef4444' : '' }">
          <div class="card-label">Priority Fee</div>
          <div :class="['card-value', getGasColor(chainData.gas)]">{{ chainData.gasFmt }}</div>
          <div class="card-sub">gwei · low</div>
        </div>
        <div class="card" :style="{ borderColor: chainData.baseFee > threshold.baseFee ? '#ef4444' : '' }">
          <div class="card-label">Base Fee</div>
          <div :class="['card-value', getBaseFeeColor(chainData.baseFee)]">{{ chainData.baseFeeFmt }}</div>
          <div class="card-sub">gwei</div>
        </div>
        <div v-if="currentChain.hasBlob && chainData.blobFee !== null" class="card" :style="{ borderColor: chainData.blobFee > threshold.blobFee ? '#ef4444' : '' }">
          <div class="card-label">Blob Fee</div>
          <div class="card-value purple">{{ chainData.blobFeeFmt }}</div>
          <div class="card-sub">gwei · EIP-4844</div>
        </div>
        <div class="card">
          <div class="card-label">Gas Util</div>
          <div :class="['card-value', getUtilColor(chainData.utilPct)]">{{ chainData.utilPctFmt }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ 
              width: Math.min(100, chainData.utilPct) + '%',
              background: getUtilColor(chainData.utilPct) === 'red' ? '#ef4444' : 
                         getUtilColor(chainData.utilPct) === 'yellow' ? '#f59e0b' : '#10b981'
            }"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-label">ETH Supply</div>
          <div class="card-value cyan">{{ chainData.supply }}</div>
          <div class="card-sub">million ETH</div>
        </div>
        <div class="card">
          <div class="card-label">ETH Market Cap</div>
          <div class="card-value orange">{{ chainData.mcap }}</div>
          <div class="card-sub">@ ETH price</div>
        </div>
        <div v-if="currentChain.hasMEV && chainData.mevData" class="card">
          <div class="card-label">MEV Reward</div>
          <div class="card-value purple">{{ formatMEV(chainData.mevData.mevReward) }}</div>
          <div class="card-sub">{{ chainData.mevData.mevShare }}% of block</div>
        </div>
      </div>
    </div>

    <div class="alert-log" v-if="alertLog.length > 0">
      <div class="alert-log-header">
        <span>📋 Alert History</span>
        <span>{{ alertLog.length }} alert{{ alertLog.length !== 1 ? 's' : '' }}</span>
      </div>
      <div class="alert-log-body">
        <div v-for="(alert, index) in alertLog" :key="index" class="alert-item">
          <span class="alert-time">{{ alert.time }}</span>
          <span class="alert-chain">{{ alert.chain }}</span>
          <span class="alert-msg">
            <span class="metric">{{ alert.metric }}</span> {{ alert.value }} > {{ alert.threshold }}
          </span>
        </div>
      </div>
    </div>
    <div v-else class="alert-log">
      <div class="alert-log-header">
        <span>📋 Alert History</span>
        <span>0 alerts</span>
      </div>
      <div class="alert-log-body">
        <div class="alert-empty">No alerts yet</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useChainStore } from '../stores/chain'
import { useConfigStore } from '../stores/config'

const chainStore = useChainStore()
const configStore = useConfigStore()

const activeChain = ref('ethereum')
const loading = ref(false)
const chainData = ref(null)

const chains = computed(() => chainStore.chains)
const ethPrice = computed(() => chainStore.ethPrice)
const ethChange = computed(() => chainStore.ethChange)
const ethChangeText = computed(() => (ethChange.value >= 0 ? '+' : '') + ethChange.value.toFixed(2) + '%')
const btcPrice = computed(() => chainStore.btcPrice)
const lastUpdated = computed(() => chainStore.lastUpdated)
const alertLog = computed(() => configStore.alertLog)

const currentChain = computed(() => {
  return chains.value.find(c => c.id === activeChain.value) || chains.value[0]
})

const threshold = computed(() => {
  return configStore.thresholds[activeChain.value] || { gas: 50, baseFee: 50, blobFee: 0.1 }
})

const getGasColor = (gas) => {
  if (gas > threshold.value.gas) return 'red'
  if (gas > 20) return 'yellow'
  return 'green'
}

const getBaseFeeColor = (baseFee) => {
  if (baseFee > threshold.value.baseFee) return 'red'
  if (baseFee > 20) return 'yellow'
  return 'green'
}

const getUtilColor = (util) => {
  if (util > 80) return 'red'
  if (util > 50) return 'yellow'
  return 'green'
}

const formatMEV = (mevReward) => {
  const eth = mevReward / 1e18
  if (eth >= 1) return eth.toFixed(2) + ' ETH'
  return (eth * 1000).toFixed(2) + ' mETH'
}

const switchChain = (chainId) => {
  activeChain.value = chainId
  loadChainData()
}

const loadChainData = async () => {
  loading.value = true
  try {
    const data = await chainStore.fetchChainData(currentChain.value)
    chainData.value = data
  } catch (e) {
    console.error('Failed to load chain data:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadChainData()
  watch(activeChain, loadChainData)
})
</script>

<style scoped>
.monitor-view {
  padding: 0;
}

.eth-banner {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 9px;
  padding: 10px 16px;
  margin-bottom: 14px;
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
}

.eth-banner .label {
  font-size: 0.62rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.eth-banner .price {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fb923c;
}

.eth-banner .change {
  font-size: 0.75rem;
}

.eth-banner .updated {
  font-size: 0.75rem;
  color: #6b7280;
}

.chain-meta {
  font-size: 0.65rem;
  color: #4b5563;
  margin-bottom: 12px;
}

.chain-color {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}

.progress-bar {
  height: 4px;
  background: #1f2937;
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s;
}

.alert-log {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 9px;
  overflow: hidden;
  margin-top: 14px;
}

.alert-log-header {
  padding: 8px 14px;
  background: #0d1117;
  border-bottom: 1px solid #1f2937;
  font-size: 0.68rem;
  color: #6b7280;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
}

.alert-log-body {
  max-height: 130px;
  overflow-y: auto;
}

.alert-item {
  padding: 7px 14px;
  font-size: 0.68rem;
  border-bottom: 1px solid #161b22;
  display: flex;
  gap: 10px;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-time {
  color: #4b5563;
  min-width: 65px;
}

.alert-chain {
  color: #6b7280;
  min-width: 65px;
}

.alert-msg {
  color: #d1d5db;
  flex: 1;
}

.alert-msg .metric {
  color: #f87171;
  font-weight: 600;
}

.alert-empty {
  padding: 14px;
  text-align: center;
  color: #374151;
  font-size: 0.68rem;
}
</style>