import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'

export const app = initializeApp(firebaseConfig)

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
