import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Before react(), as the plugin requires; the tree it writes is checked in (web W1).
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      addExtensions: true,
      routeFileIgnorePattern: '\\.test\\.tsx?$',
      routeTreeFileHeader: [],
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    // The Hub's CSP allows no data: URI, so nothing is inlined.
    assetsInlineLimit: 0,
    rolldownOptions: {
      output: {
        // Zod decides to compile when a schema is built, and the chunk that holds Zod runs before the
        // entry's body; jitless.ts rides in that chunk so it runs before any schema (web W27).
        codeSplitting: {
          groups: [{ name: 'zod', test: /node_modules[\\/]zod[\\/]|platform[\\/]jitless\.ts$/ }],
        },
        assetFileNames: (asset) =>
          asset.names.includes('favicon.svg') ? 'favicon.svg' : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
