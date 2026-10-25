import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { updateCategories, updateProfile } from '../data'
import { squareThumb } from '../image'
import type { Item, Member, Space } from '../types'
import { Avatar, Sheet } from './ui'

interface Props {
  space: Space
  uid: string
  members: Member[]
  items: Item[]
  onClose: () => void
}

export function Settings({ space, uid, members, items, onClose }: Props) {
  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)
  const [name, setName] = useState(me?.displayName ?? '')
  const [newEmoji, setNewEmoji] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== me?.displayName) updateProfile(space.id, uid, { displayName: trimmed })
  }

  const changeAvatar = async (file: File | undefined) => {
    if (!file) return
    try {
      await updateProfile(space.id, uid, { avatar: await squareThumb(file, 256) })
    } catch {
      alert('画像を設定できませんでした')
    }
  }

  const addCategory = () => {
    const n = newCategory.trim()
    if (!n) return
    updateCategories(space.id, [...space.categories, { id: 'c' + Date.now().toString(36), name: n, emoji: newEmoji.trim() || '🏷️' }])
    setNewCategory('')
    setNewEmoji('')
  }

  const removeCategory = (id: string) => {
    const used = items.filter((i) => i.category === id).length
    const message = used ? `このカテゴリのアイテムが${used}件あります。削除すると「その他」として表示されます。削除しますか？` : 'このカテゴリを削除しますか？'
    if (confirm(message)) updateCategories(space.id, space.categories.filter((c) => c.id !== id))
  }

  const moveCategory = (index: number, delta: number) => {
    const list = [...space.categories]
    const target = index + delta
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target], list[index]]
    updateCategories(space.id, list)
  }

  const share = async () => {
    const text = `ふたりのバケットリストに招待します！\n招待コード: ${space.inviteCode}\n${location.href}`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else {
      await navigator.clipboard.writeText(text)
      alert('コピーしました')
    }
  }

  return (
    <Sheet title="設定" onClose={onClose}>
      <div className="form">
        <section className="settings-section">
          <h3>プロフィール</h3>
          <div className="profile-row">
            <label className="avatar-edit">
              <Avatar member={me} size={72} />
              <span>変更</span>
              <input type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
            </label>
            <label className="grow">
              表示名
              <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} maxLength={20} />
            </label>
          </div>
          {me?.avatar && (
            <button className="link-btn" onClick={() => updateProfile(space.id, uid, { avatar: null })}>
              アイコンを削除
            </button>
          )}
        </section>

        <section className="settings-section">
          <h3>パートナー</h3>
          {partner ? (
            <div className="profile-row">
              <Avatar member={partner} size={40} />
              <span>{partner.displayName}</span>
            </div>
          ) : (
            <>
              <p className="hint">相手にこの招待コードを送って、アプリで入力してもらってください。</p>
              <div className="invite-code">{space.inviteCode}</div>
              <button className="btn" onClick={share}>
                招待を送る
              </button>
            </>
          )}
        </section>

        <section className="settings-section">
          <h3>カテゴリ</h3>
          <ul className="category-list">
            {space.categories.map((c, i) => (
              <li key={c.id}>
                <span className="grow">
                  {c.emoji} {c.name}
                </span>
                <button className="icon-btn small" onClick={() => moveCategory(i, -1)} aria-label="上へ">
                  ↑
                </button>
                <button className="icon-btn small" onClick={() => moveCategory(i, 1)} aria-label="下へ">
                  ↓
                </button>
                <button className="icon-btn small" onClick={() => removeCategory(c.id)} aria-label="削除">
                  🗑
                </button>
              </li>
            ))}
          </ul>
          <div className="add-category">
            <input className="emoji-input" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} placeholder="🏷️" maxLength={4} />
            <input className="grow" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="新しいカテゴリ" maxLength={20} />
            <button className="btn" onClick={addCategory}>
              追加
            </button>
          </div>
        </section>

        <button className="btn" onClick={() => signOut(auth)}>
          ログアウト
        </button>
      </div>
    </Sheet>
  )
}
