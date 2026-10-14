import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: (asset) =>
          asset.names.includes('favicon.svg') ? 'favicon.svg' : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
