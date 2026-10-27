/**
 * 相手がやりたいことを書いたとき・かなえたときに、もう一人の端末へ通知を送る。
 * 送り先（トークン）は、各自が設定の「通知を受け取る」で spaces/{spaceId}/members/{uid}.fcmTokens に保存する。
 */
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { setGlobalOptions } from 'firebase-functions/v2'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { logger } from 'firebase-functions'

// Firestore と同じ東京に置き、ふたりで使う分には十分な小ささに
setGlobalOptions({ region: 'asia-northeast1', maxInstances: 2, memory: '256MiB' })

initializeApp()

const APP_URL = 'https://gyaku-barista.github.io/Bucket_List/'
const ICON = APP_URL + 'icon-192.png'

/** もう端末に無い受け取り先。見つけたら消しておく */
const GONE = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'])

interface ItemData {
  title?: string
  createdBy?: string
  shared?: boolean
  done?: boolean
  doneBy?: string
}

/** actorUid 以外のメンバーに通知を送る。title にはしたことを書く人の名前を入れる */
async function notifyPartner(spaceId: string, actorUid: string, message: (actorName: string) => { title: string; body: string }) {
  const db = getFirestore()
  const space = await db.doc(`spaces/${spaceId}`).get()
  const members: string[] = space.get('members') ?? []
  const actor = await db.doc(`spaces/${spaceId}/members/${actorUid}`).get()
  const { title, body } = message(actor.get('displayName') ?? '相手')

  for (const uid of members.filter((m) => m !== actorUid)) {
    const ref = db.doc(`spaces/${spaceId}/members/${uid}`)
    const tokens: string[] = (await ref.get()).get('fcmTokens') ?? []
    if (!tokens.length) continue

    const res = await getMessaging().sendEachForMulticast({
      tokens,
      webpush: {
        notification: { title, body, icon: ICON, badge: ICON, lang: 'ja' },
        fcmOptions: { link: APP_URL },
      },
    })
    const gone = tokens.filter((_, i) => {
      const code = res.responses[i].error?.code
      return code !== undefined && GONE.has(code)
    })
    if (gone.length) await ref.update({ fcmTokens: FieldValue.arrayRemove(...gone) })
    logger.info('notified', { spaceId, to: uid, sent: res.successCount, failed: res.failureCount, removed: gone.length })
  }
}

/** やりたいことが書かれたとき */
export const onItemAdded = onDocumentCreated('spaces/{spaceId}/items/{itemId}', async (event) => {
  const item = event.data?.data() as ItemData | undefined
  if (!item?.createdBy || !item.title) return
  await notifyPartner(event.params.spaceId, item.createdBy, (name) => ({
    title: item.shared ? `${name}が、ふたりでやりたいことを書きました` : `${name}が、やりたいことを書きました`,
    body: item.title!,
  }))
})

/** かなえたとき（未達成 → 達成に変わったときだけ） */
export const onItemDone = onDocumentUpdated('spaces/{spaceId}/items/{itemId}', async (event) => {
  const before = event.data?.before.data() as ItemData | undefined
  const after = event.data?.after.data() as ItemData | undefined
  if (!before || !after || before.done || !after.done || !after.title) return
  const actor = after.doneBy ?? after.createdBy
  if (!actor) return
  await notifyPartner(event.params.spaceId, actor, (name) => ({
    title: `${name}が、かなえました`,
    body: after.title!,
  }))
})
