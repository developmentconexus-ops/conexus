import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Hub's CSP allows no data: URI, so nothing is inlined.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.names.includes('favicon.svg') ? 'favicon.svg' : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
