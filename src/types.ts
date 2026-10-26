import type { Timestamp } from 'firebase/firestore'

export interface Category {
  id: string
  name: string
  /** 旧バージョンで保存された印。表示には使わない */
  mark?: string
  emoji?: string
}

export interface Space {
  id: string
  members: string[]
  inviteCode: string
  categories: Category[]
}

export interface Member {
  uid: string
  displayName: string
  avatar: string | null
}

/** 'both' = ふたりで / それ以外はやりたい人の uid */
export type Owner = 'both' | string

export interface Item {
  id: string
  title: string
  owner: Owner
  category: string
  memo: string
  place: string
  url: string
  priority: number
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
  done: boolean
  doneAt: Timestamp | null
  doneMemo: string
  rating: number
  photoIds: string[]
  thumb: string | null
}

export interface Photo {
  id: string
  itemId: string
  data: string
}
