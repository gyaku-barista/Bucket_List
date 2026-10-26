import type { Category } from './types'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'movie', name: '映画・ドラマ', mark: '映' },
  { id: 'travel', name: '旅行', mark: '旅' },
  { id: 'book', name: '読書', mark: '読' },
  { id: 'cafe', name: 'カフェ', mark: '珈' },
  { id: 'restaurant', name: '飲食店', mark: '食' },
  { id: 'outing', name: 'おでかけ', mark: '歩' },
  { id: 'activity', name: '体験・アクティビティ', mark: '験' },
  { id: 'event', name: 'イベント・ライブ', mark: '響' },
  { id: 'shopping', name: '買い物', mark: '買' },
  { id: 'home', name: 'おうち', mark: '家' },
  { id: 'anniversary', name: '記念日', mark: '祝' },
  { id: 'other', name: 'その他', mark: '他' },
]

const DEFAULT_MARKS = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, c.mark]))

const FALLBACK: Category = { id: 'other', name: 'その他', mark: '他' }

export function findCategory(categories: Category[], id: string): Category {
  return categories.find((c) => c.id === id) ?? FALLBACK
}

/**
 * カテゴリを表す一文字。初期カテゴリは固定の漢字、追加カテゴリは名前の一文字目。
 * 以前のバージョンで保存された絵文字 (emoji フィールド) は使わない。
 */
export function markOf(category: Category): string {
  return DEFAULT_MARKS[category.id] ?? category.mark ?? Array.from(category.name)[0] ?? '他'
}
