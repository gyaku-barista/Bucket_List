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

/** 旧バージョンの「だれの」。'both' = ふたりで / それ以外は uid。表示には使わない */
export type Owner = 'both' | string

export interface Item {
  id: string
  title: string
  /** ふたりでやりたいこと。無い（古い項目）・false なら、書いた人「じぶん」のやりたいこと */
  shared?: boolean
  owner?: Owner
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
  /** かなえた人（古いデータには無いので、そのときは書いた人とみなす） */
  doneBy?: string
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
