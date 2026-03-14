import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lore',
        short_name: 'Lore',
        description: 'Witcher Lore Companion',
        theme_color: '#0e0d0b',
        background_color: '#0e0d0b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/wolf-medallion.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
