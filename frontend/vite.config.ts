import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Firebase Hosting sirve el SPA desde la raíz del sitio.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
})
