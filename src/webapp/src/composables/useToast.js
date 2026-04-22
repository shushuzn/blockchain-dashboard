import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

function addToast(message, type = 'error', duration = 5000) {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
  
  return id
}

function removeToast(id) {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

function getIcon(type) {
  const icons = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️'
  }
  return icons[type] || icons.info
}

export function useToast() {
  return {
    toasts,
    addToast,
    removeToast,
    getIcon,
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    success: (message, duration) => addToast(message, 'success', duration),
    info: (message, duration) => addToast(message, 'info', duration)
  }
}
