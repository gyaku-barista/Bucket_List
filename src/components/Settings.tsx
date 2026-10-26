import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { updateCategories, updateProfile } from '../data'
import { imageErrorMessage, squareThumb } from '../image'
import type { Item, Member, Space } from '../types'
import { Avatar, inkOf } from './ui'

interface Props {
  space: Space
  uid: string
  members: Member[]
  items: Item[]
}

/** 下のナビゲーションから開く設定の画面 */
export function Settings({ space, uid, members, items }: Props) {
  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)
  const [name, setName] = useState(me?.displayName ?? '')
  const [newCategory, setNewCategory] = useState('')

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== me?.displayName) updateProfile(space.id, uid, { displayName: trimmed })
  }

  const changeAvatar = async (file: File | undefined) => {
    if (!file) return
    try {
      await updateProfile(space.id, uid, { avatar: await squareThumb(file, 256) })
    } catch (err) {
      alert(imageErrorMessage(err))
    }
  }

  const addCategory = () => {
    const n = newCategory.trim()
    if (!n) return
    updateCategories(space.id, [...space.categories, { id: 'c' + Date.now().toString(36), name: n }])
    setNewCategory('')
  }

  const removeCategory = (id: string) => {
    const used = items.filter((i) => i.category === id).length
    const message = used ? `この分類で書いたものが${used}つあります。消すと「その他」に入ります。消しますか？` : 'この分類を消しますか？'
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
    const text = `ふたりのやりたいことの紙に招待します。\n招待コード：${space.inviteCode}\n${location.href}`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else {
      await navigator.clipboard.writeText(text)
      alert('写しました')
    }
  }

  return (
    <section className="settings">
      <section>
        <h3 className="field-label">あなた</h3>
        <div className="profile">
          <Avatar member={me} size={56} />
          <label className="grow">
            <span className="field-label">名前</span>
            <input className={inkOf(uid, space.members)} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} maxLength={20} />
          </label>
        </div>
        <div className="form-actions">
          <label className="btn">
            写真を選ぶ
            <input type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
          </label>
          {me?.avatar && (
            <button className="btn ghost" onClick={() => updateProfile(space.id, uid, { avatar: null })}>
              写真をはずす
            </button>
          )}
        </div>
        <p className="note">
          あなたの書いた文字は{inkOf(uid, space.members) === 'ink-a' ? '紺' : 'セピア'}のインクで残ります。
        </p>
      </section>

      <section>
        <h3 className="field-label">相手</h3>
        {partner ? (
          <p className="profile">
            <Avatar member={partner} size={40} />
            <span className={'partner-name ' + inkOf(partner.uid, space.members)}>{partner.displayName}</span>
          </p>
        ) : (
          <>
            <p className="note">この招待コードを相手に送って、はじめの画面で書いてもらってください。</p>
            <p className="invite-code">{space.inviteCode}</p>
            <div className="form-actions">
              <button className="btn primary" onClick={share}>
                招待を送る
              </button>
            </div>
          </>
        )}
      </section>

      <section>
        <h3 className="field-label">分類</h3>
        <ul className="category-list">
          {space.categories.map((c, i) => (
            <li key={c.id}>
              <span className="grow">{c.name}</span>
              <button className="btn ghost" onClick={() => moveCategory(i, -1)} disabled={i === 0}>
                上へ
              </button>
              <button className="btn ghost" onClick={() => moveCategory(i, 1)} disabled={i === space.categories.length - 1}>
                下へ
              </button>
              <button className="btn ghost" onClick={() => removeCategory(c.id)}>
                消す
              </button>
            </li>
          ))}
        </ul>
        <form
          className="add-category"
          onSubmit={(e) => {
            e.preventDefault()
            addCategory()
          }}
        >
          <input className="grow" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="新しい分類" maxLength={20} />
          <button className="btn">足す</button>
        </form>
      </section>

      <div className="form-actions">
        <button className="btn ghost" onClick={() => signOut(auth)}>
          ログアウト
        </button>
      </div>
      <p className="note version">バージョン {__APP_VERSION__}</p>
    </section>
  )
}
