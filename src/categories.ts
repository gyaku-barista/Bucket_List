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
