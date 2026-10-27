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
      // 通知を受け取るため、サービスワーカーは src/sw.ts に自分で書く
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      injectManifest: {
        // HEIF 変換の部品は大きいので、最初にまとめては取り込まない（sw.ts で使ったときに保存する）
        globIgnores: ['**/heic-to-*.js'],
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
