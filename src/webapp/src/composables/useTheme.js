import { ref, watch, onMounted } from 'vue'
import { getLogger } from '../utils/logger'

const logger = getLogger('theme')
const THEME_KEY = 'app_theme'
const VALID_THEMES = ['dark', 'light', 'auto']

const theme = ref('auto')

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

function getEffectiveTheme() {
  if (theme.value === 'auto') {
    return getSystemTheme()
  }
  return theme.value
}

function setTheme(newTheme) {
  if (!VALID_THEMES.includes(newTheme)) {
    logger.warn(`Invalid theme: ${newTheme}. Valid themes: ${VALID_THEMES.join(', ')}`)
    return
  }
  
  theme.value = newTheme
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, newTheme)
  }
  
  applyTheme()
}

function applyTheme() {
  if (typeof document !== 'undefined') {
    const effectiveTheme = getEffectiveTheme()
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }
}

function toggleTheme() {
  const currentEffective = getEffectiveTheme()
  const newTheme = currentEffective === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

function initTheme() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved && VALID_THEMES.includes(saved)) {
      theme.value = saved
    }
  }
  
  applyTheme()
  
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }
}

watch(theme, () => {
  applyTheme()
})

export function useTheme() {
  onMounted(() => {
    initTheme()
  })
  
  return {
    theme,
    effectiveTheme: getEffectiveTheme(),
    setTheme,
    toggleTheme,
    isDark: () => getEffectiveTheme() === 'dark',
    isLight: () => getEffectiveTheme() === 'light',
    isAuto: () => theme.value === 'auto'
  }
}
