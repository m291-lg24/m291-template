<script setup>
import { onMounted, ref } from 'vue'
import { useNotesStore } from '@/stores/notes'

const notes = useNotesStore()
const text = ref('')

onMounted(notes.load)

async function submit() {
  if (await notes.add(text.value)) text.value = ''
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold">Notizen</h1>
      <p class="text-slate-600">Beispiel für Daten von einer Schnittstelle (PHP + MariaDB).</p>
    </header>

    <form class="card flex flex-col gap-3 sm:flex-row" @submit.prevent="submit">
      <label for="note" class="sr-only">Neue Notiz</label>
      <input id="note" v-model="text" class="input" maxlength="500" placeholder="Neue Notiz …" required />
      <button class="btn-primary shrink-0" :disabled="!text.trim()">Hinzufügen</button>
    </form>

    <p v-if="notes.error" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800">
      {{ notes.error }}
    </p>

    <p v-if="notes.loading" class="text-slate-500">Lade Notizen …</p>
    <p v-else-if="notes.count === 0 && !notes.error" class="text-slate-500">Noch keine Notizen vorhanden.</p>

    <TransitionGroup v-else tag="ul" name="list" class="space-y-2">
      <li v-for="note in notes.sorted" :key="note.id" class="card flex items-start justify-between gap-4 p-4">
        <div>
          <p>{{ note.text }}</p>
          <p class="text-xs text-slate-500">{{ note.created_at }}</p>
        </div>
        <button
          class="text-sm text-red-700 hover:underline"
          :aria-label="`Notiz löschen: ${note.text}`"
          @click="notes.remove(note.id)"
        >
          Löschen
        </button>
      </li>
    </TransitionGroup>
  </section>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 200ms ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
