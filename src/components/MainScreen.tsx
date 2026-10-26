import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { addItem, markDone, undoCompletion } from '../data'
import { findCategory } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { Avatar, Chips, Icon, inkOf, Segmented, shortDate } from './ui'

type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sort = 'new' | 'priority'
type Sheet = { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'settings' }
type Toast = { text: string; action?: { label: string; run: () => void } }

const millis = (t: Item['createdAt']) => t?.toMillis() ?? Number.MAX_SAFE_INTEGER

/**
 * 新しく増えた行と、新しく線を引いた行だけを動かすための記録。
 * 最初に読み込んだ分は動かさない。
 */
function useFreshIds(items: Item[] | null) {
  const known = useRef<{ ids: Set<string>; done: Set<string> } | null>(null)
  const [recent, setRecent] = useState<{ added: Set<string>; struck: Set<string> }>({ added: new Set(), struck: new Set() })

  useEffect(() => {
    if (!items) return
    const ids = new Set(items.map((i) => i.id))
    const done = new Set(items.filter((i) => i.done).map((i) => i.id))
    const prev = known.current
    known.current = { ids, done }
    if (!prev) return
    const added = [...ids].filter((id) => !prev.ids.has(id))
    const struck = [...done].filter((id) => !prev.done.has(id))
    if (!added.length && !struck.length) return
    setRecent((r) => ({ added: new Set([...r.added, ...added]), struck: new Set([...r.struck, ...struck]) }))
    const timer = setTimeout(
      () =>
        setRecent((r) => ({
          added: new Set([...r.added].filter((id) => !added.includes(id))),
          struck: new Set([...r.struck].filter((id) => !struck.includes(id))),
        })),
      2000,
    )
    return () => clearTimeout(timer)
  }, [items])

  // effect が走る前の最初の描画でも動きが始まるよう、記録にない id もその場で新しいとみなす
  return {
    isAdded: (item: Item) => (known.current !== null && !known.current.ids.has(item.id)) || recent.added.has(item.id),
    isStruck: (item: Item) => (known.current !== null && item.done && !known.current.done.has(item.id)) || recent.struck.has(item.id),
  }
}

