import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.restoreAllMocks()
  })

  it('has correct initial default state', () => {
    const authStore = useAuthStore()

    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.isLoading).toBe(false)
    expect(authStore.isInitialized).toBe(false)
  })

  describe('fetchCurrentUser', () => {
    it('restores authenticated user session on HTTP 200 with credentials include', async () => {
      const mockUser = {
        id: 1,
        email: 'arnaud@famylist.fr',
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        roles: ['ROLE_USER'],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ user: mockUser }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.fetchCurrentUser()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/api/me')
      expect(options.method).toBe('GET')
      expect(options.credentials).toBe('include')

      expect(result).toEqual(mockUser)
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.isInitialized).toBe(true)
      expect(authStore.isLoading).toBe(false)
    })

    it('sets user to null on HTTP 401 unauthenticated response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Non authentifié.' }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.fetchCurrentUser()

      expect(result).toBeNull()
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.isInitialized).toBe(true)
    })

    it('handles network failure gracefully without crashing', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.fetchCurrentUser()

      expect(result).toBeNull()
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.isInitialized).toBe(true)
    })
  })

  describe('login', () => {
    it('authenticates user on HTTP 200 with Arnaud Guevaer credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'arnaud@famylist.fr',
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        roles: ['ROLE_USER'],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Connexion réussie.',
          user: mockUser,
        }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.login('arnaud@famylist.fr', 'Password123!')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/api/login')
      expect(options.method).toBe('POST')
      expect(options.credentials).toBe('include')
      expect(JSON.parse(options.body as string)).toEqual({
        email: 'arnaud@famylist.fr',
        password: 'Password123!',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Connexion réussie.')
      expect(authStore.user).toEqual(mockUser)
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('returns failure message on invalid credentials HTTP 401', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Identifiants invalides.' }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.login('arnaud@famylist.fr', 'MauvaisMotDePasse')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Identifiants invalides.')
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })

    it('returns generic error when server is unreachable', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Connexion refused'))
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.login('arnaud@famylist.fr', 'Password123!')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Impossible de contacter le serveur')
      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('sends PATCH /api/me with credentials include and updates user state on HTTP 200', async () => {
      const updatedUser = {
        id: 1,
        email: 'arnaud.modifie@famylist.fr',
        firstName: 'Arnaud-Modifie',
        lastName: 'Guevaer-Modifie',
        roles: ['ROLE_USER'],
      }

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Profil mis à jour avec succès.',
          user: updatedUser,
        }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      authStore.user = {
        id: 1,
        email: 'arnaud@famylist.fr',
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        roles: ['ROLE_USER'],
      }

      const result = await authStore.updateProfile({
        firstName: 'Arnaud-Modifie',
        lastName: 'Guevaer-Modifie',
        email: 'arnaud.modifie@famylist.fr',
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/api/me')
      expect(options.method).toBe('PATCH')
      expect(options.credentials).toBe('include')
      expect(JSON.parse(options.body as string)).toEqual({
        firstName: 'Arnaud-Modifie',
        lastName: 'Guevaer-Modifie',
        email: 'arnaud.modifie@famylist.fr',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Profil mis à jour avec succès.')
      expect(authStore.user).toEqual(updatedUser)
    })

    it('returns validation errors on duplicate email HTTP 422', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Cette adresse email est déjà utilisée.',
          errors: { email: ['Cette adresse email est déjà utilisée.'] },
        }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.updateProfile({
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        email: 'existant@famylist.fr',
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe('Cette adresse email est déjà utilisée.')
      expect(result.errors).toEqual({ email: ['Cette adresse email est déjà utilisée.'] })
    })

    it('handles network failure gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.updateProfile({
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        email: 'arnaud@famylist.fr',
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('Impossible de contacter le serveur')
    })
  })

  describe('changePassword', () => {
    it('sends POST /api/me/password with credentials include and returns success on HTTP 200', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          message: 'Mot de passe modifié avec succès.',
        }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.changePassword('AncienMotDePasse123!', 'NouveauSuperMotDePasse456!')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/api/me/password')
      expect(options.method).toBe('POST')
      expect(options.credentials).toBe('include')
      expect(JSON.parse(options.body as string)).toEqual({
        currentPassword: 'AncienMotDePasse123!',
        newPassword: 'NouveauSuperMotDePasse456!',
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('Mot de passe modifié avec succès.')
    })

    it('returns validation errors on wrong current password HTTP 422', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Le mot de passe actuel est incorrect.',
          errors: {
            currentPassword: ['Le mot de passe actuel est incorrect.'],
          },
        }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.changePassword('MauvaisMdp', 'NouveauSuperMotDePasse456!')

      expect(result.success).toBe(false)
      expect(result.message).toBe('Le mot de passe actuel est incorrect.')
      expect(result.errors).toEqual({
        currentPassword: ['Le mot de passe actuel est incorrect.'],
      })
    })

    it('handles network failure gracefully', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      const result = await authStore.changePassword('AncienMotDePasse123!', 'NouveauSuperMotDePasse456!')

      expect(result.success).toBe(false)
      expect(result.message).toContain('Impossible de contacter le serveur')
    })
  })

  describe('logout', () => {
    it('calls /api/logout with credentials include and clears user session', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Déconnexion réussie.' }),
      })
      globalThis.fetch = fetchMock

      const authStore = useAuthStore()
      authStore.user = {
        id: 1,
        email: 'arnaud@famylist.fr',
        firstName: 'Arnaud',
        lastName: 'Guevaer',
        roles: ['ROLE_USER'],
      }

      await authStore.logout()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
      expect(url).toContain('/api/logout')
      expect(options.method).toBe('POST')
      expect(options.credentials).toBe('include')

      expect(authStore.user).toBeNull()
      expect(authStore.isAuthenticated).toBe(false)
    })
  })
})
