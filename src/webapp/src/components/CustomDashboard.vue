<template>
  <div class="dashboard-view">
    <div class="dashboard-header">
      <h2>Custom Dashboard</h2>
      <div class="dashboard-controls">
        <button class="btn" @click="showTemplates = true">Templates</button>
        <button class="btn" @click="openAddCardModal">+ Add Widget</button>
        <button class="btn" @click="saveDashboard">Save</button>
        <button class="btn btn-danger" @click="resetDashboard">Reset</button>
      </div>
    </div>

    <div 
      class="dashboard-grid" 
      @dragover.prevent 
      @drop="onDrop"
    >
      <div 
        v-for="(card, index) in cards" 
        :key="card.id"
        class="dashboard-card"
        :class="{ dragging: dragIndex === index }"
        draggable="true"
        @dragstart="onDragStart(index)"
        @dragend="onDragEnd"
        @dragover.prevent
        @drop.prevent="onCardDrop(index)"
      >
        <div class="dashboard-card-header">
          <span class="drag-handle">⠿</span>
          <span class="dashboard-card-title">{{ card.title }}</span>
          <div class="dashboard-card-actions">
            <button class="dashboard-card-btn" @click="editCard(index)">✎</button>
            <button class="dashboard-card-btn" @click="removeCard(index)">×</button>
          </div>
        </div>
        <div class="dashboard-card-content">
          <div v-if="card.type === 'chain'" class="chain-card">
            <div class="chain-card-header">
              <span class="chain-color" :style="{ background: getChainColor(card.chain) }"></span>
              {{ getChainName(card.chain) }}
            </div>
            <div class="chain-card-value">{{ getChainValue(card) }}</div>
            <div class="chain-card-sub">{{ card.metric }}</div>
          </div>
          
          <div v-else-if="card.type === 'price'" class="price-card">
            <div class="price-card-header">{{ card.coin.toUpperCase() }}</div>
            <div class="price-card-value">${{ card.value?.toFixed(2) || '--' }}</div>
            <div :class="['price-card-change', (card.change >= 0) ? 'green' : 'red']">
              {{ card.change >= 0 ? '+' : '' }}{{ card.change?.toFixed(2) || '0.00' }}%
            </div>
          </div>
          
          <div v-else-if="card.type === 'alert'" class="alert-card">
            <div class="alert-card-header">Alerts</div>
            <div class="alert-card-count">{{ configStore.alertLog?.length || 0 }}</div>
            <div class="alert-card-sub">Recent alerts</div>
          </div>

          <div v-else-if="card.type === 'chart'" class="mini-chart">
            <svg :viewBox="`0 0 200 60`" class="chart-svg">
              <polyline
                :points="getChartPoints(card.data)"
                fill="none"
                :stroke="getChainColor(card.chain)"
                stroke-width="2"
              />
            </svg>
            <div class="chart-label">{{ getChainName(card.chain) }} - {{ card.metric }}</div>
          </div>

          <div v-else-if="card.type === 'meme'" class="meme-card">
            <div class="meme-card-header">Top Meme Coins</div>
            <div v-for="(meme, i) in memeCoins.slice(0, 3)" :key="i" class="meme-row">
              <span class="meme-name">{{ meme.symbol }}</span>
              <span class="meme-price">${{ meme.price_usd?.toFixed(6) }}</span>
            </div>
          </div>

          <div v-else-if="card.type === 'tvl'" class="tvl-card">
            <div class="tvl-card-header">{{ card.protocol }} TVL</div>
            <div class="tvl-card-value">${{ formatTVL(card.value) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-overlay" @click="closeAddCardModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingIndex >= 0 ? 'Edit Widget' : 'Add Widget' }}</h3>
          <button class="modal-close" @click="closeAddCardModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">Widget Type</label>
            <select v-model="newCard.type" class="form-input">
              <option value="chain">Chain Metric</option>
              <option value="price">Price</option>
              <option value="alert">Alert Count</option>
              <option value="chart">Mini Chart</option>
              <option value="meme">Meme Coins</option>
              <option value="tvl">TVL Tracker</option>
            </select>
          </div>
          
          <div v-if="newCard.type === 'chain' || newCard.type === 'chart'" class="form-row">
            <label class="form-label">Chain</label>
            <select v-model="newCard.chain" class="form-input">
              <option v-for="chain in chains" :key="chain.id" :value="chain.id">
                {{ chain.name }}
              </option>
            </select>
          </div>
          
          <div v-if="newCard.type === 'chain' || newCard.type === 'chart'" class="form-row">
            <label class="form-label">Metric</label>
            <select v-model="newCard.metric" class="form-input">
              <option value="gas">Priority Fee</option>
              <option value="baseFee">Base Fee</option>
              <option value="blobFee">Blob Fee</option>
              <option value="util">Gas Utilization</option>
            </select>
          </div>
          
          <div v-if="newCard.type === 'price'" class="form-row">
            <label class="form-label">Coin</label>
            <select v-model="newCard.coin" class="form-input">
              <option value="eth">Ethereum</option>
              <option value="btc">Bitcoin</option>
              <option value="sol">Solana</option>
            </select>
          </div>

          <div v-if="newCard.type === 'tvl'" class="form-row">
            <label class="form-label">Protocol</label>
            <select v-model="newCard.protocol" class="form-input">
              <option value="Lido">Lido</option>
              <option value="Aave">Aave</option>
            </select>
          </div>
          
          <div class="form-row">
            <label class="form-label">Widget Title</label>
            <input v-model="newCard.title" class="form-input" placeholder="Enter title">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeAddCardModal">Cancel</button>
          <button class="btn btn-primary" @click="saveCard">{{ editingIndex >= 0 ? 'Update' : 'Add' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showTemplates" class="modal-overlay" @click="showTemplates = false">
      <div class="modal modal-lg" @click.stop>
        <div class="modal-header">
          <h3>Dashboard Templates</h3>
          <button class="modal-close" @click="showTemplates = false">×</button>
        </div>
        <div class="modal-body">
          <div class="template-grid">
            <div 
              v-for="tpl in templates" 
              :key="tpl.id" 
              class="template-card"
              @click="applyTemplate(tpl)"
            >
              <h4>{{ tpl.name }}</h4>
              <p>{{ tpl.description }}</p>
              <span class="template-count">{{ tpl.cards.length }} widgets</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useChainStore } from '../stores/chain'
import { useConfigStore } from '../stores/config'

const chainStore = useChainStore()
const configStore = useConfigStore()

const cards = ref([])
const showAddModal = ref(false)
const showTemplates = ref(false)
const editingIndex = ref(-1)
const dragIndex = ref(null)

const newCard = ref({
  id: '',
  type: 'chain',
  chain: 'ethereum',
  metric: 'gas',
  coin: 'eth',
  protocol: 'Lido',
  title: ''
})

const chains = computed(() => chainStore.chains)
const memeCoins = computed(() => chainStore.memeCoins || [])

const templates = [
  {
    id: 'default',
    name: 'Default',
    description: 'Basic chain metrics and ETH price',
    cards: [
      { id: '1', type: 'chain', chain: 'ethereum', metric: 'gas', title: 'ETH Gas' },
      { id: '2', type: 'chain', chain: 'ethereum', metric: 'baseFee', title: 'ETH Base Fee' },
      { id: '3', type: 'price', coin: 'eth', title: 'ETH Price' },
      { id: '4', type: 'alert', title: 'Alerts' }
    ]
  },
  {
    id: 'trader',
    name: 'Trader View',
    description: 'Price focused with all chains',
    cards: [
      { id: '1', type: 'price', coin: 'eth', title: 'ETH Price' },
      { id: '2', type: 'price', coin: 'btc', title: 'BTC Price' },
      { id: '3', type: 'chain', chain: 'ethereum', metric: 'gas', title: 'ETH Gas' },
      { id: '4', type: 'chain', chain: 'arbitrum', metric: 'gas', title: 'ARB Gas' },
      { id: '5', type: 'meme', title: 'Top Memes' }
    ]
  },
  {
    id: 'defi',
    name: 'DeFi Dashboard',
    description: 'TVL and DeFi protocol metrics',
    cards: [
      { id: '1', type: 'tvl', protocol: 'Lido', title: 'Lido TVL' },
      { id: '2', type: 'tvl', protocol: 'Aave', title: 'Aave TVL' },
      { id: '3', type: 'chain', chain: 'ethereum', metric: 'util', title: 'ETH Utilization' },
      { id: '4', type: 'alert', title: 'Alerts' }
    ]
  },
  {
    id: 'charts',
    name: 'Charts View',
    description: 'Mini charts for all chains',
    cards: [
      { id: '1', type: 'chart', chain: 'ethereum', metric: 'gas', title: 'ETH Gas Chart' },
      { id: '2', type: 'chart', chain: 'base', metric: 'gas', title: 'Base Gas Chart' },
      { id: '3', type: 'chart', chain: 'arbitrum', metric: 'gas', title: 'ARB Gas Chart' },
      { id: '4', type: 'chart', chain: 'optimism', metric: 'gas', title: 'OP Gas Chart' }
    ]
  }
]

const getChainColor = (chainId) => {
  const chain = chains.value.find(c => c.id === chainId)
  return chain?.color || '#6b7280'
}

const getChainName = (chainId) => {
  const chain = chains.value.find(c => c.id === chainId)
  return chain?.name || chainId
}

const getChainValue = (card) => {
  const chainData = chainStore.chains.find(c => c.id === card.chain)
  if (!chainData?.current) return '--'
  const val = chainData.current[card.metric]
  if (val === undefined) return '--'
  if (card.metric === 'blobFee') return val.toFixed(4)
  if (card.metric === 'util') return val.toFixed(1) + '%'
  return val.toFixed(0)
}

const formatTVL = (val) => {
  if (!val) return '--'
  if (val >= 1e9) return (val / 1e9).toFixed(2) + 'B'
  if (val >= 1e6) return (val / 1e6).toFixed(2) + 'M'
  return val.toFixed(0)
}

const getChartPoints = (data) => {
  if (!data || data.length === 0) return '0,30 200,30'
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * 200
    const y = 60 - ((v - min) / range) * 50 - 5
    return `${x},${y}`
  }).join(' ')
}

