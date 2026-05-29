import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: false,
    // react-pdf (~1.4MB) is intentionally lazy-loaded only when exporting a
    // catalog PDF, so it never hits the initial load. Raise the warning ceiling
    // so that on-demand chunk doesn't trip a false alarm on every build.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Split rarely-changing vendor libs into their own long-cacheable
        // chunks so the main app chunk (which changes on every deploy) stays
        // small and the browser can cache vendors across releases.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react-router|react-router-dom|react|react-dom|scheduler)[\\/]/.test(id))
            return 'vendor-react'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (/(react-hook-form|@hookform|[\\/]zod[\\/])/.test(id)) return 'vendor-forms'
          if (/(i18next|react-i18next)/.test(id)) return 'vendor-i18n'
          if (id.includes('@hugeicons')) return 'vendor-icons'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
