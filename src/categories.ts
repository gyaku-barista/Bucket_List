import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'movie', name: '映画・ドラマ', emoji: '🎬' },
  { id: 'travel', name: '旅行', emoji: '✈️' },
  { id: 'book', name: '読書', emoji: '📚' },
  { id: 'cafe', name: 'カフェ', emoji: '☕' },
  { id: 'restaurant', name: '飲食店', emoji: '🍽️' },
  { id: 'outing', name: 'おでかけ', emoji: '🚶' },
  { id: 'activity', name: '体験・アクティビティ', emoji: '🎨' },
  { id: 'event', name: 'イベント・ライブ', emoji: '🎤' },
  { id: 'shopping', name: '買い物', emoji: '🛍️' },
  { id: 'home', name: 'おうち', emoji: '🏠' },
  { id: 'anniversary', name: '記念日', emoji: '💐' },
  { id: 'other', name: 'その他', emoji: '✨' },
]

const FALLBACK: Category = { id: 'other', name: 'その他', emoji: '✨' }

export function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? FALLBACK
}
