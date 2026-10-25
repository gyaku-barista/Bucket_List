import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// ウェブ用の Firebase 設定値はブラウザに配信される公開前提の値（データはセキュリティルールで保護）。
// 環境変数があればそちらを優先する（ローカルのエミュレータ用）。
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBYU-gP609xZcu_3xRjShV0IZSVVLtfEjg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bucket-list-f1f95.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bucket-list-f1f95',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:246639595476:web:93196ac2de64d1bd84d041',
})

export const auth = getAuth(app)

// オフラインでも閲覧・編集でき、再接続時に同期される
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// ローカル開発用: VITE_USE_EMULATOR=true で Firebase エミュレータに接続
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
