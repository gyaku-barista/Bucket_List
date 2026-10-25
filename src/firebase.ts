import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

export const firebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
