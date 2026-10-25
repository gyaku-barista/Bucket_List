import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { DEFAULT_CATEGORIES } from './categories'
import type { Category, Item, Photo } from './types'

// 紛らわしい文字 (0/O, 1/I/L) を除いた招待コード用の文字
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function randomCode(length = 6): string {
  const values = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(values, (v) => CODE_CHARS[v % CODE_CHARS.length]).join('')
}

const spaceRef = (spaceId: string) => doc(db, 'spaces', spaceId)
const itemsCol = (spaceId: string) => collection(db, 'spaces', spaceId, 'items')
const photosCol = (spaceId: string) => collection(db, 'spaces', spaceId, 'photos')

export async function createSpace(uid: string, displayName: string): Promise<void> {
  const ref = doc(collection(db, 'spaces'))
  let inviteCode = randomCode()
  while ((await getDoc(doc(db, 'inviteCodes', inviteCode))).exists()) inviteCode = randomCode()

  // セキュリティルールがメンバー判定にスペースを参照するので、スペースを先に作る
  await setDoc(ref, {
    members: [uid],
    inviteCode,
    categories: DEFAULT_CATEGORIES,
    createdAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'inviteCodes', inviteCode), { spaceId: ref.id })
  await setDoc(doc(db, 'spaces', ref.id, 'members', uid), { displayName, avatar: null })
  await setDoc(doc(db, 'users', uid), { spaceId: ref.id })
}

export async function joinSpace(uid: string, displayName: string, code: string): Promise<void> {
  const normalized = code.trim().toUpperCase()
  const invite = await getDoc(doc(db, 'inviteCodes', normalized))
  if (!invite.exists()) throw new Error('招待コードが見つかりません')
  const spaceId = invite.data().spaceId as string
  try {
    await updateDoc(spaceRef(spaceId), { members: arrayUnion(uid) })
  } catch {
    throw new Error('このリストには参加できません（すでに2人参加済みの可能性があります）')
  }
  await setDoc(doc(db, 'spaces', spaceId, 'members', uid), { displayName, avatar: null })
  await setDoc(doc(db, 'users', uid), { spaceId })
}

export async function updateProfile(spaceId: string, uid: string, data: { displayName?: string; avatar?: string | null }) {
  await setDoc(doc(db, 'spaces', spaceId, 'members', uid), data, { merge: true })
}

export async function updateCategories(spaceId: string, categories: Category[]) {
  await updateDoc(spaceRef(spaceId), { categories })
}

export type ItemInput = Pick<Item, 'title' | 'owner' | 'category' | 'memo' | 'place' | 'url' | 'priority'>

export async function addItem(spaceId: string, uid: string, input: ItemInput) {
  await addDoc(itemsCol(spaceId), {
    ...input,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    done: false,
    doneAt: null,
    doneMemo: '',
    rating: 0,
    photoIds: [],
    thumb: null,
  })
}

export async function updateItem(spaceId: string, itemId: string, input: Partial<ItemInput>) {
  await updateDoc(doc(itemsCol(spaceId), itemId), { ...input, updatedAt: serverTimestamp() })
}

export async function deleteItem(spaceId: string, item: Item) {
  const batch = writeBatch(db)
  for (const photoId of item.photoIds) batch.delete(doc(photosCol(spaceId), photoId))
  batch.delete(doc(itemsCol(spaceId), item.id))
  await batch.commit()
}

export interface CompletionInput {
  doneAt: Date
  doneMemo: string
  rating: number
  /** 残す既存写真の id */
  keepPhotoIds: string[]
  /** 新しく追加する写真（圧縮済み dataURL） */
  newPhotos: string[]
  /** 1枚目の写真から作ったサムネイル */
  thumb: string | null
}

export async function saveCompletion(spaceId: string, item: Item, input: CompletionInput) {
  const batch = writeBatch(db)
  for (const photoId of item.photoIds) {
    if (!input.keepPhotoIds.includes(photoId)) batch.delete(doc(photosCol(spaceId), photoId))
  }
  const newIds: string[] = []
  for (const data of input.newPhotos) {
    const ref = doc(photosCol(spaceId))
    newIds.push(ref.id)
    batch.set(ref, { itemId: item.id, data, createdAt: serverTimestamp() })
  }
  batch.update(doc(itemsCol(spaceId), item.id), {
    done: true,
    doneAt: Timestamp.fromDate(input.doneAt),
    doneMemo: input.doneMemo,
    rating: input.rating,
    photoIds: [...input.keepPhotoIds, ...newIds],
    thumb: input.thumb,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function undoCompletion(spaceId: string, itemId: string) {
  // 写真やメモは残しておき、もう一度達成にしたときに復元されるようにする
  await updateDoc(doc(itemsCol(spaceId), itemId), { done: false, updatedAt: serverTimestamp() })
}

export async function fetchPhotos(spaceId: string, itemId: string): Promise<Photo[]> {
  const snap = await getDocs(query(photosCol(spaceId), where('itemId', '==', itemId)))
  return snap.docs.map((d) => ({ id: d.id, itemId, data: d.data().data as string }))
}
