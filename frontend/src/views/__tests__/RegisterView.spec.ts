import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RegisterView from '../Register/RegisterView.vue'
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

describe('RegisterView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    pushMock.mockClear()
  })

  const createWrapper = () => {
    return mount(RegisterView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    })
  }

  it('renders all registration form inputs with accessible labels', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('#firstName').exists()).toBe(true)
    expect(wrapper.find('#lastName').exists()).toBe(true)
    expect(wrapper.find('#email').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)

    // Vérifie le bouton d'action principal
    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.exists()).toBe(true)
    expect(submitBtn.text()).toContain("S'inscrire")
  })

  it('updates password security criteria indicators dynamically', async () => {
    const wrapper = createWrapper()
    const passwordInput = wrapper.find('#password')

    // Initialement le focus déclenche l'affichage des critères
    await passwordInput.trigger('focus')
    expect(wrapper.findAll('.password-criteria__item--valid').length).toBe(0)

    // Saisie d'un mot de passe conforme de 12 caractères avec majuscule, minuscule, chiffre et caractère spécial
    await passwordInput.setValue('Password123!')

    const validCriteria = wrapper.findAll('.password-criteria__item--valid')
    expect(validCriteria.length).toBe(5)
  })

  it('displays client validation errors when submitting an invalid form', async () => {
    const wrapper = createWrapper()

    await wrapper.find('#firstName').setValue('A')
    await wrapper.find('#lastName').setValue('G')
    await wrapper.find('#email').setValue('email-invalide')
    await wrapper.find('#password').setValue('court')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#firstName-error').text()).toBe('Le prénom doit contenir au moins 2 caractères.')
    expect(wrapper.find('#lastName-error').text()).toBe('Le nom doit contenir au moins 2 caractères.')
    expect(wrapper.find('#email-error').text()).toBe('Veuillez saisir une adresse email valide.')
    expect(wrapper.find('#password-error').text()).toBe('Le mot de passe ne respecte pas tous les critères de sécurité.')
  })

  it('toggles password visibility when clicking toggle button', async () => {
    const wrapper = createWrapper()
    const passwordInput = wrapper.find<HTMLInputElement>('#password')
    const toggleBtn = wrapper.find('.form-group__toggle-password')

    expect(passwordInput.attributes('type')).toBe('password')

    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('text')

    await toggleBtn.trigger('click')
    expect(passwordInput.attributes('type')).toBe('password')
  })

  it('handles successful registration with Arnaud Guevaer (HTTP 201)', async () => {
    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
      success: true,
      message: 'Connexion réussie.',
    })

    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({
        message: 'Inscription réussie.',
        user: {
          id: 1,
          email: 'arnaud@famylist.fr',
          firstName: 'Arnaud',
          lastName: 'Guevaer',
        },
      }),
    })
    globalThis.fetch = fetchMock

    const wrapper = createWrapper()

    await wrapper.find('#firstName').setValue('Arnaud')
    await wrapper.find('#lastName').setValue('Guevaer')
    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    await wrapper.find('#password').setValue('Password123!')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [calledUrl, calledOptions] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(calledUrl).toContain('/api/register')
    expect(calledOptions.method).toBe('POST')
    expect(JSON.parse(calledOptions.body as string)).toEqual({
      firstName: 'Arnaud',
      lastName: 'Guevaer',
      email: 'arnaud@famylist.fr',
      password: 'Password123!',
    })

    // Vérifie l'authentification automatique immédiate et la redirection vers l'accueil
    expect(loginSpy).toHaveBeenCalledWith('arnaud@famylist.fr', 'Password123!')
    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('redirects to /login when auto-login fails after HTTP 201 registration', async () => {
    const authStore = useAuthStore()
    const loginSpy = vi.spyOn(authStore, 'login').mockResolvedValue({
      success: false,
      message: 'Erreur de connexion.',
    })

    const fetchMock = vi.fn().mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({
        message: 'Inscription réussie.',
      }),
    })
    globalThis.fetch = fetchMock

    const wrapper = createWrapper()

    await wrapper.find('#firstName').setValue('Arnaud')
    await wrapper.find('#lastName').setValue('Guevaer')
    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    await wrapper.find('#password').setValue('Password123!')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(loginSpy).toHaveBeenCalledWith('arnaud@famylist.fr', 'Password123!')
    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('displays duplicate email error from backend (HTTP 422)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 422,
      ok: false,
      json: async () => ({
        message: 'Cette adresse email est déjà utilisée.',
        errors: {
          email: ['Cette adresse email est déjà utilisée.'],
        },
      }),
    })
    globalThis.fetch = fetchMock

    const wrapper = createWrapper()

    await wrapper.find('#firstName').setValue('Arnaud')
    await wrapper.find('#lastName').setValue('Guevaer')
    await wrapper.find('#email').setValue('arnaud@famylist.fr')
    await wrapper.find('#password').setValue('Password123!')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const emailError = wrapper.find('#email-error')
    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toBe('Cette adresse email est déjà utilisée.')
  })
})
