<template>
  <div class="profile-page">
    <header class="navbar">
      <div class="navbar__brand">
        <router-link to="/" class="navbar__brand-link">
          <img :src="'/famylist-logo.svg'" alt="Famylist" class="navbar__logo" />
          <span class="navbar__title">Famy<span class="navbar__title-accent">list</span></span>
        </router-link>
      </div>
      <nav class="navbar__actions">
        <router-link to="/" class="navbar__action-btn navbar__action-btn--secondary">
          Tableau de bord
        </router-link>
        <button
          type="button"
          class="navbar__action-btn navbar__action-btn--secondary"
          :disabled="authStore.isLoading"
          @click="handleLogout"
        >
          Se déconnecter
        </button>
      </nav>
    </header>

    <main class="profile-page__content">
      <div class="profile-container">
        <!-- Lien retour -->
        <router-link to="/" class="profile-back-link">
          ← Retour au tableau de bord
        </router-link>

        <!-- Carte Profil -->
        <div class="profile-card">
          <!-- En-tête avec Avatar & Date d'inscription -->
          <header class="profile-header">
            <div class="profile-avatar" aria-hidden="true">
              {{ userInitials }}
            </div>
            <h1 class="profile-name">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </h1>
            <p v-if="formattedCreatedAt" class="profile-created-at">
              Inscrit le {{ formattedCreatedAt }}
            </p>
          </header>

          <hr class="profile-divider" />

          <!-- Section 1 : Informations personnelles -->
          <section class="profile-section">
            <h2 class="profile-section__title">Informations personnelles</h2>
            <p class="profile-section__desc">
              Consultez et modifiez les informations de votre compte Famylist.
            </p>

            <!-- Messages de retour section profil -->
            <div
              v-if="profileSuccess"
              id="profile-success-alert"
              class="profile-alert profile-alert--success"
              role="status"
              aria-live="polite"
            >
              {{ profileSuccess }}
            </div>

            <div
              v-if="profileError"
              id="profile-error-alert"
              class="profile-alert profile-alert--error"
              role="alert"
              aria-live="assertive"
            >
              {{ profileError }}
            </div>

            <form class="profile-form" novalidate @submit.prevent="handleProfileSubmit">
              <!-- Ligne Prénom / Nom côte à côte -->
              <div class="form-row">
                <div class="form-group">
                  <label for="profile-first-name" class="form-group__label">
                    Prénom <span class="form-group__required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="profile-first-name"
                    v-model.trim="form.firstName"
                    type="text"
                    class="form-group__input"
                    :class="{ 'form-group__input--error': !!fieldErrors.firstName }"
                    placeholder="Ex : Arnaud"
                    autocomplete="given-name"
                    required
                    :aria-invalid="!!fieldErrors.firstName"
                    :aria-describedby="fieldErrors.firstName ? 'first-name-error' : undefined"
                    @input="clearFieldError('firstName')"
                  />
                  <span
                    v-if="fieldErrors.firstName"
                    id="first-name-error"
                    class="form-group__error"
                    role="alert"
                  >
                    {{ fieldErrors.firstName }}
                  </span>
                </div>

                <div class="form-group">
                  <label for="profile-last-name" class="form-group__label">
                    Nom <span class="form-group__required" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="profile-last-name"
                    v-model.trim="form.lastName"
                    type="text"
                    class="form-group__input"
                    :class="{ 'form-group__input--error': !!fieldErrors.lastName }"
                    placeholder="Ex : Guevaer"
                    autocomplete="family-name"
                    required
                    :aria-invalid="!!fieldErrors.lastName"
                    :aria-describedby="fieldErrors.lastName ? 'last-name-error' : undefined"
                    @input="clearFieldError('lastName')"
                  />
                  <span
                    v-if="fieldErrors.lastName"
                    id="last-name-error"
                    class="form-group__error"
                    role="alert"
                  >
                    {{ fieldErrors.lastName }}
                  </span>
                </div>
              </div>

              <!-- Adresse email -->
              <div class="form-group">
                <label for="profile-email" class="form-group__label">
                  Adresse email <span class="form-group__required" aria-hidden="true">*</span>
                </label>
                <input
                  id="profile-email"
                  v-model.trim="form.email"
                  type="email"
                  class="form-group__input"
                  :class="{ 'form-group__input--error': !!fieldErrors.email }"
                  placeholder="votre@email.com"
                  autocomplete="email"
                  required
                  :aria-invalid="!!fieldErrors.email"
                  :aria-describedby="fieldErrors.email ? 'profile-email-error' : undefined"
                  @input="clearFieldError('email')"
                />
                <span
                  v-if="fieldErrors.email"
                  id="profile-email-error"
                  class="form-group__error"
                  role="alert"
                >
                  {{ fieldErrors.email }}
                </span>
              </div>

              <!-- Bouton d'enregistrement profil -->
              <div class="profile-actions">
                <button
                  type="submit"
                  class="btn-save"
                  :disabled="!isDirty || isProfileLoading"
                  :aria-busy="isProfileLoading"
                >
                  <span v-if="isProfileLoading" class="btn-save__spinner" aria-hidden="true"></span>
                  <span>{{ isProfileLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
                </button>
              </div>
            </form>
          </section>

          <hr class="profile-divider" />

          <!-- Section 2 : Sécurité du compte & Changement de mot de passe -->
          <section class="profile-section">
            <h2 class="profile-section__title">Sécurité du compte</h2>
            <p class="profile-section__desc">
              Gérez votre mot de passe et la protection de vos accès.
            </p>

            <!-- Messages de retour mot de passe -->
            <div
              v-if="passwordSuccess"
              id="password-success-alert"
              class="profile-alert profile-alert--success"
              role="status"
              aria-live="polite"
            >
              {{ passwordSuccess }}
            </div>

            <div
              v-if="passwordError"
              id="password-error-alert"
              class="profile-alert profile-alert--error"
              role="alert"
              aria-live="assertive"
            >
              {{ passwordError }}
            </div>

            <!-- Vue compacte par défaut -->
            <div v-if="!isChangingPassword" class="security-card">
              <div class="security-card__info">
                <div class="security-card__label">Mot de passe</div>
                <div class="security-card__dots" aria-label="Mot de passe sécurisé">••••••••••••</div>
              </div>
              <button
                type="button"
                class="security-card__btn-edit"
                @click="openPasswordForm"
              >
                Modifier mon mot de passe
              </button>
            </div>

            <!-- Formulaire interactif de modification du mot de passe -->
            <form
              v-else
              class="password-form"
              novalidate
              @submit.prevent="handlePasswordSubmit"
            >
              <!-- Mot de passe actuel -->
              <div class="form-group">
                <div class="form-group__header">
                  <label for="current-password" class="form-group__label">
                    Mot de passe actuel <span class="form-group__required" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    class="form-group__toggle-password"
                    :aria-label="showCurrentPassword ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    {{ showCurrentPassword ? 'Masquer' : 'Afficher' }}
                  </button>
                </div>
                <input
                  id="current-password"
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  class="form-group__input"
                  :class="{ 'form-group__input--error': !!passwordFieldErrors.currentPassword }"
                  placeholder="Votre mot de passe actuel"
                  autocomplete="current-password"
                  required
                  :aria-invalid="!!passwordFieldErrors.currentPassword"
                  :aria-describedby="passwordFieldErrors.currentPassword ? 'current-password-error' : undefined"
                  @input="clearPasswordError('currentPassword')"
                />
                <span
                  v-if="passwordFieldErrors.currentPassword"
                  id="current-password-error"
                  class="form-group__error"
                  role="alert"
                >
                  {{ passwordFieldErrors.currentPassword }}
                </span>
              </div>

              <!-- Nouveau mot de passe -->
              <div class="form-group">
                <div class="form-group__header">
                  <label for="new-password" class="form-group__label">
                    Nouveau mot de passe <span class="form-group__required" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    class="form-group__toggle-password"
                    :aria-label="showNewPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'"
                    @click="showNewPassword = !showNewPassword"
                  >
                    {{ showNewPassword ? 'Masquer' : 'Afficher' }}
                  </button>
                </div>
                <input
                  id="new-password"
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  class="form-group__input"
                  :class="{ 'form-group__input--error': !!passwordFieldErrors.newPassword }"
                  placeholder="••••••••••••"
                  autocomplete="new-password"
                  required
                  :aria-invalid="!!passwordFieldErrors.newPassword"
                  :aria-describedby="passwordFieldErrors.newPassword ? 'new-password-error new-password-criteria' : 'new-password-criteria'"
                  @focus="isPasswordFocused = true"
                  @input="clearPasswordError('newPassword')"
                />
                <span
                  v-if="passwordFieldErrors.newPassword"
                  id="new-password-error"
                  class="form-group__error"
                  role="alert"
                >
                  {{ passwordFieldErrors.newPassword }}
                </span>

                <!-- Checklist des critères de sécurité -->
                <PasswordCriteria
                  id="new-password-criteria"
                  :password="passwordForm.newPassword"
                  :visible="isPasswordFocused || passwordForm.newPassword.length > 0"
                />
              </div>

              <!-- Confirmation du nouveau mot de passe -->
              <div class="form-group">
                <div class="form-group__header">
                  <label for="confirm-password" class="form-group__label">
                    Confirmer le mot de passe <span class="form-group__required" aria-hidden="true">*</span>
                  </label>
                  <button
                    type="button"
                    class="form-group__toggle-password"
                    :aria-label="showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    {{ showConfirmPassword ? 'Masquer' : 'Afficher' }}
                  </button>
                </div>
                <input
                  id="confirm-password"
                  v-model="passwordForm.confirmation"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="form-group__input"
                  :class="{ 'form-group__input--error': !!passwordFieldErrors.confirmation }"
                  placeholder="••••••••••••"
                  autocomplete="new-password"
                  required
                  :aria-invalid="!!passwordFieldErrors.confirmation"
                  :aria-describedby="passwordFieldErrors.confirmation ? 'confirm-password-error' : undefined"
                  @input="clearPasswordError('confirmation')"
                />
                <span
                  v-if="passwordFieldErrors.confirmation"
                  id="confirm-password-error"
                  class="form-group__error"
                  role="alert"
                >
                  {{ passwordFieldErrors.confirmation }}
                </span>
              </div>

              <!-- Actions du formulaire mot de passe -->
              <div class="password-actions">
                <button
                  type="button"
                  class="btn-cancel"
                  :disabled="isPasswordLoading"
                  @click="cancelPasswordChange"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn-save"
                  :disabled="isPasswordLoading"
                  :aria-busy="isPasswordLoading"
                >
                  <span v-if="isPasswordLoading" class="btn-save__spinner" aria-hidden="true"></span>
                  <span>{{ isPasswordLoading ? 'Modification...' : 'Valider le mot de passe' }}</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PasswordCriteria from '@/components/auth/PasswordCriteria/PasswordCriteria.vue'
import { isPasswordStrong } from '@/utils/password'

const router = useRouter()
const authStore = useAuthStore()

// ---------------------------------------------------------------------------
// 1. Profil (Prénom, Nom, Email)
// ---------------------------------------------------------------------------
const isProfileLoading = ref<boolean>(false)
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
})

