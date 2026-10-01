import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // Unterverzeichnis auf dem Server, z. B. "/app/". Standard: Wurzel der Domain.
    base: env.VITE_BASE_PATH || '/',
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      // Lokale Entwicklung: /api an den PHP-Entwicklungsserver weiterleiten (npm run api)
      proxy: {
        '/api': {
          target: env.DEV_API_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.js'],
    },
  }
})
