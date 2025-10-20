// apps/frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const API_BASE = process.env.VITE_API_BASE ?? 'http://localhost:4000'
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/verifier': { target: API_BASE, changeOrigin: true },
        '/issuer':   { target: API_BASE, changeOrigin: true },
        '/health':   { target: API_BASE, changeOrigin: true }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@zkp/shared': path.resolve(__dirname, '../../packages/shared/src')
      }
    },
    build: { sourcemap: true }
  }
})