const fieldErrors = ref<Record<string, string>>({})
const profileError = ref<string | null>(null)
const profileSuccess = ref<string | null>(null)

function resetProfileForm(): void {
  if (authStore.user) {
    form.firstName = authStore.user.firstName
    form.lastName = authStore.user.lastName
    form.email = authStore.user.email
  }
  fieldErrors.value = {}
  profileError.value = null
  profileSuccess.value = null
}

watchEffect(() => {
  if (authStore.user) {
    form.firstName = authStore.user.firstName
    form.lastName = authStore.user.lastName
    form.email = authStore.user.email
  }
})

const isDirty = computed(() => {
  if (!authStore.user) return false
  return (
    form.firstName !== authStore.user.firstName ||
    form.lastName !== authStore.user.lastName ||
    form.email !== authStore.user.email
  )
})

const userInitials = computed(() => {
  const first = authStore.user?.firstName?.[0] || ''
  const last = authStore.user?.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'FL'
})

const formattedCreatedAt = computed(() => {
  if (!authStore.user?.createdAt) return null
  try {
    const date = new Date(authStore.user.createdAt)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return null
  }
})

function clearFieldError(field: string): void {
  if (fieldErrors.value[field]) {
    delete fieldErrors.value[field]
  }
  profileError.value = null
  profileSuccess.value = null
}

