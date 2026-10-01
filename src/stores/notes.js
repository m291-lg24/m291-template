import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/lib/api'

// Beispiel-Store (Setup-Syntax): Notizen über die PHP-API laden, anlegen und löschen.
export const useNotesStore = defineStore('notes', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  const count = computed(() => items.value.length)
  const sorted = computed(() =>
    [...items.value].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
  )

  async function load() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get('notes')
      items.value = data.items
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function add(text) {
    const trimmed = text.trim()
    if (!trimmed) return false
    error.value = null
    try {
      const data = await api.post('notes', { text: trimmed })
      items.value.push(data.item)
      return true
    } catch (err) {
      error.value = err.message
      return false
    }
  }

  async function remove(id) {
    const previous = items.value
    items.value = items.value.filter((n) => n.id !== id) // optimistisch
    try {
      await api.delete(`notes/${id}`)
    } catch (err) {
      items.value = previous // rückgängig machen
      error.value = err.message
    }
  }

  return { items, loading, error, count, sorted, load, add, remove }
})
