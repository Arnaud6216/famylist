import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserProfile {
  id: number
  email: string
  firstName: string
  lastName: string
  roles: string[]
  createdAt?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isLoading = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)

  const isAuthenticated = computed(() => user.value !== null)

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080'

  async function fetchCurrentUser(): Promise<UserProfile | null> {
    isLoading.value = true
    try {
      const response = await fetch(`${apiBaseUrl}/api/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        const data = (await response.json()) as { user: UserProfile }
        user.value = data.user
        return data.user
      }

      user.value = null
      return null
    } catch {
      user.value = null
      return null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    isLoading.value = true
    try {
      const response = await fetch(`${apiBaseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = (await response.json()) as { message: string; user: UserProfile }
        user.value = data.user
        return { success: true, message: data.message }
      }

      const errorData = (await response.json().catch(() => ({}))) as { message?: string }
      return {
        success: false,
        message: errorData.message || 'Identifiants invalides.',
      }
    } catch {
      return {
        success: false,
        message: 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.',
      }
    } finally {
      isLoading.value = false
    }
  }

  async function updateProfile(data: {
    firstName: string
    lastName: string
    email: string
  }): Promise<{ success: boolean; message?: string; errors?: Record<string, string[] | string> }> {
    isLoading.value = true
    try {
      const response = await fetch(`${apiBaseUrl}/api/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const responseData = (await response.json()) as { message: string; user: UserProfile }
        user.value = responseData.user
        return { success: true, message: responseData.message }
      }

      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string
        errors?: Record<string, string[] | string>
      }

      return {
        success: false,
        message: errorData.message || 'Données non conformes.',
        errors: errorData.errors,
      }
    } catch {
      return {
        success: false,
        message: 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.',
      }
    } finally {
      isLoading.value = false
    }
  }

  async function changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; errors?: Record<string, string[] | string> }> {
    isLoading.value = true
    try {
      const response = await fetch(`${apiBaseUrl}/api/me/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (response.ok) {
        const data = (await response.json()) as { message: string }
        return { success: true, message: data.message }
      }

      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string
        errors?: Record<string, string[] | string>
      }

      return {
        success: false,
        message: errorData.message || 'Données non conformes.',
        errors: errorData.errors,
      }
    } catch {
      return {
        success: false,
        message: 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.',
      }
    } finally {
      isLoading.value = false
    }
  }

  async function logout(): Promise<void> {
    isLoading.value = true
    try {
      await fetch(`${apiBaseUrl}/api/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        credentials: 'include',
      })
    } finally {
      user.value = null
      isLoading.value = false
    }
  }

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    fetchCurrentUser,
    login,
    updateProfile,
    changePassword,
    logout,
  }
})
