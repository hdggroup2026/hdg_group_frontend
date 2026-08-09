import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from 'tailwindcss'

// Load backend target from public/appsettings.json
let targetUrl = ''
try {
  const settingsPath = path.resolve(__dirname, 'public/appsettings.json')
  if (!fs.existsSync(settingsPath)) {
    throw new Error('public/appsettings.json not found')
  }
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  const backend = settings.Backend
  if (!backend) {
    throw new Error('Backend config missing in appsettings.json')
  }
  const { Addresss, HttpPort, HttpsPort, APIPrefix } = backend
  const protocol = HttpsPort ? 'https' : 'http'
  const port = HttpsPort || HttpPort
  const host = port ? `${Addresss}:${port}` : Addresss
  targetUrl = `${protocol}://${host}${APIPrefix}`
  console.log(`[Vite Proxy] Target URL loaded from appsettings.json: ${targetUrl}`)
} catch (error) {
  console.error('[Vite Proxy]', error)
  console.error('[Vite Proxy] Please configure public/appsettings.json with Backend settings.')
  process.exit(1)
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dirs: [],
      resolvers: [ElementPlusResolver()],
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: targetUrl,
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

