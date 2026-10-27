import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging'
import { arrayRemove, arrayUnion, doc, setDoc } from 'firebase/firestore'
import { app, db } from './firebase'

/**
 * Web Push の公開鍵（Firebase コンソール → プロジェクトの設定 → Cloud Messaging → ウェブプッシュ証明書）。
 * 公開してよい値。空のあいだは通知の機能を出さない。
 */
const VAPID_KEY = ''

export type NotifyState = 'unavailable' | 'unsupported' | 'off' | 'on' | 'denied'

const TOKEN_KEY = 'bucket-list:fcm-token'

const memberRef = (spaceId: string, uid: string) => doc(db, 'spaces', spaceId, 'members', uid)

function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // 保存できなくても、通知そのものは届く
  }
}

/** この端末で通知が使えるか、いまどうなっているか */
export async function notifyState(): Promise<NotifyState> {
  if (!VAPID_KEY) return 'unavailable'
  // iPhone はホーム画面に追加したアプリでしか通知を受け取れない
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !(await isSupported().catch(() => false))) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' && savedToken() ? 'on' : 'off'
}

/**
 * 通知を受け取るように登録する。受け取り先（トークン）を自分のメンバー情報に保存し、
 * 相手が書いたとき・かなえたときに Cloud Functions がそこへ送る。
 * ask=false のときは許可を求めず、すでに許可されていればトークンだけ更新する（アプリを開くたび）。
 */
export async function enableNotifications(spaceId: string, uid: string, ask = true): Promise<NotifyState> {
  const state = await notifyState()
  if (state === 'unavailable' || state === 'unsupported' || state === 'denied') return state
  if (Notification.permission !== 'granted') {
    if (!ask) return 'off'
    if ((await Notification.requestPermission()) !== 'granted') return Notification.permission === 'denied' ? 'denied' : 'off'
  }
  const registration = await navigator.serviceWorker.ready
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
  const previous = savedToken()
  // 古い受け取り先は外し、新しいものを足す
  await setDoc(memberRef(spaceId, uid), { fcmTokens: arrayUnion(token) }, { merge: true })
  if (previous && previous !== token) await setDoc(memberRef(spaceId, uid), { fcmTokens: arrayRemove(previous) }, { merge: true })
  saveToken(token)
  return 'on'
}

/** この端末への通知をやめる */
export async function disableNotifications(spaceId: string, uid: string): Promise<NotifyState> {
  const token = savedToken()
  if (token) await setDoc(memberRef(spaceId, uid), { fcmTokens: arrayRemove(token) }, { merge: true })
  await deleteToken(getMessaging(app)).catch(() => {})
  saveToken(null)
  return 'off'
}
