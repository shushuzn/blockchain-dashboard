import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MemeView from '../components/MemeView.vue'

global.fetch = vi.fn()

describe('MemeView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders MemeView component', () => {
    const wrapper = mount(MemeView)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.meme-stats-row').exists()).toBe(true)
  })

  it('loads memes on mount', async () => {
    const mockMemes = [
      {
        memeCoin: {
          name: 'Test Meme',
          symbol: 'TEST',
          mint: '123',
          imageUri: 'https://example.com/image.jpg'
        },
        price: '0.0001',
        marketCap: '1000000',
        sniperRate: 50.5,
        holders: 1000,
        risk: 'honor'
      }
    ]
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMemes)
    })

    const wrapper = mount(MemeView)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.memeData.length).toBe(1)
  })

  it('displays loading state', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([])
    })

    const wrapper = mount(MemeView)
    expect(wrapper.vm.loading).toBe(true)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(wrapper.vm.loading).toBe(false)
  })

  it('renders memes with lazy loading', async () => {
    const mockMemes = [
      {
        memeCoin: {
          name: 'Test Meme',
          symbol: 'TEST',
          mint: '123',
          imageUri: 'https://example.com/image.jpg'
        },
        price: '0.0001',
        marketCap: '1000000',
        sniperRate: 50.5,
        holders: 1000,
        risk: 'honor'
      }
    ]
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMemes)
    })

    const wrapper = mount(MemeView)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const images = wrapper.findAll('img')
    expect(images.length).toBe(1)
    
    images.forEach(img => {
      expect(img.attributes('loading')).toBe('lazy')
    })
  })

  it('has refresh button', async () => {
    const mockMemes = [
      {
        memeCoin: {
          name: 'Test Meme',
          symbol: 'TEST',
          mint: '123',
          imageUri: 'https://example.com/image.jpg'
        },
        price: '0.0001',
        marketCap: '1000000',
        sniperRate: 50.5,
        holders: 1000,
        risk: 'honor'
      }
    ]
    
    // First fetch for initial load
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockMemes)
    })

    const wrapper = mount(MemeView)
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Check if refresh button exists
    const refreshButton = wrapper.find('button')
    expect(refreshButton.exists()).toBe(true)
    expect(refreshButton.text()).toBe('Refresh')
  })
})