const openAddCardModal = () => {
  editingIndex.value = -1
  newCard.value = {
    id: 'card_' + Date.now(),
    type: 'chain',
    chain: 'ethereum',
    metric: 'gas',
    coin: 'eth',
    protocol: 'Lido',
    title: ''
  }
  showAddModal.value = true
}

const editCard = (index) => {
  editingIndex.value = index
  newCard.value = { ...cards.value[index] }
  showAddModal.value = true
}

const closeAddCardModal = () => {
  showAddModal.value = false
  editingIndex.value = -1
}

const saveCard = () => {
  if (!newCard.value.title) return
  
  if (editingIndex.value >= 0) {
    cards.value[editingIndex.value] = { ...newCard.value }
  } else {
    cards.value.push({ ...newCard.value })
  }
  closeAddCardModal()
  saveDashboard()
}

const removeCard = (index) => {
  cards.value.splice(index, 1)
  saveDashboard()
}

const saveDashboard = () => {
  localStorage.setItem('mcm_dashboard_v2', JSON.stringify(cards.value))
}

const resetDashboard = () => {
  if (confirm('Reset dashboard to default?')) {
    applyTemplate(templates[0])
  }
}

const applyTemplate = (tpl) => {
  cards.value = tpl.cards.map(c => ({ ...c, id: c.id + '_' + Date.now() }))
  showTemplates.value = false
  saveDashboard()
}

