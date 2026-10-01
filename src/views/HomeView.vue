<script setup>
import { onMounted } from 'vue'
import { useStatusStore } from '@/stores/status'
import StatusBadge from '@/components/StatusBadge.vue'

const status = useStatusStore()
onMounted(status.check)

const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<template>
  <section class="space-y-6">
    <div class="card">
      <h1 class="text-3xl font-bold">{{ appTitle }}</h1>
      <p class="mt-2 text-slate-600">
        Startpunkt für dein Projekt: Vue 3, Tailwind CSS, Vue Router und Pinia – bereit für das Deployment auf Plesk.
      </p>
      <div class="mt-4 flex flex-wrap gap-2">
        <RouterLink :to="{ name: 'notes' }" class="btn-primary">Beispiel mit API ansehen</RouterLink>
        <RouterLink :to="{ name: 'contact' }" class="btn-secondary">Formular ansehen</RouterLink>
      </div>
    </div>

    <div class="card">
      <h2 class="text-lg font-semibold">Systemstatus</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <StatusBadge :ok="status.api_ok" label="API" />
        <StatusBadge :ok="status.db_ok" label="Datenbank" />
      </div>
      <p class="mt-2 text-sm text-slate-500" aria-live="polite">{{ status.message }}</p>
      <button class="btn-secondary mt-4" @click="status.check">Erneut prüfen</button>
    </div>
  </section>
</template>
