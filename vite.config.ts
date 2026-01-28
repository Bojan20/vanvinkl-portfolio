import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
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
          // Granular chunking for better caching and parallel loading

          // Three.js core (largest, separate chunk)
          if (id.includes('node_modules/three/')) {
            // Split Three.js examples/utils from core
            if (id.includes('three/examples')) {
              return 'vendor-three-utils'
            }
            return 'vendor-three'
          }

          // React Three Fiber ecosystem
          if (id.includes('@react-three/fiber')) {
            return 'vendor-r3f'
          }

          // React Three Drei (helpers)
          if (id.includes('@react-three/drei')) {
            return 'vendor-drei'
          }

          // Post-processing (heavy, rarely changes)
          if (id.includes('postprocessing') || id.includes('@react-three/postprocessing')) {
            return 'vendor-postprocessing'
          }

          // React + Zustand + other libs (keep together to avoid circular deps)
          if (id.includes('node_modules/')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
