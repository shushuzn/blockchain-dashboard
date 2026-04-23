import { createI18n } from 'vue-i18n';
import en from './en.js';
import zh from './zh.js';

const messages = { en, zh };

function getDefaultLocale() {
  if (typeof navigator !== 'undefined') {
    const saved = localStorage.getItem('app_locale');
    if (saved && (saved === 'en' || saved === 'zh')) {
      return saved;
    }
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'zh' ? 'zh' : 'en';
  }
  return 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en',
  messages,
});

export function setLocale(locale) {
  if (locale === 'en' || locale === 'zh') {
    i18n.global.locale.value = locale;
    localStorage.setItem('app_locale', locale);
  }
}

export function getLocale() {
  return i18n.global.locale.value;
}
