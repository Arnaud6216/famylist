<template>
  <AuthLayout
    title="Se connecter"
    subtitle="Accédez à votre espace FamyList."
  >
    <!-- Message d'erreur global (ex: identifiants invalides) -->
    <div
      v-if="globalError"
      id="login-global-error"
      class="auth-alert auth-alert--error"
      role="alert"
      aria-live="assertive"
    >
      {{ globalError }}
    </div>

    <form class="auth-form" novalidate @submit.prevent="handleSubmit">
      <!-- Adresse email -->
      <div class="form-group">
        <label for="email" class="form-group__label">
          Adresse email <span class="form-group__required" aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          v-model.trim="email"
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
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="form-group__input"
          :class="{ 'form-group__input--error': !!fieldErrors.password }"
          placeholder="••••••••"
          autocomplete="current-password"
          required
          :aria-invalid="!!fieldErrors.password"
          :aria-describedby="fieldErrors.password ? 'password-error' : undefined"
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
      </div>

      <!-- Bouton de soumission Se connecter -->
      <button
        type="submit"
        class="btn-submit btn-submit--full"
        :disabled="authStore.isLoading"
        :aria-busy="authStore.isLoading"
      >
        <span v-if="authStore.isLoading" class="btn-submit__spinner" aria-hidden="true"></span>
        <span>{{ authStore.isLoading ? 'Connexion en cours...' : 'Se connecter' }}</span>
      </button>
    </form>

    <template #footer>
      <p>
        Vous n'avez pas de compte ?
        <router-link to="/register" class="auth-link">
          S'inscrire
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AuthLayout from '@/components/layout/AuthLayout.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref<string>('')
const password = ref<string>('')
const showPassword = ref<boolean>(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

function clearFieldError(field: string): void {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
  globalError.value = null
}

function validateClientSide(): boolean {
  fieldErrors.value = {}
  globalError.value = null

  if (!email.value) {
    fieldErrors.value.email = 'Veuillez renseigner votre adresse email.'
  }

  if (!password.value) {
    fieldErrors.value.password = 'Veuillez saisir votre mot de passe.'
  }

  return Object.keys(fieldErrors.value).length === 0
}

async function handleSubmit(): Promise<void> {
  if (!validateClientSide()) {
    return
  }

  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    await router.push('/')
  } else {
    globalError.value = result.message || 'Identifiants invalides.'
  }
}
</script>
