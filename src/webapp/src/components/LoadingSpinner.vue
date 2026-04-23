<template>
  <div class="loading-overlay" v-if="fullscreen" :class="{ 'dark-overlay': overlay }">
    <div class="spinner-container">
      <div class="spinner"></div>
      <p v-if="text">{{ text }}</p>
    </div>
  </div>
  <div v-else class="loading-inline">
    <div class="spinner-sm"></div>
    <span v-if="text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  fullscreen: { type: Boolean, default: false },
  overlay: { type: Boolean, default: true },
  text: { type: String, default: '加载中...' }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.9);
  z-index: 9999;
}
.dark-overlay { background: rgba(0,0,0,0.7); }
.spinner-container { text-align: center; }
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary, #e0e0e0);
  border-top-color: var(--accent-primary, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-inline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-primary, #e0e0e0);
  border-top-color: var(--accent-primary, #6366f1);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>