// ウェブ用の Firebase 設定値はブラウザに配信される公開前提の値（データはセキュリティルールで保護）。
// 環境変数があればそちらを優先する（ローカルのエミュレータ用）。
// 画面側とサービスワーカー（通知の受け取り）の両方から使う。
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBYU-gP609xZcu_3xRjShV0IZSVVLtfEjg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bucket-list-f1f95.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bucket-list-f1f95',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:246639595476:web:93196ac2de64d1bd84d041',
  // 通知（Firebase Cloud Messaging）の送り主
  messagingSenderId: '246639595476',
}
