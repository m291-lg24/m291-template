import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  // History-Modus: saubere URLs. Benötigt die Fallback-Regel in public/.htaccess.
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Start' } },
    {
      path: '/notizen',
      name: 'notes',
      component: () => import('@/views/NotesView.vue'),
      meta: { title: 'Notizen' },
    },
    {
      path: '/kontakt',
      name: 'contact',
      component: () => import('@/views/ContactView.vue'),
      meta: { title: 'Kontakt' },
    },
    {
      path: '/ueber',
      name: 'about',
      component: () => import('@/views/AboutView.vue'),
      meta: { title: 'Über' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Nicht gefunden' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const appTitle = import.meta.env.VITE_APP_TITLE
  document.title = to.meta.title ? `${to.meta.title} · ${appTitle}` : appTitle
})

export default router