export function MainScreen({ uid, spaceId }: { uid: string; spaceId: string }) {
  const { space, members, items } = useSpace(spaceId)
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('both')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('new')
  const [searching, setSearching] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState('')
  const [showDone, setShowDone] = useState(true)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [picked, setPicked] = useState<Item | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const fresh = useFreshIds(items)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const me = members.find((m) => m.uid === uid)
  const partner = members.find((m) => m.uid !== uid)
  const memberOrder = space?.members ?? []

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

  const { open, done } = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = byOwner.filter(
      (i) => (category === 'all' || i.category === category) && (!kw || [i.title, i.memo, i.place, i.doneMemo].some((s) => s.toLowerCase().includes(kw))),
    )
    const open = list.filter((i) => !i.done)
    if (sort === 'priority') open.sort((a, b) => b.priority - a.priority || millis(b.createdAt) - millis(a.createdAt))
    const done = list.filter((i) => i.done).sort((a, b) => millis(b.doneAt) - millis(a.doneAt))
    return { open, done }
  }, [byOwner, category, keyword, sort])

  // 今日の一枚の写真は、いちばん最近の思い出から
  const cornerPhoto = useMemo(
    () => (items ?? []).filter((i) => i.done && i.thumb).sort((a, b) => millis(b.doneAt) - millis(a.doneAt))[0]?.thumb ?? null,
    [items],
  )

  if (!space || !items) return <div className="loading">ひらいています…</div>

  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined
  const openTotal = byOwner.filter((i) => !i.done).length
  const doneTotal = byOwner.length - openTotal
  const rate = byOwner.length ? doneTotal / byOwner.length : 0
  const ownerName = ownerTab === 'both' ? 'ふたり' : ownerTab === 'me' ? (me?.displayName ?? '自分') : ownerTab === 'partner' ? (partner?.displayName ?? '相手') : 'みんな'

  const write = (e: FormEvent) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    addItem(spaceId, uid, {
      title,
      owner: ownerTab === 'me' ? uid : ownerTab === 'partner' && partner ? partner.uid : 'both',
      category: category === 'all' ? 'other' : category,
      memo: '',
      place: '',
      url: '',
      priority: 2,
    }).catch((err) => alert('書き込めませんでした: ' + err))
    setDraft('')
  }

  const complete = (item: Item) => {
    markDone(spaceId, item.id).catch((err) => alert('書き込めませんでした: ' + err))
    setToast({ text: `「${item.title}」をかなえました`, action: { label: '思い出を残す', run: () => setSheet({ kind: 'complete', id: item.id }) } })
  }

  const reopen = (item: Item) => {
    undoCompletion(spaceId, item.id).catch((err) => alert('戻せませんでした: ' + err))
    setToast({ text: `「${item.title}」をこれからに戻しました` })
  }

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done)
    if (!candidates.length) return setToast({ text: 'まだ、これからのことが書かれていません' })
    let next = candidates[Math.floor(Math.random() * candidates.length)]
    if (candidates.length > 1 && next.id === picked?.id) next = candidates.find((i) => i.id !== picked.id)!
    setPicked(next)
  }

  // 分類が「その他」のときや分類で絞っているときは、分類名を出さない
  const meta = (item: Item) =>
    [category === 'all' && item.category !== 'other' ? findCategory(space.categories, item.category).name : '', item.place].filter(Boolean).join(' · ')

  return (
    <main className="app">
      <header className="top">
        <div className="top-row">
          <h1>ふたりのやりたいこと</h1>
          <div className="top-actions">
            <button
              className={'icon-btn' + (searching ? ' active' : '')}
              onClick={() => {
                if (searching) setKeyword('')
                setSearching(!searching)
              }}
              aria-label="さがす"
              aria-pressed={searching}
            >
              <Icon name="search" />
            </button>
            <button className="icon-btn" onClick={() => setSheet({ kind: 'settings' })} aria-label="設定">
              <Icon name="settings" />
            </button>
          </div>
        </div>
        <div className="couple">
          <span className={'person ' + inkOf(me?.uid, memberOrder)}>
            <Avatar member={me} ink={inkOf(me?.uid, memberOrder)} size={24} />
            {me?.displayName}
          </span>
          {partner ? (
            <span className={'person ' + inkOf(partner.uid, memberOrder)}>
              <Avatar member={partner} ink={inkOf(partner.uid, memberOrder)} size={24} />
              {partner.displayName}
            </span>
          ) : (
            <button className="invite-hint" onClick={() => setSheet({ kind: 'settings' })}>
              相手を招待する
            </button>
          )}
        </div>
      </header>

      {searching && (
        <div className="search">
          <Icon name="search" size={18} />
          <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ことばでさがす" aria-label="さがす" autoFocus />
        </div>
      )}

      <Segmented
        label="だれの"
        options={[
          { value: 'both', label: 'ふたりで' },
          { value: 'partner', label: partner?.displayName ?? '相手' },
          { value: 'me', label: me?.displayName ?? '自分' },
          { value: 'all', label: 'すべて' },
        ]}
        value={ownerTab}
        onChange={setOwnerTab}
      />

      <section className="overview">
        <div className="tally">
          <p>
            <span className="tally-label">{ownerName}のこれから</span>
            <b>{openTotal}</b>
          </p>
          <p>
            <span className="tally-label">かなえた</span>
            <b>{doneTotal}</b>
          </p>
          <div className="progress" aria-hidden>
            <i style={{ width: `${rate * 100}%` }} />
          </div>
        </div>
        <button className="today" onClick={pickRandom} aria-label="今日の一枚（迷ったら、ひとつ選びます）">
          <span className="today-photo">
            <span className="tape" aria-hidden />
            <span className="today-frame">{cornerPhoto && <img src={cornerPhoto} alt="" />}</span>
          </span>
          <span className="today-text">今日の一枚</span>
        </button>
      </section>

      <Chips
        scroll
        options={[{ value: 'all', label: 'すべて' }, ...space.categories.map((c) => ({ value: c.id, label: c.name }))]}
        value={category}
        onChange={setCategory}
      />

      <section className="page">
        <header className="page-header">
          <h2>これから</h2>
          <button className="text-btn" onClick={() => setSort(sort === 'new' ? 'priority' : 'new')}>
            <Icon name="sort" size={16} />
            {sort === 'new' ? '新しい順' : '大事な順'}
          </button>
        </header>
        <ul className="rows">
          {open.map((item) => (
            <li key={item.id} className={fresh.isAdded(item) ? 'appear' : undefined}>
              <button className="check" onClick={() => complete(item)} aria-label={`「${item.title}」をかなえた`}>
                <span />
              </button>
              <button className="row-body" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                <span className={'row-title ' + inkOf(item.createdBy, memberOrder)}>{item.title}</span>
                {meta(item) && <span className="row-meta">{meta(item)}</span>}
              </button>
              <span className="row-date">{item.createdAt && shortDate(item.createdAt.toDate())}</span>
            </li>
          ))}
        </ul>
        {open.length === 0 && <p className="empty">{keyword ? '見つかりませんでした' : '下の欄に、やりたいことを書いてみましょう'}</p>}
      </section>

      {done.length > 0 && (
        <section className="page">
          <header className="page-header">
            <h2>
              かなえたこと <span className="count">{done.length}</span>
            </h2>
            <button className="text-btn" onClick={() => setShowDone(!showDone)} aria-expanded={showDone}>
              {showDone ? 'たたむ' : 'ひらく'}
            </button>
          </header>
          {showDone && (
            <ul className="rows">
              {done.map((item) => (
                <li key={item.id} className="done">
                  <button className="check checked" onClick={() => reopen(item)} aria-label={`「${item.title}」をこれからに戻す`}>
                    <Icon name="check" size={14} />
                  </button>
                  <button className="row-body" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                    <span className={'row-title ' + inkOf(item.createdBy, memberOrder)}>
                      <s className={fresh.isStruck(item) ? 'strike drawing' : 'strike'}>{item.title}</s>
                    </span>
                    {item.doneMemo && <span className="row-meta">{item.doneMemo.split('\n')[0]}</span>}
                  </button>
                  {item.thumb ? <img className="row-thumb" src={item.thumb} alt="" /> : <span className="row-date">{item.doneAt && shortDate(item.doneAt.toDate())}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <form className="composer" onSubmit={write}>
        <input
          className={inkOf(uid, memberOrder)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`${ownerName}のやりたいことを書く`}
          maxLength={100}
          enterKeyHint="done"
          aria-label="やりたいことを書き足す"
        />
        <button className="composer-send" disabled={!draft.trim()} aria-label="書き足す">
          <Icon name="plus" />
        </button>
      </form>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.run()
                setToast(null)
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {picked && (
        <div className="sheet-backdrop center" onClick={() => setPicked(null)}>
          <div className="pick" role="dialog" aria-label="今日の一枚" onClick={(e) => e.stopPropagation()}>
            <span className="tape" aria-hidden />
            <p className="pick-lead">今日は、これはどうでしょう</p>
            <p className={'pick-title ' + inkOf(picked.createdBy, memberOrder)}>{picked.title}</p>
            <div className="pick-actions">
              <button className="btn" onClick={pickRandom}>
                ほかのを
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setSheet({ kind: 'detail', id: picked.id })
                  setPicked(null)
                }}
              >
                くわしく見る
              </button>
            </div>
          </div>
        </div>
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
          memberOrder={memberOrder}
          categories={space.categories}
          onEdit={() => setSheet({ kind: 'edit', id: sheetItem.id })}
          onComplete={() => setSheet({ kind: 'complete', id: sheetItem.id })}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.kind === 'complete' && sheetItem && (
        <CompleteForm
          spaceId={spaceId}
          item={sheetItem}
          // はじめてかなえたときは紙に戻り、線を引くところを見せる
          onClose={(saved) => setSheet(saved && !sheetItem.done ? null : { kind: 'detail', id: sheetItem.id })}
        />
      )}
      {sheet?.kind === 'settings' && <Settings space={space} uid={uid} members={members} items={items} onClose={() => setSheet(null)} />}
    </main>
  )
}
