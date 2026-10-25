import { useMemo, useState } from 'react'
import { findCategory } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { Avatar, formatDate, OwnerBadge, Stars } from './ui'

type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sheet = { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'settings' }

const millis = (t: Item['createdAt']) => t?.toMillis() ?? Number.MAX_SAFE_INTEGER

export function MainScreen({ uid, spaceId }: { uid: string; spaceId: string }) {
  const { space, members, items } = useSpace(spaceId)
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('both')
  const [showDone, setShowDone] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<'new' | 'priority'>('new')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [picked, setPicked] = useState<Item | null>(null)

  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)

  const byOwner = useMemo(() => {
    const all = items ?? []
    switch (ownerTab) {
      case 'both':
        return all.filter((i) => i.owner === 'both')
      case 'me':
        return all.filter((i) => i.owner === uid)
      case 'partner':
        return all.filter((i) => i.owner !== 'both' && i.owner !== uid)
      default:
        return all
    }
  }, [items, ownerTab, uid])

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = byOwner.filter(
      (i) =>
        i.done === showDone &&
        (!category || i.category === category) &&
        (!kw || [i.title, i.memo, i.place, i.doneMemo].some((s) => s.toLowerCase().includes(kw))),
    )
    if (showDone) return list.sort((a, b) => millis(b.doneAt) - millis(a.doneAt))
    if (sort === 'priority') return list.sort((a, b) => b.priority - a.priority || millis(b.createdAt) - millis(a.createdAt))
    return list
  }, [byOwner, showDone, category, keyword, sort])

  if (!space || !items) return <div className="center-screen">読み込み中…</div>

  const doneCount = byOwner.filter((i) => i.done).length
  const rate = byOwner.length ? Math.round((doneCount / byOwner.length) * 100) : 0
  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done && (!category || i.category === category))
    if (!candidates.length) return alert('未達成のやりたいことがありません')
    setPicked(candidates[Math.floor(Math.random() * candidates.length)])
  }

  const tabs: { key: OwnerTab; label: string }[] = [
    { key: 'both', label: 'ふたりで' },
    { key: 'partner', label: partner?.displayName ?? '相手' },
    { key: 'me', label: me?.displayName ?? '自分' },
    { key: 'all', label: 'すべて' },
  ]

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-title">
          <span className="avatar-pair">
            <Avatar member={me} size={30} />
            {partner && <Avatar member={partner} size={30} />}
          </span>
          <h1>バケットリスト</h1>
        </div>
        <button className="icon-btn" onClick={() => setSheet({ kind: 'settings' })} aria-label="設定">
          ⚙️
        </button>
      </header>

      {!partner && (
        <button className="banner" onClick={() => setSheet({ kind: 'settings' })}>
          招待コード <b>{space.inviteCode}</b> を相手に送って、ふたりで使いはじめましょう →
        </button>
      )}

      <nav className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={ownerTab === t.key ? 'active' : ''} onClick={() => setOwnerTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <section className="progress">
        <div className="progress-text">
          <span>
            達成 <b>{doneCount}</b> / {byOwner.length}
          </span>
          <span>{rate}%</span>
        </div>
        <div className="progress-bar">
          <div style={{ width: rate + '%' }} />
        </div>
      </section>

      <div className="toolbar">
        <div className="segmented small">
          <button className={!showDone ? 'active' : ''} onClick={() => setShowDone(false)}>
            やりたい
          </button>
          <button className={showDone ? 'active' : ''} onClick={() => setShowDone(true)}>
            達成済み
          </button>
        </div>
        {!showDone && (
          <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'priority')} aria-label="並び順">
            <option value="new">新しい順</option>
            <option value="priority">優先度順</option>
          </select>
        )}
      </div>

      <input className="search" type="search" placeholder="🔍 検索" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

      <div className="chips scroll">
        <button className={'chip' + (!category ? ' active' : '')} onClick={() => setCategory(null)}>
          すべて
        </button>
        {space.categories.map((c) => (
          <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(category === c.id ? null : c.id)}>
            {c.emoji} {c.name}
          </button>
        ))}
      </div>

      <ul className="item-list">
        {visible.map((item) => {
          const c = findCategory(space.categories, item.category)
          return (
            <li key={item.id}>
              <button className={'item' + (item.done ? ' done' : '')} onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                {item.done && item.thumb ? <img className="item-thumb" src={item.thumb} alt="" /> : <span className="item-emoji">{c.emoji}</span>}
                <span className="item-body">
                  <span className="item-title">{item.title}</span>
                  <span className="item-sub">
                    {item.done && item.doneAt ? `🎉 ${formatDate(item.doneAt.toDate())}` : c.name}
                    {item.place && ` · 📍${item.place}`}
                  </span>
                </span>
                <span className="item-side">
                  <OwnerBadge owner={item.owner} members={members} />
                  {item.done ? item.rating > 0 && <Stars value={item.rating} max={5} /> : <Stars value={item.priority} max={3} symbol="♥" />}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {visible.length === 0 && <p className="empty">{showDone ? 'まだ達成したものはありません' : '「＋」からやりたいことを追加しよう'}</p>}

      <div className="fab-area">
        {!showDone && (
          <button className="fab secondary" onClick={pickRandom} aria-label="今日なにする？">
            🎲
          </button>
        )}
        <button className="fab" onClick={() => setSheet({ kind: 'add' })} aria-label="追加">
          ＋
        </button>
      </div>

      {picked && (
        <div className="sheet-backdrop" onClick={() => setPicked(null)}>
          <div className="card pick-card" onClick={(e) => e.stopPropagation()}>
            <p className="sub">今日はこれはどう？</p>
            <div className="pick-emoji">{findCategory(space.categories, picked.category).emoji}</div>
            <h3>{picked.title}</h3>
            <div className="actions">
              <button
                className="btn primary"
                onClick={() => {
                  setSheet({ kind: 'detail', id: picked.id })
                  setPicked(null)
                }}
              >
                詳しく見る
              </button>
              <button className="btn" onClick={pickRandom}>
                もう一回
              </button>
            </div>
          </div>
        </div>
      )}

      {sheet?.kind === 'add' && (
        <ItemForm
          spaceId={spaceId}
          uid={uid}
          members={members}
          categories={space.categories}
          defaults={{
            owner: ownerTab === 'me' ? uid : ownerTab === 'partner' && partner ? partner.uid : 'both',
            category: category ?? undefined,
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'edit' && sheetItem && (
        <ItemForm
          spaceId={spaceId}
          uid={uid}
          members={members}
          categories={space.categories}
          item={sheetItem}
          onClose={() => setSheet({ kind: 'detail', id: sheetItem.id })}
        />
      )}
      {sheet?.kind === 'detail' && sheetItem && (
        <ItemDetail
          spaceId={spaceId}
          item={sheetItem}
          members={members}
          categories={space.categories}
          onEdit={() => setSheet({ kind: 'edit', id: sheetItem.id })}
          onComplete={() => setSheet({ kind: 'complete', id: sheetItem.id })}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'complete' && sheetItem && (
        <CompleteForm spaceId={spaceId} item={sheetItem} onClose={() => setSheet({ kind: 'detail', id: sheetItem.id })} />
      )}
      {sheet?.kind === 'settings' && <Settings space={space} uid={uid} members={members} items={items} onClose={() => setSheet(null)} />}
    </div>
  )
}
