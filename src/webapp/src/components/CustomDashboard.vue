<template>
  <div class="dashboard-view">
    <div class="dashboard-header">
      <h2>Custom Dashboard</h2>
      <div class="dashboard-controls">
        <button class="btn" @click="openAddCardModal">Add Card</button>
        <button class="btn" @click="saveDashboard">Save</button>
        <button class="btn" @click="resetDashboard">Reset</button>
      </div>
    </div>

    <div class="dashboard-grid">
      <div 
        v-for="(card, index) in cards" 
        :key="card.id"
        class="dashboard-card"
      >
        <div class="dashboard-card-header">
          <span class="dashboard-card-title">{{ card.title }}</span>
          <div class="dashboard-card-actions">
            <button class="dashboard-card-btn" @click="removeCard(index)">×</button>
          </div>
        </div>
        <div class="dashboard-card-content">
          <!-- Card content based on type -->
          <div v-if="card.type === 'chain'" class="chain-card">
            <div class="chain-card-header">
              <span class="chain-color" :style="{ background: getChainColor(card.chain) }"></span>
              {{ getChainName(card.chain) }}
            </div>
            <div class="chain-card-value">{{ card.value || '--' }}</div>
            <div class="chain-card-sub">{{ card.metric }}</div>
          </div>
          
          <div v-else-if="card.type === 'price'" class="price-card">
            <div class="price-card-header">
              {{ card.coin.toUpperCase() }}
            </div>
            <div class="price-card-value">{{ card.value || '--' }}</div>
            <div :class="['price-card-change', card.change >= 0 ? 'green' : 'red']">
              {{ card.change ? (card.change >= 0 ? '+' : '') + card.change.toFixed(2) + '%' : '--' }}
            </div>
          </div>
          
          <div v-else-if="card.type === 'alert'" class="alert-card">
            <div class="alert-card-header">
              Alerts
            </div>
            <div class="alert-card-count">{{ card.count || 0 }}</div>
            <div class="alert-card-sub">Recent alerts</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Card Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddCardModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Add Card</h3>
          <button class="modal-close" @click="closeAddCardModal">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label class="form-label">Card Type</label>
            <select v-model="newCard.type" class="form-input">
              <option value="chain">Chain Metric</option>
              <option value="price">Price</option>
              <option value="alert">Alert Count</option>
            </select>
          </div>
          
          <div v-if="newCard.type === 'chain'" class="form-row">
            <label class="form-label">Chain</label>
            <select v-model="newCard.chain" class="form-input">
              <option v-for="chain in chains" :key="chain.id" :value="chain.id">
                {{ chain.name }}
              </option>
            </select>
          </div>
          
          <div v-if="newCard.type === 'chain'" class="form-row">
            <label class="form-label">Metric</label>
            <select v-model="newCard.metric" class="form-input">
              <option value="gas">Priority Fee</option>
              <option value="baseFee">Base Fee</option>
              <option value="blobFee">Blob Fee</option>
              <option value="util">Gas Utilization</option>
              <option value="mev">MEV Reward</option>
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
          
          <div class="form-row">
            <label class="form-label">Card Title</label>
            <input v-model="newCard.title" class="form-input" placeholder="Enter card title">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" @click="closeAddCardModal">Cancel</button>
          <button class="btn btn-primary" @click="addCard">Add Card</button>
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
const newCard = ref({
  id: '',
  type: 'chain',
  chain: 'ethereum',
  metric: 'gas',
  coin: 'eth',
  title: ''
})

const chains = computed(() => chainStore.chains)

const getChainColor = (chainId) => {
  const chain = chains.value.find(c => c.id === chainId)
  return chain?.color || '#6b7280'
}

const getChainName = (chainId) => {
  const chain = chains.value.find(c => c.id === chainId)
  return chain?.name || chainId
}

const openAddCardModal = () => {
  newCard.value = {
    id: 'card_' + Date.now(),
    type: 'chain',
    chain: 'ethereum',
    metric: 'gas',
    coin: 'eth',
    title: ''
  }
  showAddModal.value = true
}

