import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the project on your local network
    port: 5173, // Your Vite port (default is 5173)
  }
})