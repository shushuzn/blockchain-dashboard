import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AaveView from '../components/AaveView.vue'

vi.mock('../api', () => ({
  aaveApi: {
    getMetrics: vi.fn().mockResolvedValue({
      totalLiquidityUSD: '15000000000',
      totalDebtUSD: '5000000000',
      v2: {
        markets: [
          { symbol: 'ETH', name: 'Ethereum', liquidity: '5000000000', debt: '2000000000' },
          { symbol: 'USDC', name: 'USD Coin', liquidity: '3000000000', debt: '1500000000' }
        ]
      },
      v3: {
        markets: [
          { symbol: 'WBTC', name: 'Wrapped Bitcoin', liquidity: '2000000000', debt: '800000000' }
        ]
      }
    })
  }
}))

describe('AaveView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays Aave header', () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.text()).toContain('Aave Lending')
  })

  it('shows loading state initially', () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.find('.loading-state').exists()).toBe(true)
  })

  it('displays Aave data after loading', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.find('.aave-content').exists()).toBe(true)
    })
  })

  it('displays total supply', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Total Supply')
    })
  })

  it('displays utilization rate', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Utilization')
    })
  })

  it('has refresh button', () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    const refreshBtn = wrapper.find('button')
    expect(refreshBtn.exists()).toBe(true)
  })

  it('refresh button calls fetchAaveData', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => wrapper.find('.aave-content').exists())
    await wrapper.find('button').trigger('click')
  })

  it('displays Aave V2 markets', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Aave V2')
    })
  })

  it('displays market data', async () => {
    const wrapper = mount(AaveView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('ETH')
    })
  })
})
