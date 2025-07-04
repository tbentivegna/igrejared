// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-church': {
        target: 'https://sistema.igrejared.com',
        changeOrigin: true,
        secure: true,
      },
      '/api-person': {
        target: 'https://sistema.igrejared.com',
        changeOrigin: true,
        secure: true,
      },
      '/api-authorization': {
        target: 'https://sistema.igrejared.com',
        changeOrigin: true,
        secure: true,
        // aqui forçamos o Origin para o domínio real
        onProxyReq(proxyReq) {
          proxyReq.setHeader('origin', 'https://sistema.igrejared.com')
        }
      }
    }
  }
})
