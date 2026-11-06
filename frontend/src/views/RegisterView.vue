<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Colonne Gauche : Présentation & Proposition de valeur Famylist -->
      <aside class="auth-intro">
        <header class="auth-intro__header">
          <div class="auth-intro__brand">
            <router-link to="/" class="auth-intro__brand-link">
              <img :src="'/famylist-logo.svg'" alt="Famylist" class="auth-intro__logo" />
              <span class="auth-intro__brand-name">Famy<span class="auth-intro__brand-accent">list</span></span>
            </router-link>
          </div>

          <h1 class="auth-intro__title">
            Offrez le bon cadeau.<br />
            <span>Gardez la surprise.</span>
          </h1>

          <p class="auth-intro__desc">
            FamyList permet à chacun de partager ses envies et à ses proches de réserver en toute complicité.
          </p>
        </header>

        <div class="auth-features">
          <div class="auth-feature">
            <div class="auth-feature__icon-box" aria-hidden="true">🎁</div>
            <div class="auth-feature__content">
              <h2 class="auth-feature__title">Toutes vos envies réunies</h2>
              <p class="auth-feature__desc">
                Photos, liens marchands, descriptions et prix pour chaque fête ou anniversaire.
              </p>
            </div>
          </div>

          <div class="auth-feature">
            <div class="auth-feature__icon-box" aria-hidden="true">🔗</div>
            <div class="auth-feature__content">
              <h2 class="auth-feature__title">Partage direct et libre</h2>
              <p class="auth-feature__desc">
                Un simple lien sécurisé à envoyer à vos proches, consultable sans installer d'application.
              </p>
            </div>
          </div>

          <div class="auth-feature">
            <div class="auth-feature__icon-box" aria-hidden="true">🤫</div>
            <div class="auth-feature__content">
              <h2 class="auth-feature__title">Effet de surprise garantie</h2>
              <p class="auth-feature__desc">
                Vos proches réservent les cadeaux entre eux. Pour vous, tout reste secret jusqu'au déballage !
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Colonne Droite : Carte d'inscription -->
      <section class="auth-form-card">
        <header class="auth-form-card__header">
          <h2 class="auth-form-card__title">Créer un compte</h2>
          <p class="auth-form-card__subtitle">
            Rejoignez FamyList gratuitement en quelques secondes.
          </p>
        </header>

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
              <div
                v-if="isPasswordFocused || form.password.length > 0"
                id="password-criteria"
                class="password-criteria"
                aria-label="Critères de sécurité du mot de passe"
              >
                <div
                  class="password-criteria__item"
                  :class="{ 'password-criteria__item--valid': criteria.hasMinLength }"
                >
                  <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasMinLength ? '✓' : '○' }}</span>
                  <span>12 caractères minimum</span>
                </div>
                <div
                  class="password-criteria__item"
                  :class="{ 'password-criteria__item--valid': criteria.hasUppercase }"
                >
                  <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasUppercase ? '✓' : '○' }}</span>
                  <span>1 majuscule</span>
                </div>
                <div
                  class="password-criteria__item"
                  :class="{ 'password-criteria__item--valid': criteria.hasLowercase }"
                >
                  <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasLowercase ? '✓' : '○' }}</span>
                  <span>1 minuscule</span>
                </div>
                <div
                  class="password-criteria__item"
                  :class="{ 'password-criteria__item--valid': criteria.hasDigit }"
                >
                  <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasDigit ? '✓' : '○' }}</span>
                  <span>1 chiffre</span>
                </div>
                <div
                  class="password-criteria__item"
                  :class="{ 'password-criteria__item--valid': criteria.hasSpecialChar }"
                >
                  <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasSpecialChar ? '✓' : '○' }}</span>
                  <span>1 caractère spécial (@$!%*?&)</span>
                </div>
              </div>
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

          <footer class="auth-form-card__footer">
            <p>
              Vous avez déjà un compte ?
              <router-link to="/" class="auth-link">
                Se connecter
              </router-link>
            </p>
          </footer>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

// Critères dynamiques du mot de passe
const criteria = computed(() => ({
  hasMinLength: form.password.length >= 12,
  hasUppercase: /[A-Z]/.test(form.password),
  hasLowercase: /[a-z]/.test(form.password),
  hasDigit: /[0-9]/.test(form.password),
  hasSpecialChar: /[@$!%*?&]/.test(form.password),
}))

const isPasswordValid = computed(() => {
  return (
    criteria.value.hasMinLength &&
    criteria.value.hasUppercase &&
    criteria.value.hasLowercase &&
    criteria.value.hasDigit &&
    criteria.value.hasSpecialChar
  )
})

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
