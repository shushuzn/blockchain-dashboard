import { mount } from '@vue/test-utils'
import TestComponent from '@/components/TestComponent.vue'

describe('TestComponent', () => {
  test('renders correctly', () => {
    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Hello Vue')
    expect(wrapper.text()).toContain('Count: 0')
  })

  test('increments count when button is clicked', async () => {
    const wrapper = mount(TestComponent)
    const button = wrapper.find('button')
    
    await button.trigger('click')
    expect(wrapper.text()).toContain('Count: 1')
    
    await button.trigger('click')
    expect(wrapper.text()).toContain('Count: 2')
  })
})
