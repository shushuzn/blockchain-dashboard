import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import zh from '../locales/zh.json'
import ja from '../locales/ja.json'
import ko from '../locales/ko.json'

const messages = { en, zh, ja, ko }

const savedLocale = localStorage.getItem('mcm_locale') || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages,
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('mcm_locale', locale)
}

export default i18n
