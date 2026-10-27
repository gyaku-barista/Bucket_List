/// <reference lib="webworker" />
/**
 * サービスワーカー。アプリをオフラインでも開けるようにし、
 * 相手が項目を書いたとき・かなえたときの通知を受け取って表示する。
 */
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'
import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging/sw'
import { firebaseConfig } from './firebaseConfig'

declare const self: ServiceWorkerGlobalScope

// 新しい版はすぐに入れ替える
self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// HEIF 変換の部品は大きいので、最初にまとめては取り込まず、使ったときにだけ保存する
registerRoute(({ url }) => /\/assets\/heic-to-.*\.js$/.test(url.pathname), new CacheFirst({ cacheName: 'heic-decoder', plugins: [new ExpirationPlugin({ maxEntries: 2 })] }))

// Google Fonts をオフラインでも使えるようにキャッシュする
registerRoute(
  ({ url }) => /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname),
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 }), new CacheableResponsePlugin({ statuses: [0, 200] })],
  }),
)

// 通知。アプリを閉じているときに届いた通知は、Firebase がそのまま表示する
getMessaging(initializeApp(firebaseConfig))