function validateProfile(): boolean {
  fieldErrors.value = {}
  profileError.value = null
  profileSuccess.value = null

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

  return Object.keys(fieldErrors.value).length === 0
}

async function handleProfileSubmit(): Promise<void> {
  if (!validateProfile()) {
    return
  }

  // Si le formulaire de mot de passe était ouvert, on le referme proprement
  if (isChangingPassword.value) {
    cancelPasswordChange()
  }

  isProfileLoading.value = true
  try {
    const result = await authStore.updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
    })

    if (result.success) {
      profileSuccess.value = result.message || 'Vos informations ont été mises à jour avec succès.'
    } else {
      if (result.errors) {
        for (const [key, value] of Object.entries(result.errors)) {
          fieldErrors.value[key] = Array.isArray(value) ? value[0] : value
        }
      }
      profileError.value = result.message || 'Impossible de mettre à jour le profil.'
    }
  } finally {
    isProfileLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// 2. Mot de passe
// ---------------------------------------------------------------------------
const isPasswordLoading = ref<boolean>(false)
const isChangingPassword = ref<boolean>(false)
const showCurrentPassword = ref<boolean>(false)
const showNewPassword = ref<boolean>(false)
const showConfirmPassword = ref<boolean>(false)
const isPasswordFocused = ref<boolean>(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmation: '',
})

