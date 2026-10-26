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

/**
 * 分類の色。紙の上では半透明のテープ（と蛍光ペンの跡）として使い、
 * 思い出のカードではこの色を紙の色で薄めて敷く。
 */
const TAPE = {
  sky: '#a9c6d9',
  rose: '#e3b5a8',
  honey: '#e8cf94',
  sage: '#b5c9a5',
  lilac: '#d3c7e0',
}

const TAPE_OF: Record<string, string> = {
  travel: TAPE.sky,
  outing: TAPE.sky,
  movie: TAPE.rose,
  event: TAPE.rose,
  anniversary: TAPE.rose,
  cafe: TAPE.honey,
  restaurant: TAPE.honey,
  shopping: TAPE.honey,
  book: TAPE.sage,
  activity: TAPE.sage,
  home: TAPE.sage,
}

/** その他・自分で足した分類は、薄い藤色 */
export function tapeOf(categoryId: string): string {
  return TAPE_OF[categoryId] ?? TAPE.lilac
}
