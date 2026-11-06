<template>
  <div class="dashboard-page">
    <header class="navbar">
      <div class="navbar__brand">
        <img :src="'/famylist-logo.svg'" alt="Famylist" class="navbar__logo" />
        <span class="navbar__title">Famy<span class="navbar__title-accent">list</span></span>
      </div>
      <nav class="navbar__actions">
        <router-link to="/register" class="navbar__action-btn">
          Créer un compte
        </router-link>
      </nav>
    </header>

    <main class="dashboard-page__content">
      <section class="api-card">
        <h1 class="api-card__heading">Initialisation du projet</h1>

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

interface HealthResponse {
  status: string
  php_version?: string
  symfony_version?: string
  database?: string
  database_version?: string
}

const healthData = ref<HealthResponse | null>(null)
const isLoading = ref<boolean>(true)

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
