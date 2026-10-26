import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'movie', name: '映画・ドラマ' },
  { id: 'travel', name: '旅行' },
  { id: 'book', name: '読書' },
  { id: 'cafe', name: 'カフェ' },
  { id: 'restaurant', name: '飲食店' },
  { id: 'outing', name: 'おでかけ' },
  { id: 'activity', name: '体験' },
  { id: 'event', name: 'イベント・ライブ' },
  { id: 'shopping', name: '買い物' },
  { id: 'home', name: 'おうち' },
  { id: 'anniversary', name: '記念日' },
  { id: 'other', name: 'その他' },
]

const FALLBACK: Category = { id: 'other', name: 'その他' }

export function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? FALLBACK
}

/** カテゴリの淡い色。紙の上ではテープや蛍光ペンの跡として使う */
const PALE = {
  sky: '#d8e6f0',
  pink: '#f2dcd8',
  yellow: '#f5e9c8',
  green: '#dde8d8',
}

const PALE_OF: Record<string, string> = {
  travel: PALE.sky,
  outing: PALE.sky,
  movie: PALE.pink,
  event: PALE.pink,
  anniversary: PALE.pink,
  cafe: PALE.yellow,
  restaurant: PALE.yellow,
  shopping: PALE.yellow,
  book: PALE.green,
  activity: PALE.green,
  home: PALE.green,
}

/** 色の決まっていない分類（その他・自分で足した分類）は、ふつうのマスキングテープの色 */
export const PLAIN_TAPE = '#e6dcc8'

export function paleOf(categoryId: string): string {
  return PALE_OF[categoryId] ?? PLAIN_TAPE
}
