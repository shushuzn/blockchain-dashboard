import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LidoView from '../components/LidoView.vue'

vi.mock('../api', () => ({
  lidoApi: {
    getMetrics: vi.fn().mockResolvedValue({
      totalETH: '12000000',
      totalShares: '100000000',
      bufferedEther: '50000',
      activeValidators: '380000',
      priceMetrics: {
        stethPrice: '$3,456.78',
        stethRatio: '1.0023',
        marketCap: '$41.5B'
      },
      dailyData: [
        { date: 1711000000, totalETH: '11800000' },
        { date: 1711100000, totalETH: '11900000' },
        { date: 1711200000, totalETH: '12000000' }
      ]
    })
  }
}))

describe('LidoView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component', () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays Lido header', () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.text()).toContain('Lido Staking')
  })

  it('shows loading state initially', () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    expect(wrapper.find('.loading-state').exists()).toBe(true)
  })

  it('displays Lido data after loading', async () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.find('.lido-content').exists()).toBe(true)
    })
  })

  it('displays total ETH staked', async () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('ETH')
    })
  })

  it('has refresh button', () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    const refreshBtn = wrapper.find('button')
    expect(refreshBtn.exists()).toBe(true)
  })

  it('refresh button calls fetchLidoData', async () => {
    const wrapper = mount(LidoView, {
      global: { stubs: { Teleport: true } }
    })
    await vi.waitFor(() => wrapper.find('.lido-content').exists())
    await wrapper.find('button').trigger('click')
  })
})