const onDragStart = (index) => {
  dragIndex.value = index
}

const onDragEnd = () => {
  dragIndex.value = null
}

const onCardDrop = (targetIndex) => {
  if (dragIndex.value === null || dragIndex.value === targetIndex) return
  const item = cards.value.splice(dragIndex.value, 1)[0]
  cards.value.splice(targetIndex, 0, item)
  dragIndex.value = null
  saveDashboard()
}

const onDrop = () => {
  dragIndex.value = null
}

const loadDashboard = () => {
  try {
    const saved = localStorage.getItem('mcm_dashboard_v2')
    if (saved) {
      cards.value = JSON.parse(saved)
    } else {
      applyTemplate(templates[0])
    }
  } catch (e) {
    applyTemplate(templates[0])
  }
}

const updateCardData = () => {
  cards.value.forEach(card => {
    if (card.type === 'price') {
      const prices = chainStore.prices
      if (prices?.[card.coin]) {
        card.value = prices[card.coin].usd
        card.change = prices[card.coin].usd_24h_change
      }
    }
    if (card.type === 'chart') {
      const chainData = chainStore.chains.find(c => c.id === card.chain)
      if (chainData?.history) {
        card.data = chainData.history.map(p => p[card.metric] || 0)
      }
    }
    if (card.type === 'tvl') {
      if (card.protocol === 'Lido') {
        card.value = chainStore.lidoTVL?.totalTvlUsd
      } else if (card.protocol === 'Aave') {
        card.value = chainStore.aaveTVL?.totalLiquidityUSD
      }
    }
  })
}

