<template>
  <div class="dashboard-page">
    <header class="navbar">
      <div class="navbar__brand">
        <img :src="'/famylist-logo.svg'" alt="Famylist" class="navbar__logo" />
        <span class="navbar__title">Famy<span class="navbar__title-accent">list</span></span>
      </div>
      <nav class="navbar__actions">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/profile" class="navbar__user-greeting">
            Bonjour, <strong>{{ authStore.user?.firstName }}</strong> !
          </router-link>
          <router-link to="/profile" class="navbar__action-btn navbar__action-btn--secondary">
            Mon Profil
          </router-link>
          <button
            type="button"
            class="navbar__action-btn navbar__action-btn--secondary"
            :disabled="authStore.isLoading"
            @click="handleLogout"
          >
            Se déconnecter
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="navbar__action-btn navbar__action-btn--secondary">
            Se connecter
          </router-link>
          <router-link to="/register" class="navbar__action-btn">
            Créer un compte
          </router-link>
        </template>
      </nav>
    </header>

    <main class="dashboard-page__content">
      <section class="api-card">
        <h1 class="api-card__heading">
          {{ authStore.isAuthenticated ? `Bienvenue sur FamyList, ${authStore.user?.firstName} !` : 'Initialisation du projet' }}
        </h1>

        <div v-if="isLoading" class="api-card__status api-card__status--loading">
          Vérification de la connexion à l'API...
        </div>

        <div v-else-if="healthData && healthData.status === 'ok'" class="api-card__status api-card__status--ok">
          <span class="api-card__dot"></span>
          <span>API & Base de données connectées (Symfony {{ healthData.symfony_version }} - PostgreSQL 17)</span>
        </div>

        <div v-else class="api-card__status api-card__status--error">
          <span class="api-card__dot"></span>
          <span>Erreur de connexion à l'API</span>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

interface HealthResponse {
  status: string
  php_version?: string
  symfony_version?: string
  database?: string
  database_version?: string
}

const healthData = ref<HealthResponse | null>(null)
const isLoading = ref<boolean>(true)

async function handleLogout(): Promise<void> {
  await authStore.logout()
  await router.push('/')
}

onMounted(async () => {
  try {
    const response = await fetch('http://localhost:8080/api/health')
    if (response.ok) {
      healthData.value = (await response.json()) as HealthResponse
    }
  } catch {
    healthData.value = null
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped lang="scss" src="./DashboardView.scss"></style>
