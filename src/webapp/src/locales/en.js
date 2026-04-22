export default {
  app: {
    title: 'Blockchain Dashboard',
    refresh: 'Refresh',
    settings: 'Settings',
    alerts: 'Alerts',
    monitor: 'Monitor',
    charts: 'Charts',
    dashboard: 'Dashboard',
    lido: 'Lido',
    aave: 'Aave'
  },
  chains: {
    ethereum: 'Ethereum',
    base: 'Base',
    arbitrum: 'Arbitrum',
    optimism: 'Optimism',
    solana: 'Solana',
    bsc: 'BSC',
    polygon: 'Polygon',
    zksync: 'zkSync Era',
    starknet: 'Starknet'
  },
  metrics: {
    ethPrice: 'ETH Price',
    btcPrice: 'BTC Price',
    change24h: '24h Change',
    lastUpdated: 'Updated',
    latestBlock: 'Latest Block',
    priorityFee: 'Priority Fee',
    baseFee: 'Base Fee',
    blobFee: 'Blob Fee',
    gasUtil: 'Gas Util',
    ethSupply: 'ETH Supply',
    ethMarketCap: 'ETH Market Cap',
    mevReward: 'MEV Reward'
  },
  settings: {
    title: 'Settings',
    appearance: 'Appearance',
    dark: 'Dark',
    light: 'Light',
    auto: 'Auto',
    dataRefresh: 'Data Refresh',
    refreshInterval: 'Auto Refresh Interval (seconds)',
    sampleInterval: 'History Sample Interval (minutes)',
    storage: 'Storage',
    historyData: 'History Data',
    alertLog: 'Alert Log',
    storageUsed: 'Storage Used',
    clearAllData: 'Clear All Data',
    dataManagement: 'Data Management',
    exportData: 'Export Data',
    importData: 'Import Data',
    about: 'About',
    version: 'Version',
    cancel: 'Cancel',
    save: 'Save'
  },
  alerts: {
    title: 'Alerts',
    enabled: 'Alerts Enabled',
    disabled: 'Alerts Disabled',
    test: 'Test Alert',
    threshold: 'Threshold',
    cooldown: 'Cooldown (minutes)',
    saveSuccess: 'Settings saved',
    saveFailed: 'Failed to save settings'
  },
  lido: {
    title: 'Lido Staking',
    totalETH: 'Total ETH Staked',
    bufferedETH: 'Buffered ETH',
    activeValidators: 'Active Validators',
    stETHPrice: 'stETH Price',
    stETHRatio: 'stETH/ETH',
    marketCap: 'Market Cap',
    history7d: '7-Day History',
    loading: 'Loading Lido data...',
    error: 'Failed to load Lido data'
  },
  aave: {
    title: 'Aave Lending',
    totalSupply: 'Total Supply',
    totalBorrowed: 'Total Borrowed',
    utilization: 'Utilization',
    loading: 'Loading Aave data...',
    error: 'Failed to load Aave data'
  },
  errors: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'An unexpected error occurred.'
  }
}