onMounted(() => {
  loadDashboard()
  updateCardData()
  setInterval(updateCardData, 15000)
})
</script>

<style scoped>
.dashboard-view { padding: 0; }

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 0 12px 0;
  border-bottom: 1px solid #1f2937;
}

h2 { font-size: 1.1rem; font-weight: 600; color: #818cf8; }

.dashboard-controls { display: flex; gap: 8px; }

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.dashboard-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.dashboard-card.dragging {
  opacity: 0.5;
  border: 2px dashed #6366f1;
}

.dashboard-card:hover {
  border-color: #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dashboard-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #0d1117;
  border-bottom: 1px solid #1f2937;
}

.drag-handle {
  cursor: grab;
  color: #4b5563;
  font-size: 0.9rem;
}

.drag-handle:active { cursor: grabbing; }

.dashboard-card-title {
  flex: 1;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
}

.dashboard-card-actions { display: flex; gap: 4px; }

.dashboard-card-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0 2px;
}

.dashboard-card-btn:hover { color: #e2e8f0; }

.dashboard-card-content { padding: 12px; }

.chain-card { display: flex; flex-direction: column; gap: 8px; }

.chain-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: #6b7280;
}

.chain-color { width: 6px; height: 6px; border-radius: 50%; }

.chain-card-value { font-size: 1.3rem; font-weight: 700; color: #e2e8f0; }

.chain-card-sub {
  font-size: 0.62rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-card { display: flex; flex-direction: column; gap: 6px; }

.price-card-header { font-size: 0.68rem; color: #6b7280; }

.price-card-value { font-size: 1.3rem; font-weight: 700; color: #fb923c; }

.price-card-change { font-size: 0.72rem; font-weight: 600; }
.price-card-change.green { color: #10b981; }
.price-card-change.red { color: #ef4444; }

.alert-card { display: flex; flex-direction: column; gap: 6px; }
.alert-card-header { font-size: 0.68rem; color: #6b7280; }
.alert-card-count { font-size: 1.3rem; font-weight: 700; color: #f87171; }
.alert-card-sub { font-size: 0.62rem; color: #4b5563; }

.mini-chart { text-align: center; }
.chart-svg { width: 100%; height: 60px; }
.chart-label { font-size: 0.62rem; color: #6b7280; margin-top: 4px; }

.meme-card { display: flex; flex-direction: column; gap: 6px; }
.meme-card-header { font-size: 0.68rem; color: #6b7280; }
.meme-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}
.meme-name { color: #e2e8f0; }
.meme-price { color: #6b7280; }

.tvl-card { display: flex; flex-direction: column; gap: 6px; text-align: center; }
.tvl-card-header { font-size: 0.68rem; color: #6b7280; }
.tvl-card-value { font-size: 1.3rem; font-weight: 700; color: #a5b4fc; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-lg { max-width: 700px; }

.modal-header {
  padding: 14px 18px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
}

.modal-body { padding: 18px; }

.form-row { margin-bottom: 10px; }
.form-label { font-size: 0.68rem; color: #9ca3af; margin-bottom: 3px; display: block; }

.form-input {
  width: 100%;
  padding: 6px 9px;
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.78rem;
}

.form-input:focus { outline: none; border-color: #6366f1; }

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-card {
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-card:hover {
  border-color: #6366f1;
  background: #161b22;
}

.template-card h4 { margin: 0 0 8px; color: #e2e8f0; }
.template-card p { margin: 0 0 8px; font-size: 0.75rem; color: #6b7280; }
.template-count {
  font-size: 0.68rem;
  color: #818cf8;
  background: #1f2937;
  padding: 2px 8px;
  border-radius: 10px;
}

.btn-danger { background: #991b1b; color: #fecaca; }
.btn-danger:hover { background: #b91c1c; }

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .template-grid { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .dashboard-controls { width: 100%; justify-content: space-between; flex-wrap: wrap; }
}

@media (max-width: 480px) {
  .dashboard-grid { grid-template-columns: 1fr 1fr; }
}
</style>
