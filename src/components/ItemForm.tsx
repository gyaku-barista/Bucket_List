import { useState, type FormEvent } from 'react'
import { addItem, updateItem, type ItemInput } from '../data'
import type { Category, Item, Member } from '../types'
import { Sheet, Stars } from './ui'

interface Props {
  spaceId: string
  uid: string
  members: Member[]
  categories: Category[]
  item?: Item
  defaults?: Partial<ItemInput>
  onClose: () => void
}

export function ItemForm({ spaceId, uid, members, categories, item, defaults, onClose }: Props) {
  const [form, setForm] = useState<ItemInput>({
    title: item?.title ?? '',
    owner: item?.owner ?? defaults?.owner ?? 'both',
    category: item?.category ?? defaults?.category ?? categories[0]?.id ?? 'other',
    memo: item?.memo ?? '',
    place: item?.place ?? '',
    url: item?.url ?? '',
    priority: item?.priority ?? 2,
  })
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof ItemInput>(key: K, value: ItemInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)
  const owners = [
    { value: 'both', label: 'ふたりで' },
    { value: uid, label: me?.displayName ?? '自分' },
    ...(partner ? [{ value: partner.uid, label: partner.displayName }] : []),
  ]

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const data = { ...form, title: form.title.trim(), url: form.url.trim() }
    // オフライン時は書き込み完了を待つと閉じられないので、結果を待たずに閉じる
    const pending = item ? updateItem(spaceId, item.id, data) : addItem(spaceId, uid, data)
    pending.catch((err) => alert('保存に失敗しました: ' + err))
    onClose()
  }

  return (
    <Sheet title={item ? '編集' : 'やりたいことを追加'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <label>
          やりたいこと
          <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={100} required autoFocus={!item} />
        </label>

        <fieldset>
          <legend>だれの？</legend>
          <div className="segmented">
            {owners.map((o) => (
              <button type="button" key={o.value} className={form.owner === o.value ? 'active' : ''} onClick={() => set('owner', o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>カテゴリ</legend>
          <div className="chips wrap">
            {categories.map((c) => (
              <button type="button" key={c.id} className={'chip' + (form.category === c.id ? ' active' : '')} onClick={() => set('category', c.id)}>
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>優先度</legend>
          <Stars value={form.priority} max={3} onChange={(v) => set('priority', v || 1)} symbol="♥" />
        </fieldset>

        <label>
          場所
          <input value={form.place} onChange={(e) => set('place', e.target.value)} maxLength={100} />
        </label>
        <label>
          URL
          <input type="url" inputMode="url" value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://" />
        </label>
        <label>
          メモ
          <textarea rows={3} value={form.memo} onChange={(e) => set('memo', e.target.value)} maxLength={2000} />
        </label>

        <button className="btn primary" disabled={busy}>
          保存
        </button>
      </form>
    </Sheet>
  )
}
