import { useState, type FormEvent } from 'react'
import { updateItem, type ItemInput } from '../data'
import type { Category, Item } from '../types'
import { Chips, Dots, Segmented, Sheet } from './ui'

interface Props {
  spaceId: string
  categories: Category[]
  item: Item
  onClose: () => void
}

/** 書いた項目を書き直す（追加はリストの空いた行から） */
export function ItemForm({ spaceId, categories, item, onClose }: Props) {
  const [form, setForm] = useState<ItemInput>({
    title: item.title,
    shared: item.shared ?? false,
    category: item.category,
    memo: item.memo,
    place: item.place,
    url: item.url,
    priority: item.priority,
  })
  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    // オフライン時は書き込み完了を待つと閉じられないので、結果を待たずに閉じる
    updateItem(spaceId, item.id, { ...form, title: form.title.trim(), url: form.url.trim() }).catch((err) => alert('書き込めませんでした: ' + err))
    onClose()
  }

  return (
    <Sheet title="書き直す" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          <span className="field-label">やりたいこと</span>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={100} required />
        </label>

        <div className="field">
          <span className="field-label">ひとりで？ ふたりで？</span>
          <Segmented
            label="ひとりで？ ふたりで？"
            options={[
              { value: 'self', label: 'ひとりで' },
              { value: 'shared', label: 'ふたりで' },
            ]}
            value={form.shared ? 'shared' : 'self'}
            onChange={(v) => set('shared', v === 'shared')}
          />
        </div>

        <div className="field">
          <span className="field-label">分類</span>
          <Chips options={categories.map((c) => ({ value: c.id, label: c.name }))} value={form.category} onChange={(v) => set('category', v)} />
        </div>

        <div className="field">
          <span className="field-label">大事さ</span>
          <Dots value={form.priority} max={3} onChange={(v) => set('priority', v || 1)} label="大事さ" />
        </div>

        <label>
          <span className="field-label">場所</span>
          <input value={form.place} onChange={(e) => set('place', e.target.value)} maxLength={100} />
        </label>
        <label>
          <span className="field-label">リンク</span>
          <input type="url" inputMode="url" value={form.url} onChange={(e) => set('url', e.target.value)} />
        </label>
        <label>
          <span className="field-label">メモ</span>
          <textarea rows={3} value={form.memo} onChange={(e) => set('memo', e.target.value)} maxLength={2000} />
        </label>

        <div className="form-actions">
          <button className="btn primary">これで書く</button>
        </div>
      </form>
    </Sheet>
  )
}
