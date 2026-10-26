import { useState, type FormEvent } from 'react'
import { updateItem, type ItemInput } from '../data'
import type { Category, Item, Member } from '../types'
import { Chips, Dots, Segmented, Sheet } from './ui'

interface Props {
  spaceId: string
  uid: string
  members: Member[]
  categories: Category[]
  item: Item
  onClose: () => void
}

/** 書いた項目を書き直す（追加はリストの空いた行から） */
export function ItemForm({ spaceId, uid, members, categories, item, onClose }: Props) {
  const [form, setForm] = useState<ItemInput>({
    title: item.title,
    owner: item.owner,
    category: item.category,
    memo: item.memo,
    place: item.place,
    url: item.url,
    priority: item.priority,
  })
  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)
  const owners = [
    { value: 'both', label: 'ふたりで' },
    { value: uid, label: me?.displayName ?? '自分' },
    ...(partner ? [{ value: partner.uid, label: partner.displayName }] : []),
  ]

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
          <span className="field-label">だれの</span>
          <Segmented label="だれの" options={owners} value={form.owner} onChange={(v) => set('owner', v)} />
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
