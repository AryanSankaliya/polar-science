import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: true,
    proxy: {
      '/api/ai': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/media': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 5173,
    open: false,
    host: true,
    proxy: {
      '/api/ai': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/media': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
