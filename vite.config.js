import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Standardwert, falls VITE_APP_TITLE in keiner .env-Datei gesetzt ist
  // (sonst bleibt %VITE_APP_TITLE% in index.html unersetzt)
  if (!env.VITE_APP_TITLE) process.env.VITE_APP_TITLE = 'M291-Projekt'

  return {
    // Unterordner auf dem Server, z. B. "/app/". Standard: Wurzel der Domain.
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