const passwordFieldErrors = ref<Record<string, string>>({})
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

const isNewPasswordValid = computed(() => isPasswordStrong(passwordForm.newPassword))

function openPasswordForm(): void {
  // Réinitialise toute saisie ou erreur non enregistrée dans la section profil
  resetProfileForm()

  isChangingPassword.value = true
  passwordSuccess.value = null
  passwordError.value = null
  passwordFieldErrors.value = {}
}

function cancelPasswordChange(): void {
  isChangingPassword.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmation = ''
  passwordFieldErrors.value = {}
  passwordError.value = null
}

function clearPasswordError(field: string): void {
  if (passwordFieldErrors.value[field]) {
    delete passwordFieldErrors.value[field]
  }
  passwordError.value = null
  passwordSuccess.value = null
}

function validatePasswordForm(): boolean {
  passwordFieldErrors.value = {}
  passwordError.value = null
  passwordSuccess.value = null

  if (!passwordForm.currentPassword) {
    passwordFieldErrors.value.currentPassword = 'Le mot de passe actuel est obligatoire.'
  }

  if (!isNewPasswordValid.value) {
    passwordFieldErrors.value.newPassword = 'Le mot de passe ne respecte pas tous les critères de sécurité.'
  }

  if (!passwordForm.confirmation) {
    passwordFieldErrors.value.confirmation = 'Veuillez confirmer votre nouveau mot de passe.'
  } else if (passwordForm.newPassword !== passwordForm.confirmation) {
    passwordFieldErrors.value.confirmation = 'Les mots de passe ne correspondent pas.'
  }

  return Object.keys(passwordFieldErrors.value).length === 0
}

async function handlePasswordSubmit(): Promise<void> {
  if (!validatePasswordForm()) {
    return
  }

  isPasswordLoading.value = true
  try {
    const result = await authStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )

    if (result.success) {
      passwordSuccess.value = result.message || 'Mot de passe modifié avec succès.'
      cancelPasswordChange()
      resetProfileForm()
    } else {
      if (result.errors) {
        for (const [key, value] of Object.entries(result.errors)) {
          passwordFieldErrors.value[key] = Array.isArray(value) ? value[0] : value
        }
      }
      passwordError.value = result.message || 'Impossible de modifier le mot de passe.'
    }
  } finally {
    isPasswordLoading.value = false
  }
}

// ---------------------------------------------------------------------------
// 3. Déconnexion
// ---------------------------------------------------------------------------
async function handleLogout(): Promise<void> {
  await authStore.logout()
  await router.push('/')
}
</script>

<style scoped lang="scss" src="./ProfileView.scss"></style>
