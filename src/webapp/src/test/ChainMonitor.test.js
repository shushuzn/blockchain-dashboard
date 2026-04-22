import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChainMonitor from '../components/ChainMonitor.vue'

vi.mock('../stores/chain', () => ({
  useChainStore: () => ({
    chains: [
      { id: 'ethereum', name: 'Ethereum', color: '#627eea', hasBlob: true, hasMEV: true },
      { id: 'arbitrum', name: 'Arbitrum', color: '#28a0f0', hasBlob: true, hasMEV: false }
    ],
    ethPrice: '$3,456.78',
    ethChange: 2.34,
    btcPrice: '$67,890',
    lastUpdated: '12:34:56',
    fetchChainData: vi.fn().mockResolvedValue({
      blockFmt: '19,234,567',
      blockSub: '12 sec ago',
      gasFmt: '15.2',
      gas: 15.2,
      baseFeeFmt: '32.1',
      baseFee: 32.1,
      blobFeeFmt: '0.001',
      blobFee: 0.001,
      utilPctFmt: '45.2',
      utilPct: 45.2,
      supply: '120.5',
      mcap: '$416.2B',
      mevData: { mevReward: 1.5e17, mevShare: '28%' }
    })
  })
}))

vi.mock('../stores/config', () => ({
  useConfigStore: () => ({
    alertEnabled: true,
    thresholds: {
      ethereum: { gas: 50, baseFee: 50, blobFee: 0.1 }
    },
    alertLog: [
      { time: '12:30', chain: 'ETH', metric: 'Base Fee', value: '55', threshold: '50' }
    ]
  })
}))

describe('ChainMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays chain tabs', () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    const tabs = wrapper.findAll('.chain-tab')
    expect(tabs.length).toBeGreaterThan(0)
  })

  it('displays ETH price', () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    expect(wrapper.text()).toContain('$3,456.78')
  })

  it('displays chain data cards', async () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    await vi.waitFor(() => {
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  it('has refresh button', () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    const refreshBtn = wrapper.find('button')
    expect(refreshBtn.exists()).toBe(true)
  })

  it('has alerts button', () => {
    const wrapper = mount(ChainMonitor, {
      global: {
        stubs: { AlertModal: true }
      }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
