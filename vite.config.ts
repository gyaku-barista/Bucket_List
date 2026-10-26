import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// 設定画面に出すバージョン（どの版を開いているか確かめるため）
const version = (process.env.GITHUB_SHA ?? execSync('git rev-parse HEAD').toString()).trim().slice(0, 7)

export default defineConfig({
  // 相対パスにしておくと GitHub Pages のサブパスでもそのまま動く
  base: './',
  build: { chunkSizeWarningLimit: 3500 },
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // HEIF 変換の部品は大きいので、最初にまとめては取り込まず、使ったときにだけ保存する
        globIgnores: ['**/heic-to-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/heic-to-.*\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'heic-decoder', expiration: { maxEntries: 2 } },
          },
          // Google Fonts をオフラインでも使えるようにキャッシュする
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'ふたりのやりたいこと',
        short_name: 'やりたいこと',
        description: 'ふたりのやりたいことを書きためる紙',
        lang: 'ja',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f0e6',
        theme_color: '#f5f0e6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
