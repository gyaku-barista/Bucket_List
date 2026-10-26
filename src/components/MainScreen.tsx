import { useMemo, useState, type CSSProperties } from 'react'
import { findCategory, markOf } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { Avatar, formatDate, OwnerBadge, Pips } from './ui'

type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sheet = { kind: 'add' } | { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'settings' }

const millis = (t: Item['createdAt']) => t?.toMillis() ?? Number.MAX_SAFE_INTEGER
const pad2 = (n: number) => String(n).padStart(2, '0')

/** プリントごとに少しずつ違う傾き（id から決まるので再描画しても変わらない） */
function tilt(id: string): number {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0
  return ((Math.abs(h) % 7) - 3) * 0.9
}

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

  // 追加した順のコマ番号（フィルムの No. のように固定）
  const frameNo = useMemo(() => {
    const sorted = [...(items ?? [])].sort((a, b) => millis(a.createdAt) - millis(b.createdAt))
    return new Map(sorted.map((item, i) => [item.id, i + 1]))
  }, [items])

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

  if (!space || !items) return <div className="loading">LOADING</div>

  const doneCount = byOwner.filter((i) => i.done).length
  const rate = byOwner.length ? Math.round((doneCount / byOwner.length) * 100) : 0
  const strip = [...byOwner].sort((a, b) => millis(a.createdAt) - millis(b.createdAt))
  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done && (!category || i.category === category))
    if (!candidates.length) return alert('まだ「これから」のやりたいことがありません')
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
      <header className="masthead">
        <span className="kicker">BUCKET LIST · VOL.{new Date().getFullYear()}</span>
        <button className="text-btn" onClick={() => setSheet({ kind: 'settings' })}>
          設定
        </button>
        <div className="duo">
          <span className="avatar-pair">
            <Avatar member={me} size={38} />
            {partner && <Avatar member={partner} size={38} />}
          </span>
          <span className="duo-names">
            {me?.displayName}
            {partner && (
              <>
                <em>&amp;</em>
                {partner.displayName}
              </>
            )}
          </span>
        </div>
      </header>

      {!partner && (
        <button className="tape" onClick={() => setSheet({ kind: 'settings' })}>
          <span>INVITE</span>
          <b>{space.inviteCode}</b>
          <span>このコードを相手に送ってください</span>
        </button>
      )}

      <section className="counter" aria-label={`達成 ${doneCount} / ${byOwner.length}`}>
        <span className="counter-num">{pad2(doneCount)}</span>
        <div className="counter-side">
          <span className="counter-den">/ {pad2(byOwner.length)}</span>
          <span className="counter-label">DEVELOPED — {rate}%</span>
        </div>
        <div className="filmstrip" aria-hidden>
          {strip.map((i) => (
            <i key={i.id} className={i.done ? 'lit' : ''} />
          ))}
          {strip.length === 0 && <i />}
        </div>
      </section>

      <nav className="owners">
        {tabs.map((t) => (
          <button key={t.key} className={ownerTab === t.key ? 'active' : ''} onClick={() => setOwnerTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="modes">
        <button className={!showDone ? 'active' : ''} onClick={() => setShowDone(false)}>
          <span>これから</span>
          <small>LATENT</small>
        </button>
        <button className={showDone ? 'active' : ''} onClick={() => setShowDone(true)}>
          <span>思い出</span>
          <small>DEVELOPED</small>
        </button>
        {!showDone && (
          <select value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'priority')} aria-label="並び順">
            <option value="new">新しい順</option>
            <option value="priority">優先度順</option>
          </select>
        )}
      </div>

      <div className="filters">
        <input className="search" type="search" placeholder="SEARCH —" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <div className="chips scroll">
          <button className={'chip' + (!category ? ' active' : '')} onClick={() => setCategory(null)}>
            すべて
          </button>
          {space.categories.map((c) => (
            <button key={c.id} className={'chip' + (category === c.id ? ' active' : '')} onClick={() => setCategory(category === c.id ? null : c.id)}>
              <span className="chip-mark">{markOf(c)}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {showDone ? (
        <ul className="prints">
          {visible.map((item, i) => {
            const c = findCategory(space.categories, item.category)
            return (
              <li key={item.id} style={{ '--i': i, '--tilt': `${tilt(item.id)}deg` } as CSSProperties}>
                <button className="print" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                  {item.thumb ? (
                    <img src={item.thumb} alt="" />
                  ) : (
                    <span className="print-blank">
                      <span>{markOf(c)}</span>
                    </span>
                  )}
                  <span className="print-caption">{item.title}</span>
                  <span className="print-date">{item.doneAt ? formatDate(item.doneAt.toDate()) : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <ol className="negatives">
          {visible.map((item, i) => {
            const c = findCategory(space.categories, item.category)
            return (
              <li key={item.id} style={{ '--i': i } as CSSProperties}>
                <button className="neg" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                  <span className="neg-no">No.{pad2(frameNo.get(item.id) ?? 0)}</span>
                  <span className="neg-mark" aria-hidden>
                    {markOf(c)}
                  </span>
                  <span className="neg-title">{item.title}</span>
                  <span className="neg-meta">
                    {c.name}
                    {item.place && <> / {item.place}</>}
                  </span>
                  <span className="neg-side">
                    <OwnerBadge owner={item.owner} members={members} />
                    <Pips value={item.priority} max={3} label="優先度" />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
      {visible.length === 0 && (
        <p className="empty">
          {showDone ? (
            <>
              まだ現像された思い出はありません。
              <br />
              最初の一枚を、ふたりで。
            </>
          ) : (
            <>
              右下の ＋ から、
              <br />
              やりたいことを一つ書いてみましょう。
            </>
          )}
        </p>
      )}

      <div className="fab-area">
        {!showDone && (
          <button className="fab-ghost" onClick={pickRandom}>
            今日の一枚
          </button>
        )}
        <button className="shutter" onClick={() => setSheet({ kind: 'add' })} aria-label="追加">
          <span>＋</span>
        </button>
      </div>

      {picked && (
        <div className="sheet-backdrop center" onClick={() => setPicked(null)}>
          <div className="pick" onClick={(e) => e.stopPropagation()}>
            <span className="kicker">TODAY'S FRAME</span>
            <div className="pick-mark">{markOf(findCategory(space.categories, picked.category))}</div>
            <h3>{picked.title}</h3>
            <div className="actions row">
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
          frameNo={frameNo.get(sheetItem.id) ?? 0}
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
