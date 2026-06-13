import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VERCEL ? '/' : '/finacewith/',
  server: {
    ...(process.env.VERCEL
      ? {}
      : { proxy: { '/api': 'http://localhost:3001' } }),
  },
})
