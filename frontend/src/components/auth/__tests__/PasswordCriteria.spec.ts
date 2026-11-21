import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordCriteria from '../PasswordCriteria/PasswordCriteria.vue'

describe('PasswordCriteria', () => {
  it('renders nothing when visible is false', () => {
    const wrapper = mount(PasswordCriteria, {
      props: {
        password: '',
        visible: false,
      },
    })

    expect(wrapper.find('.password-criteria').exists()).toBe(false)
  })

  it('renders all 5 criteria when visible is true', () => {
    const wrapper = mount(PasswordCriteria, {
      props: {
        password: '',
        visible: true,
      },
    })

    const items = wrapper.findAll('.password-criteria__item')
    expect(items.length).toBe(5)
    expect(wrapper.findAll('.password-criteria__item--valid').length).toBe(0)
  })

  it('dynamically marks matching criteria as valid', async () => {
    const wrapper = mount(PasswordCriteria, {
      props: {
        password: 'Ab1',
        visible: true,
      },
    })

    // Ab1 has uppercase (A), lowercase (b), digit (1) -> 3 valid, min length (3 < 12) & special char missing
    expect(wrapper.findAll('.password-criteria__item--valid').length).toBe(3)

    await wrapper.setProps({ password: 'SuperPassword123!' })
    expect(wrapper.findAll('.password-criteria__item--valid').length).toBe(5)
  })

  it('applies custom id prop for accessibility describedby association', () => {
    const wrapper = mount(PasswordCriteria, {
      props: {
        password: '',
        id: 'new-password-criteria',
      },
    })

    expect(wrapper.find('#new-password-criteria').exists()).toBe(true)
  })
})
