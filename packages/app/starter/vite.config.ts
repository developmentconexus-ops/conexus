import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
  build: {
    // The app's CSP allows no data: URI, so nothing is inlined.
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        // Zod decides to compile when it builds a schema, and the chunk that holds Zod runs before
        // main.tsx's body; src/lib/zod.ts rides in that chunk so it runs before any schema.
        codeSplitting: {
          groups: [{ name: 'zod', test: /node_modules[\\/]zod[\\/]|src[\\/]lib[\\/]zod\.ts$/ }],
        },
      },
    },
  },
})
