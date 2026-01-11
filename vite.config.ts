import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split Three.js into separate chunk for parallel loading
          if (id.includes('node_modules/three/')) {
            return 'vendor-three'
          }
          // Other vendor libs
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
