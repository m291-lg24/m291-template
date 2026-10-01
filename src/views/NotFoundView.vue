<template>
  <section class="card text-center">
    <p class="text-5xl font-bold text-brand-600">404</p>
    <h1 class="mt-2 text-xl font-semibold">Diese Seite gibt es nicht</h1>
    <p class="mt-1 text-slate-600">Prüfe die Adresse oder kehre zur Startseite zurück.</p>
    <RouterLink :to="{ name: 'home' }" class="btn-primary mt-4">Zur Startseite</RouterLink>
  </section>
</template>
