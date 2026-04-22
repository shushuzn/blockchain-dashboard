<template>
  <div class="meme-view">
    <div class="meme-header">
      <div class="meme-stats-row">
        <div class="meme-stat">
          <span class="meme-stat-label">Solana Pump.fun</span>
          <span class="meme-stat-value">{{ totalMemes }}</span>
        </div>
        <div class="meme-stat">
          <span class="meme-stat-label">Top Market Cap</span>
          <span class="meme-stat-value">{{ topMarketCap }}</span>
        </div>
        <div class="meme-stat">
          <span class="meme-stat-label">Updated</span>
          <span class="meme-stat-value">{{ lastUpdated }}</span>
        </div>
      </div>
      <div class="meme-controls">
        <select v-model="sortBy" @change="renderMemeGrid">
          <option value="marketCap">Sort: Market Cap</option>
          <option value="sniperRate">Sort: Sniper Rate</option>
          <option value="holders">Sort: Holders</option>
          <option value="price">Sort: Price</option>
        </select>
        <input 
          v-model="searchQuery" 
          placeholder="Search..." 
          @input="renderMemeGrid"
        >
        <button class="btn" @click="refreshMemeData">Refresh</button>
      </div>
    </div>

    <div v-if="loading" class="meme-loading">
      Loading meme coins...
    </div>

    <div v-else-if="error" class="meme-error">
      {{ error }}
    </div>

    <div v-else class="meme-grid">
      <div 
        v-for="meme in filteredMemes" 
        :key="meme.memeCoin?.mint || Math.random()"
        class="meme-card"
        @click="openPumpFun(meme.memeCoin?.mint)"
      >
        <div class="meme-card-top">
          <div>
            <div class="meme-card-name">{{ meme.memeCoin?.name || '?' }}</div>
            <div class="meme-card-sym">{{ meme.memeCoin?.symbol || '?' }}</div>
          </div>
          <img 
            v-if="meme.memeCoin?.imageUri" 
            class="meme-card-img" 
            :src="meme.memeCoin.imageUri" 
            @error="handleImageError"
          >
        </div>
        <div class="meme-card-price">
          ${{ formatPrice(meme.price) }}
        </div>
        <div class="meme-card-mcap">
          MCap: {{ formatMarketCap(meme.marketCap) }}
        </div>
        <div class="meme-card-row">
          <span>Sniper Rate</span>
          <span>{{ (meme.sniperRate || 0).toFixed(1) }}%</span>
        </div>
        <div class="meme-card-row">
          <span>Holders</span>
          <span>{{ (meme.holders || 0).toLocaleString() }}</span>
        </div>
        <div class="meme-card-row">
          <span>Bonded</span>
          <span :class="{ bonded: meme.memeCoin?.bondedBtn, 'bonded-none': !meme.memeCoin?.bondedBtn }">
            {{ meme.memeCoin?.bondedBtn ? 'Yes' : 'No' }}
          </span>
        </div>
        <div class="meme-card-row">
          <span>Risk</span>
          <span :class="{ 'risk-honor': meme.risk === 'honor', 'risk-risk': meme.risk !== 'honor' }">
            {{ meme.risk || 'unknown' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const memeData = ref([])
const loading = ref(false)
const error = ref(null)
const sortBy = ref('marketCap')
const searchQuery = ref('')
const lastUpdated = ref('--')
let memeRefreshTimer = null

const totalMemes = computed(() => memeData.value.length)

const topMarketCap = computed(() => {
  if (memeData.value.length === 0) return '--'
  const top = memeData.value.reduce((best, meme) => {
    const mcap = parseFloat(meme.marketCap) || 0
    return mcap > (parseFloat(best.marketCap) || 0) ? meme : best
  }, memeData.value[0])
  return formatMarketCap(top.marketCap)
})

const filteredMemes = computed(() => {
  let memes = [...memeData.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    memes = memes.filter(meme => {
      return (meme.memeCoin?.name || '').toLowerCase().includes(query) ||
             (meme.memeCoin?.symbol || '').toLowerCase().includes(query)
    })
  }
  
  // Sort
  memes.sort((a, b) => {
    const aValue = parseFloat(a[sortBy.value] || 0)
    const bValue = parseFloat(b[sortBy.value] || 0)
    return bValue - aValue
  })
  
  return memes
})

const refreshMemeData = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('http://localhost:8765/api/meme')
    if (!res.ok) {
      throw new Error('Proxy not running (localhost:8765)')
    }
    memeData.value = await res.json()
    lastUpdated.value = new Date().toLocaleTimeString()
  } catch (e) {
    error.value = 'Error: ' + e.message + ' — start meme_proxy.py'
  } finally {
    loading.value = false
  }
}

const renderMemeGrid = () => {
  // Already handled by computed property
}

const openPumpFun = (mint) => {
  if (mint) {
    window.open(`https://pump.fun/${mint}`, '_blank')
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

const formatPrice = (price) => {
  const p = parseFloat(price) || 0
  return p < 0.001 ? p.toExponential(2) : p.toFixed(6)
}

const formatMarketCap = (marketCap) => {
  const mcap = parseFloat(marketCap) || 0
  if (mcap >= 1e6) return '$' + (mcap / 1e6).toFixed(1) + 'M'
  if (mcap >= 1e3) return '$' + (mcap / 1e3).toFixed(1) + 'K'
  return '$' + mcap.toFixed(0)
}

onMounted(() => {
  refreshMemeData()
  memeRefreshTimer = setInterval(refreshMemeData, 30000)
})

onUnmounted(() => {
  if (memeRefreshTimer) {
    clearInterval(memeRefreshTimer)
  }
})
</script>

<style scoped>
.meme-view {
  padding: 0;
}

.meme-header {
  background: #0d1117;
  border: 1px solid #161b22;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.meme-stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.meme-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meme-stat-label {
  font-size: 0.65rem;
  color: #6b7280;
}

.meme-stat-value {
  font-size: 0.9rem;
  color: #e5e7eb;
  font-weight: 600;
}

.meme-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.meme-controls select,
.meme-controls input {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 4px;
  color: #e2e8f0;
  padding: 3px 8px;
  font-size: 0.72rem;
}

.meme-controls input {
  width: 140px;
}

.meme-loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.meme-error {
  text-align: center;
  padding: 20px;
  color: #f87171;
}

.meme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.meme-card {
  background: #0d1117;
  border: 1px solid #161b22;
  border-radius: 8px;
  padding: 12px;
  transition: border-color 0.2s;
  cursor: pointer;
}

.meme-card:hover {
  border-color: #6366f1;
}

.meme-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.meme-card-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}

.meme-card-sym {
  font-size: 0.72rem;
  color: #a5b4fc;
}

.meme-card-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #1f2937;
}

.meme-card-price {
  font-size: 0.78rem;
  color: #d1d5db;
  margin-bottom: 4px;
}

.meme-card-mcap {
  font-size: 0.72rem;
  color: #6b7280;
  margin-bottom: 6px;
}

.meme-card-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #4b5563;
  margin-bottom: 2px;
}

.meme-card-row span:last-child {
  color: #9ca3af;
}

.risk-honor {
  color: #22c55e;
  font-weight: 600;
}

.risk-risk {
  color: #f87171;
  font-weight: 600;
}

.bonded {
  color: #22c55e;
}

.bonded-none {
  color: #6b7280;
}
</style>