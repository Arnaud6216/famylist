import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LoginView from '../LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const pushMock = vi.fn()
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: pushMock,
    }),
  }
})

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    pushMock.mockClear()
  })

  const createWrapper = () => {
    return mount(LoginView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    })
  }

  it('renders login form inputs with accessible labels and submit button', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)

    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.exists()).toBe(true)
    expect(submitBtn.text()).toContain('Se connecter')

    const toggleBtn = wrapper.find('.form-group__toggle-password')
    expect(toggleBtn.exists()).toBe(true)
    expect(toggleBtn.text()).toBe('Afficher')
  })

  it('toggles password input type between password and text', async () => {
    const wrapper = createWrapper()
    const passwordInput = wrapper.find<HTMLInputElement>('#password')
    const toggleBtn = wrapper.find('.form-group__toggle-password')

    expect(passwordInput.attributes('type')).toBe('password')

    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('text')
    expect(toggleBtn.text()).toBe('Masquer')

    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('password')
    expect(toggleBtn.text()).toBe('Afficher')
  })

  it('validates client-side inputs when submitting empty form', async () => {
    const wrapper = createWrapper()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#email-error').text()).toBe('Veuillez renseigner votre adresse email.')
    expect(wrapper.find('#password-error').text()).toBe('Veuillez saisir votre mot de passe.')
  })

  it('clears error messages when user types in inputs', async () => {
    const wrapper = createWrapper()

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#email-error').exists()).toBe(true)

    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    expect(wrapper.find('#email-error').exists()).toBe(false)
  })

  it('submits credentials and redirects to dashboard on success with Arnaud Guevaer', async () => {
    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
      success: true,
      message: 'Connexion réussie.',
    })

    const wrapper = createWrapper()

    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    await wrapper.find('#password').setValue('Password123!')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('arnaud@famylist.fr', 'Password123!')
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('displays global error alert on invalid credentials', async () => {
    const authStore = useAuthStore()
    vi.spyOn(authStore, 'login').mockResolvedValue({
      success: false,
      message: 'Identifiants invalides.',
    })

    const wrapper = createWrapper()

    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    await wrapper.find('#password').setValue('MauvaisMotDePasse')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const errorAlert = wrapper.find('#login-global-error')
    expect(errorAlert.exists()).toBe(true)
    expect(errorAlert.text()).toBe('Identifiants invalides.')
    expect(pushMock).not.toHaveBeenCalled()
  })
})
