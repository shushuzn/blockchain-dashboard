const en = {
  nav: { dashboard: 'Dashboard', settings: 'Settings', details: 'Details' },
  common: { loading: 'Loading...', error: 'Error', retry: 'Retry', refresh: 'Refresh' },
  dashboard: { title: 'Blockchain Dashboard', lastUpdated: 'Last updated', gasTracker: 'Gas Tracker' },
  chains: { ethereum: 'Ethereum', base: 'Base', arbitrum: 'Arbitrum', optimism: 'Optimism' },
  settings: { title: 'Settings', enableAlerts: 'Enable Alerts', save: 'Save' },
}

const zh = {
  nav: { dashboard: '仪表盘', settings: '设置', details: '详情' },
  common: { loading: '加载中...', error: '错误', retry: '重试', refresh: '刷新' },
  dashboard: { title: '区块链仪表盘', lastUpdated: '最后更新', gasTracker: 'Gas追踪器' },
  chains: { ethereum: '以太坊', base: 'Base', arbitrum: 'Arbitrum', optimism: 'Optimism' },
  settings: { title: '设置', enableAlerts: '启用告警', save: '保存' },
}

const ja = {
  nav: { dashboard: 'ダッシュボード', settings: '設定', details: '詳細' },
  common: { loading: '読み込み中...', error: 'エラー', retry: '再試行', refresh: '更新' },
  dashboard: { title: 'ブロックチェーンダッシュボード', lastUpdated: '最終更新', gasTracker: 'Gasトラッカー' },
  chains: { ethereum: 'イーサリアム', base: 'Base', arbitrum: 'Arbitrum', optimism: 'Optimism' },
  settings: { title: '設定', enableAlerts: 'アラートを有効にする', save: '保存' },
}

const ko = {
  nav: { dashboard: '대시보드', settings: '설정', details: '상세' },
  common: { loading: '로딩 중...', error: '오류', retry: '다시 시도', refresh: '새로 고침' },
  dashboard: { title: '블록체인 대시보드', lastUpdated: '마지막 업데이트', gasTracker: 'Gas 트래커' },
  chains: { ethereum: '이더리움', base: 'Base', arbitrum: 'Arbitrum', optimism: 'Optimism' },
  settings: { title: '설정', enableAlerts: '알림 활성화', save: '저장' },
}

const translations = { en, zh, ja, ko }

let currentLocale = 'en'

export function setLocale(locale) {
  if (translations[locale]) {
    currentLocale = locale
  }
}

export function t(key) {
  const keys = key.split('.')
  let value = translations[currentLocale]

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }

  return value || key
}

export default { setLocale, t }
