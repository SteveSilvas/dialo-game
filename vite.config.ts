import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/meu a
export default defineConfig({
  base: '/dialo-game/',
  plugins: [react()],
})
