<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" :class="['toast', type]" role="alert">
        <div class="toast-icon">
          <span v-if="type === 'success'">✓</span>
          <span v-else-if="type === 'error'">✕</span>
          <span v-else-if="type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="toast-content">
          <strong v-if="title">{{ title }}</strong>
          <p>{{ message }}</p>
        </div>
        <button class="toast-close" @click="close">×</button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const message = ref('')
const type = ref('info')
const title = ref('')
let timeout = null

function show(msg, toastType = 'info', toastTitle = '', duration = 3000) {
  message.value = msg
  type.value = toastType
  title.value = toastTitle
  visible.value = true
  if (timeout) clearTimeout(timeout)
  if (duration > 0) {
    timeout = setTimeout(close, duration)
  }
}

function close() {
  visible.value = false
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
}

defineExpose({ show, close })
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: var(--card-bg, #fff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9999;
  max-width: 360px;
}
.toast.success { border-left: 4px solid #10b981; }
.toast.error { border-left: 4px solid #ef4444; }
.toast.warning { border-left: 4px solid #f59e0b; }
.toast.info { border-left: 4px solid #3b82f6; }
.toast-icon { font-size: 20px; }
.toast-content { flex: 1; }
.toast-content strong { display: block; margin-bottom: 4px; }
.toast-content p { margin: 0; font-size: 14px; }
.toast-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
}
.toast-close:hover { opacity: 1; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
</style>