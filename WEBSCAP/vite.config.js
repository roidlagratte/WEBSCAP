import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Ecouter sur 0.0.0.0
    port: 3000,      // Par défaut, le port est 3000
  },
})

