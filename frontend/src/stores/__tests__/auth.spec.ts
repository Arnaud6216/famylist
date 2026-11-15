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
