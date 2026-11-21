import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ProfileView from '../Profile/ProfileView.vue'
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

describe('ProfileView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
    pushMock.mockClear()
  })

  const mockUser = {
    id: 1,
    email: 'arnaud@famylist.fr',
    firstName: 'Arnaud',
    lastName: 'Guevaer',
    roles: ['ROLE_USER'],
    createdAt: '2026-11-15T10:00:00Z',
  }

  const createWrapper = () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    return mount(ProfileView, {
      global: {
        stubs: {
          'router-link': {
            template: '<a><slot /></a>',
          },
        },
      },
    })
  }

  it('renders user profile informations with initials and formatted date', () => {
    const wrapper = createWrapper()

    // Vérifie l'avatar avec les initiales "AG"
    const avatar = wrapper.find('.profile-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.text()).toBe('AG')

    // Vérifie le nom complet
    const name = wrapper.find('.profile-name')
    expect(name.text()).toContain('Arnaud Guevaer')

    // Vérifie les champs pré-remplis
    const firstNameInput = wrapper.find<HTMLInputElement>('#profile-first-name')
    const lastNameInput = wrapper.find<HTMLInputElement>('#profile-last-name')
    const emailInput = wrapper.find<HTMLInputElement>('#profile-email')

    expect(firstNameInput.element.value).toBe('Arnaud')
    expect(lastNameInput.element.value).toBe('Guevaer')
    expect(emailInput.element.value).toBe('arnaud@famylist.fr')

    // Vérifie la date d'inscription
    const dateText = wrapper.find('.profile-created-at')
    expect(dateText.exists()).toBe(true)
    expect(dateText.text()).toContain('15 novembre 2026')

    // Vérifie que le mot de passe est masqué
    const dots = wrapper.find('.security-card__dots')
    expect(dots.text()).toBe('••••••••••••')
  })

  it('disables save button when no changes are made and enables it on input change', async () => {
    const wrapper = createWrapper()
    const submitBtn = wrapper.find('button[type="submit"]')

    // Au chargement initial, pas de modification -> bouton désactivé
    expect(submitBtn.attributes('disabled')).toBeDefined()

    // Modification du prénom -> bouton activé
    await wrapper.find('#profile-first-name').setValue('Arnaud-Modifie')
    expect(submitBtn.attributes('disabled')).toBeUndefined()

    // Rétablissement de la valeur initiale -> bouton à nouveau désactivé
    await wrapper.find('#profile-first-name').setValue('Arnaud')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('validates client-side inputs when submitting invalid fields', async () => {
    const wrapper = createWrapper()

    await wrapper.find('#profile-first-name').setValue('A')
    await wrapper.find('#profile-last-name').setValue('')
    await wrapper.find('#profile-email').setValue('email-invalide')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#first-name-error').text()).toBe('Le prénom doit contenir au moins 2 caractères.')
    expect(wrapper.find('#last-name-error').text()).toBe('Le nom doit contenir au moins 2 caractères.')
    expect(wrapper.find('#profile-email-error').text()).toBe('Veuillez saisir une adresse email valide.')
  })

  it('submits updated profile data and displays success alert', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    const updateSpy = vi.spyOn(authStore, 'updateProfile').mockResolvedValue({
      success: true,
      message: 'Vos informations ont été mises à jour avec succès.',
    })

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.find('#profile-first-name').setValue('Arnaud-Nouveau')
    await wrapper.find('#profile-last-name').setValue('Guevaer-Nouveau')
    await wrapper.find('#profile-email').setValue('arnaud.nouveau@famylist.fr')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith({
      firstName: 'Arnaud-Nouveau',
      lastName: 'Guevaer-Nouveau',
      email: 'arnaud.nouveau@famylist.fr',
    })

    const successAlert = wrapper.find('#profile-success-alert')
    expect(successAlert.exists()).toBe(true)
    expect(successAlert.text()).toBe('Vos informations ont été mises à jour avec succès.')
  })

  it('displays field errors when server rejects duplicate email', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    vi.spyOn(authStore, 'updateProfile').mockResolvedValue({
      success: false,
      message: 'Cette adresse email est déjà utilisée.',
      errors: {
        email: ['Cette adresse email est déjà utilisée.'],
      },
    })

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    await wrapper.find('#profile-email').setValue('existant@famylist.fr')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const emailError = wrapper.find('#profile-email-error')
    expect(emailError.exists()).toBe(true)
    expect(emailError.text()).toBe('Cette adresse email est déjà utilisée.')
  })

  it('toggles password change form when clicking Modifier mon mot de passe and Annuler', async () => {
    const wrapper = createWrapper()

    expect(wrapper.find('.security-card').exists()).toBe(true)
    expect(wrapper.find('.password-form').exists()).toBe(false)

    // Ouvrir le formulaire
    await wrapper.find('.security-card__btn-edit').trigger('click')
    expect(wrapper.find('.password-form').exists()).toBe(true)
    expect(wrapper.find('.security-card').exists()).toBe(false)

    // Annuler
    await wrapper.find('.btn-cancel').trigger('click')
    expect(wrapper.find('.password-form').exists()).toBe(false)
    expect(wrapper.find('.security-card').exists()).toBe(true)
  })

  it('validates password form fields on empty or non-matching inputs', async () => {
    const wrapper = createWrapper()

    // Ouvrir le formulaire
    await wrapper.find('.security-card__btn-edit').trigger('click')

    // Soumettre le formulaire vide
    await wrapper.find('form.password-form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#current-password-error').text()).toBe('Le mot de passe actuel est obligatoire.')
    expect(wrapper.find('#new-password-error').text()).toBe('Le mot de passe ne respecte pas tous les critères de sécurité.')
    expect(wrapper.find('#confirm-password-error').text()).toBe('Veuillez confirmer votre nouveau mot de passe.')

    // Remplir un nouveau mot de passe valide mais avec confirmation différente
    await wrapper.find('#current-password').setValue('AncienPassword123!')
    await wrapper.find('#new-password').setValue('NouveauSecret123!')
    await wrapper.find('#confirm-password').setValue('AutreChose456!')

    await wrapper.find('form.password-form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#confirm-password-error').text()).toBe('Les mots de passe ne correspondent pas.')
  })

  it('submits valid password change and displays success alert while closing form', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    const changePasswordSpy = vi.spyOn(authStore, 'changePassword').mockResolvedValue({
      success: true,
      message: 'Votre mot de passe a été modifié avec succès.',
    })

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    // Ouvrir le formulaire
    await wrapper.find('.security-card__btn-edit').trigger('click')

    // Remplir les champs conformes
    await wrapper.find('#current-password').setValue('AncienPassword123!')
    await wrapper.find('#new-password').setValue('NouveauSecret123!')
    await wrapper.find('#confirm-password').setValue('NouveauSecret123!')

    await wrapper.find('form.password-form').trigger('submit.prevent')
    await flushPromises()

    expect(changePasswordSpy).toHaveBeenCalledWith('AncienPassword123!', 'NouveauSecret123!')

    // Formulaire refermé et message de succès visible
    expect(wrapper.find('.password-form').exists()).toBe(false)
    const successAlert = wrapper.find('#password-success-alert')
    expect(successAlert.exists()).toBe(true)
    expect(successAlert.text()).toBe('Votre mot de passe a été modifié avec succès.')
  })

  it('displays server error when changePassword fails with incorrect current password', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    vi.spyOn(authStore, 'changePassword').mockResolvedValue({
      success: false,
      message: 'Le mot de passe actuel est incorrect.',
      errors: {
        currentPassword: ['Le mot de passe actuel est incorrect.'],
      },
    })

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    // Ouvrir le formulaire
    await wrapper.find('.security-card__btn-edit').trigger('click')

    await wrapper.find('#current-password').setValue('MauvaisPassword123!')
    await wrapper.find('#new-password').setValue('NouveauSecret123!')
    await wrapper.find('#confirm-password').setValue('NouveauSecret123!')

    await wrapper.find('form.password-form').trigger('submit.prevent')
    await flushPromises()

    // Formulaire toujours ouvert et erreur affichée
    expect(wrapper.find('.password-form').exists()).toBe(true)
    const currentPasswordError = wrapper.find('#current-password-error')
    expect(currentPasswordError.exists()).toBe(true)
    expect(currentPasswordError.text()).toBe('Le mot de passe actuel est incorrect.')
  })

  it('resets uncommitted profile inputs and clears errors when opening password form', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }

    vi.spyOn(authStore, 'updateProfile').mockResolvedValue({
      success: false,
      message: 'Cette adresse email est déjà utilisée.',
      errors: {
        email: ['Cette adresse email est déjà utilisée.'],
      },
    })

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    // Modifier l'email et soumettre
    await wrapper.find('#profile-email').setValue('invalide@famylist.fr')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.find('#profile-email-error').exists()).toBe(true)

    // Ouvrir le formulaire de changement de mot de passe
    await wrapper.find('.security-card__btn-edit').trigger('click')
    await flushPromises()

    // Vérifie que l'erreur est effacée et le champ rétabli à l'email actuel de l'utilisateur
    expect(wrapper.find('#profile-email-error').exists()).toBe(false)
    const emailInput = wrapper.find<HTMLInputElement>('#profile-email')
    expect(emailInput.element.value).toBe(mockUser.email)
  })

  it('handles logout and redirects to homepage', async () => {
    const authStore = useAuthStore()
    authStore.user = { ...mockUser }
    const logoutSpy = vi.spyOn(authStore, 'logout').mockResolvedValue()

    const wrapper = mount(ProfileView, {
      global: {
        stubs: {
          'router-link': { template: '<a><slot /></a>' },
        },
      },
    })

    const logoutBtn = wrapper.findAll('.navbar__action-btn').find(btn => btn.text().includes('Se déconnecter'))
    expect(logoutBtn).toBeDefined()
    await logoutBtn?.trigger('click')
    await flushPromises()

    expect(logoutSpy).toHaveBeenCalledTimes(1)
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})
