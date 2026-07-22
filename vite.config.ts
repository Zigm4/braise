/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/braise/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // The hand-written public/manifest.webmanifest stays the source of truth.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Exercise photos are cached on demand, not precached (2+ MB).
        globIgnores: ['exercises/**'],
        navigateFallback: '/braise/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/braise\/exercises\/.*\.jpg$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-photos',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
