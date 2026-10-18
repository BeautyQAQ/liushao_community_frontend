import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import ElementPlus from 'unplugin-element-plus/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      vue(),
      Components({ dirs: [], dts: 'src/components.d.ts', resolvers: [ElementPlusResolver()] }),
      ElementPlus({}),
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { port: 5173, strictPort: true, proxy: {
      '/api': { target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true, rewrite: path => path.replace(/^\/api/, '') }
    } }
  }
})
