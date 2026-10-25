import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 相対パスにしておくと GitHub Pages のサブパスでもそのまま動く
  base: './',
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ふたりのバケットリスト',
        short_name: 'バケットリスト',
        description: 'ふたりでやりたいことを共有して、思い出を残すアプリ',
        lang: 'ja',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fff7f5',
        theme_color: '#e8677f',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
