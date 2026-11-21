<template>
  <AuthLayout
    title="Créer un compte"
    subtitle="Rejoignez FamyList gratuitement en quelques secondes."
  >
    <!-- Message d'erreur global (ex: serveur indisponible) -->
    <div
      v-if="globalError"
      class="auth-alert auth-alert--error"
      role="alert"
      aria-live="assertive"
    >
      {{ globalError }}
    </div>

    <form class="auth-form" novalidate @submit.prevent="handleSubmit">
      <!-- Ligne Prénom / Nom côte à côte -->
      <div class="form-row">
        <div class="form-group">
          <label for="firstName" class="form-group__label">
            Prénom <span class="form-group__required" aria-hidden="true">*</span>
          </label>
          <input
            id="firstName"
            v-model.trim="form.firstName"
            type="text"
            class="form-group__input"
            :class="{ 'form-group__input--error': !!fieldErrors.firstName }"
            placeholder="Ex : Arnaud"
            autocomplete="given-name"
            required
            :aria-invalid="!!fieldErrors.firstName"
            :aria-describedby="fieldErrors.firstName ? 'firstName-error' : undefined"
            @input="clearFieldError('firstName')"
          />
          <span
            v-if="fieldErrors.firstName"
            id="firstName-error"
            class="form-group__error"
            role="alert"
          >
            {{ fieldErrors.firstName }}
          </span>
        </div>

        <div class="form-group">
          <label for="lastName" class="form-group__label">
            Nom <span class="form-group__required" aria-hidden="true">*</span>
          </label>
          <input
            id="lastName"
            v-model.trim="form.lastName"
            type="text"
            class="form-group__input"
            :class="{ 'form-group__input--error': !!fieldErrors.lastName }"
            placeholder="Ex : Dupont"
            autocomplete="family-name"
            required
            :aria-invalid="!!fieldErrors.lastName"
            :aria-describedby="fieldErrors.lastName ? 'lastName-error' : undefined"
            @input="clearFieldError('lastName')"
          />
          <span
            v-if="fieldErrors.lastName"
            id="lastName-error"
            class="form-group__error"
            role="alert"
          >
            {{ fieldErrors.lastName }}
          </span>
        </div>
      </div>

      <!-- Adresse email -->
      <div class="form-group">
        <label for="email" class="form-group__label">
          Adresse email <span class="form-group__required" aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          v-model.trim="form.email"
          type="email"
          class="form-group__input"
          :class="{ 'form-group__input--error': !!fieldErrors.email }"
          placeholder="votre@email.com"
          autocomplete="email"
          required
          :aria-invalid="!!fieldErrors.email"
          :aria-describedby="fieldErrors.email ? 'email-error' : undefined"
          @input="clearFieldError('email')"
        />
        <span
          v-if="fieldErrors.email"
          id="email-error"
          class="form-group__error"
          role="alert"
        >
          {{ fieldErrors.email }}
        </span>
      </div>

      <!-- Mot de passe -->
      <div class="form-group">
        <div class="form-group__header">
          <label for="password" class="form-group__label">
            Mot de passe <span class="form-group__required" aria-hidden="true">*</span>
          </label>
          <button
            type="button"
            class="form-group__toggle-password"
            :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Masquer' : 'Afficher' }}
          </button>
        </div>
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          class="form-group__input"
          :class="{ 'form-group__input--error': !!fieldErrors.password }"
          placeholder="••••••••"
          autocomplete="new-password"
          required
          :aria-invalid="!!fieldErrors.password"
          :aria-describedby="fieldErrors.password ? 'password-error password-criteria' : 'password-criteria'"
          @focus="isPasswordFocused = true"
          @input="clearFieldError('password')"
        />
        <span
          v-if="fieldErrors.password"
          id="password-error"
          class="form-group__error"
          role="alert"
        >
          {{ fieldErrors.password }}
        </span>

        <!-- Checklist des critères de sécurité -->
        <PasswordCriteria
          id="password-criteria"
          :password="form.password"
          :visible="isPasswordFocused || form.password.length > 0"
        />
      </div>

      <!-- Bouton de soumission S'inscrire -->
      <button
        type="submit"
        class="btn-submit btn-submit--full"
        :disabled="isLoading"
        :aria-busy="isLoading"
      >
        <span v-if="isLoading" class="btn-submit__spinner" aria-hidden="true"></span>
        <span>{{ isLoading ? 'Création du compte...' : "S'inscrire" }}</span>
      </button>
    </form>

    <template #footer>
      <p>
        Vous avez déjà un compte ?
        <router-link to="/login" class="auth-link">
          Se connecter
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import PasswordCriteria from '@/components/auth/PasswordCriteria/PasswordCriteria.vue'
import { isPasswordStrong } from '@/utils/password'

const router = useRouter()
const authStore = useAuthStore()

interface FormState {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[] | string>
}

const form = reactive<FormState>({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
})

const fieldErrors = ref<Record<string, string>>({})
const globalError = ref<string | null>(null)
const isLoading = ref<boolean>(false)
const showPassword = ref<boolean>(false)
const isPasswordFocused = ref<boolean>(false)

const isPasswordValid = computed(() => isPasswordStrong(form.password))

function clearFieldError(field: string): void {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
}

function validateClientSide(): boolean {
  fieldErrors.value = {}
  globalError.value = null

  if (!form.firstName || form.firstName.length < 2) {
    fieldErrors.value.firstName = 'Le prénom doit contenir au moins 2 caractères.'
  }

  if (!form.lastName || form.lastName.length < 2) {
    fieldErrors.value.lastName = 'Le nom doit contenir au moins 2 caractères.'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email || !emailPattern.test(form.email)) {
    fieldErrors.value.email = 'Veuillez saisir une adresse email valide.'
  }

  if (!isPasswordValid.value) {
    fieldErrors.value.password = 'Le mot de passe ne respecte pas tous les critères de sécurité.'
  }

  return Object.keys(fieldErrors.value).length === 0
}

async function handleSubmit(): Promise<void> {
  if (!validateClientSide()) {
    return
  }

  isLoading.value = true
  globalError.value = null

  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8080'

  try {
    const response = await fetch(`${apiBaseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }),
    })

    if (response.status === 201) {
      // Authentification automatique immédiate pour ouvrir la session sécurisée
      await authStore.login(form.email, form.password)
      await router.push('/')
      return
    }

    const data = (await response.json()) as ApiErrorResponse

    if (response.status === 422) {
      if (data.errors) {
        for (const [key, value] of Object.entries(data.errors)) {
          fieldErrors.value[key] = Array.isArray(value) ? value[0] : value
        }
      } else if (data.message) {
        globalError.value = data.message
      }
      return
    }

    globalError.value = data.message || 'Une erreur est survenue lors de l\'inscription.'
  } catch {
    globalError.value = 'Impossible de contacter le serveur. Veuillez vérifier votre connexion.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped lang="scss" src="./RegisterView.scss"></style>
