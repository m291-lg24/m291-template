<script setup>
import { RouterLink, RouterView } from 'vue-router'

const appTitle = import.meta.env.VITE_APP_TITLE

const links = [
  { to: { name: 'home' }, label: 'Start' },
  { to: { name: 'notes' }, label: 'Notizen' },
  { to: { name: 'contact' }, label: 'Kontakt' },
  { to: { name: 'about' }, label: 'Über' },
]
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-slate-200 bg-white">
      <nav class="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4">
        <RouterLink :to="{ name: 'home' }" class="mr-auto text-lg font-semibold">
          {{ appTitle }}
        </RouterLink>
        <RouterLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="text-slate-600 hover:text-brand-600"
          active-class="font-semibold text-brand-600"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
      Modul 291 · SBW Neue Medien
    </footer>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
