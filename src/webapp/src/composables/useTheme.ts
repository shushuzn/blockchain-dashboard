import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { getLogger } from '../utils/logger'

const logger = getLogger('theme')
const THEME_KEY = 'app_theme'
const VALID_THEMES = ['dark', 'light', 'auto'] as const

type Theme = typeof VALID_THEMES[number]
type EffectiveTheme = 'dark' | 'light'

const theme = ref<Theme>('auto')
let mediaQuery: MediaQueryList | null = null

function getSystemTheme(): EffectiveTheme {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

function getEffectiveTheme(): EffectiveTheme {
  if (theme.value === 'auto') {
    return getSystemTheme()
  }
  return theme.value
}

function setTheme(newTheme: Theme) {
  if (!VALID_THEMES.includes(newTheme)) {
    logger.warn(`Invalid theme: ${newTheme}. Valid themes: ${VALID_THEMES.join(', ')}`)
    return
  }
  
  theme.value = newTheme
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, newTheme)
  }
  
  applyTheme()
  
  logger.info(`Theme changed to: ${newTheme}`, { effective: getEffectiveTheme() })
}

function applyTheme(animate = true) {
  if (typeof document !== 'undefined') {
    const effectiveTheme = getEffectiveTheme()
    
    if (animate) {
      document.documentElement.classList.add('theme-transitioning')
      requestAnimationFrame(() => {
        document.documentElement.setAttribute('data-theme', effectiveTheme)
        document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
        document.documentElement.classList.toggle('light', effectiveTheme === 'light')
        
        setTimeout(() => {
          document.documentElement.classList.remove('theme-transitioning')
        }, 300)
      })
    } else {
      document.documentElement.setAttribute('data-theme', effectiveTheme)
      document.documentElement.classList.toggle('dark', effectiveTheme === 'dark')
      document.documentElement.classList.toggle('light', effectiveTheme === 'light')
    }
  }
}

function toggleTheme() {
  const currentEffective = getEffectiveTheme()
  const newTheme: Theme = currentEffective === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
}

function handleMediaChange() {
  if (theme.value === 'auto') {
    applyTheme()
    logger.info('System theme changed', { theme: getEffectiveTheme() })
  }
}

function initTheme() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null
    if (saved && VALID_THEMES.includes(saved)) {
      theme.value = saved
    }
  }
  
  applyTheme()
  
  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleMediaChange)
  }
}

function cleanup() {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleMediaChange)
    mediaQuery = null
  }
}

watch(theme, () => {
  applyTheme()
})

export function useTheme() {
  onMounted(() => {
    initTheme()
  })
  
  onUnmounted(() => {
    cleanup()
  })
  
  const effectiveTheme = computed(() => getEffectiveTheme())
  const isDark = computed(() => effectiveTheme.value === 'dark')
  const isLight = computed(() => effectiveTheme.value === 'light')
  const isAuto = computed(() => theme.value === 'auto')
  
  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
    isAuto
  }
}

export type { Theme, EffectiveTheme }