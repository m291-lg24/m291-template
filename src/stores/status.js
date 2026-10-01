import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

// Prüft, ob API und Datenbank erreichbar sind (GET /api/health).
export const useStatusStore = defineStore('status', () => {
  const api_ok = ref(null)
  const db_ok = ref(null)
  const message = ref('')

  async function check() {
    try {
      const data = await api.get('health')
      api_ok.value = true
      db_ok.value = data.db === 'ok'
      message.value = data.db === 'ok' ? 'API und Datenbank erreichbar' : `API erreichbar, Datenbank: ${data.db}`
    } catch (err) {
      api_ok.value = false
      db_ok.value = false
      message.value = err.message
    }
  }

  return { api_ok, db_ok, message, check }
})
