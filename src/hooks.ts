import { useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { Item, Member, Space } from './types'

/** undefined = 読み込み中 */
export function useAuthUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUser), [])
  return user
}

/** undefined = 読み込み中 / null = まだリストに参加していない */
export function useSpaceId(uid: string | undefined): string | null | undefined {
  const [spaceId, setSpaceId] = useState<string | null | undefined>(undefined)
  useEffect(() => {
    if (!uid) return
    setSpaceId(undefined)
    return onSnapshot(doc(db, 'users', uid), (snap) => setSpaceId((snap.data()?.spaceId as string) ?? null))
  }, [uid])
  return spaceId
}

export function useSpace(spaceId: string) {
  const [space, setSpace] = useState<Space | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [items, setItems] = useState<Item[] | null>(null)

  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, 'spaces', spaceId), (snap) => {
        const d = snap.data()
        if (d) setSpace({ id: snap.id, members: d.members, inviteCode: d.inviteCode, categories: d.categories ?? [] })
      }),
      onSnapshot(collection(db, 'spaces', spaceId, 'members'), (snap) =>
        setMembers(snap.docs.map((d) => ({ uid: d.id, displayName: d.data().displayName, avatar: d.data().avatar ?? null }))),
      ),
      onSnapshot(query(collection(db, 'spaces', spaceId, 'items'), orderBy('createdAt', 'desc')), (snap) =>
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item)),
      ),
    ]
    return () => unsubs.forEach((u) => u())
  }, [spaceId])

  return { space, members, items }
}
