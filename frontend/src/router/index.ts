import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/Dashboard/DashboardView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/Register/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Si le store d'authentification n'a pas encore été initialisé
  // (premier accès au site ou rechargement complet F5),
  // on interroge /api/me pour restaurer la session via le cookie HttpOnly
  if (!authStore.isInitialized) {
    await authStore.fetchCurrentUser()
  }

  // Redirection des utilisateurs déjà connectés accédant à /login ou /register
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  // Redirection vers /login pour les routes protégées nécessitant une authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  next()
})

export default router