const closeAddCardModal = () => {
  showAddModal.value = false
}

const addCard = () => {
  if (!newCard.value.title) return
  
  cards.value.push({ ...newCard.value })
  closeAddCardModal()
  saveDashboard()
}

const removeCard = (index) => {
  cards.value.splice(index, 1)
  saveDashboard()
}

const saveDashboard = () => {
  localStorage.setItem('mcm_dashboard', JSON.stringify(cards.value))
  console.log('Dashboard saved')
}

const resetDashboard = () => {
  cards.value = defaultDashboard
  saveDashboard()
}

const defaultDashboard = [
  {
    id: 'card_1',
    type: 'chain',
    chain: 'ethereum',
    metric: 'gas',
    title: 'Ethereum Gas'
  },
  {
    id: 'card_2',
    type: 'chain',
    chain: 'ethereum',
    metric: 'baseFee',
    title: 'Ethereum Base Fee'
  },
  {
    id: 'card_3',
    type: 'price',
    coin: 'eth',
    title: 'ETH Price'
  },
  {
    id: 'card_4',
    type: 'alert',
    title: 'Alert Count'
  }
]

const loadDashboard = () => {
  try {
    const saved = localStorage.getItem('mcm_dashboard')
    if (saved) {
      cards.value = JSON.parse(saved)
    } else {
      cards.value = defaultDashboard
    }
  } catch (e) {
    cards.value = defaultDashboard
  }
}

const updateCardData = () => {
  // Update card values based on current data
  cards.value.forEach(card => {
    if (card.type === 'chain') {
      // Update chain metric
    } else if (card.type === 'price') {
      // Update price data
    } else if (card.type === 'alert') {
      card.count = configStore.alertLog.length
    }
  })
}

onMounted(() => {
  loadDashboard()
  updateCardData()
  
  // Set up periodic updates
  setInterval(updateCardData, 15000)
})
</script>

<style scoped>
.dashboard-view {
  padding: 0;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 0 12px 0;
  border-bottom: 1px solid #1f2937;
}

h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #818cf8;
}

.dashboard-controls {
  display: flex;
  gap: 8px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.dashboard-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s;
}

.dashboard-card:hover {
  border-color: #374151;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dashboard-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #0d1117;
  border-bottom: 1px solid #1f2937;
}

.dashboard-card-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
}

.dashboard-card-actions {
  display: flex;
  gap: 4px;
}

.dashboard-card-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.dashboard-card-btn:hover {
  background: #1f2937;
  color: #e2e8f0;
}

.dashboard-card-content {
  padding: 12px;
}

.chain-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chain-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: #6b7280;
}

.chain-color {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.chain-card-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e2e8f0;
}

.chain-card-sub {
  font-size: 0.62rem;
  color: #4b5563;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.price-card-header {
  font-size: 0.68rem;
  color: #6b7280;
}

.price-card-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fb923c;
}

.price-card-change {
  font-size: 0.72rem;
  font-weight: 600;
}

.alert-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-card-header {
  font-size: 0.68rem;
  color: #6b7280;
}

.alert-card-count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #f87171;
}

.alert-card-sub {
  font-size: 0.62rem;
  color: #4b5563;
}

/* Modal */
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

.modal-header {
  padding: 14px 18px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 0.95rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 1.1rem;
}

.modal-close:hover {
  color: #e2e8f0;
}

.modal-body {
  padding: 18px;
}

.form-row {
  margin-bottom: 10px;
}

.form-label {
  font-size: 0.68rem;
  color: #9ca3af;
  margin-bottom: 3px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 6px 9px;
  background: #0d1117;
  border: 1px solid #1f2937;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 0.78rem;
}

.form-input:focus {
  outline: none;
  border-color: #6366f1;
}

.modal-footer {
  padding: 12px 18px;
  border-top: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .dashboard-controls {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .dashboard-card {
    min-height: 120px;
  }
}
</style>