import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { addItem, markDone } from '../data'
import { findCategory } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { Chips, Icon, inkOf, Segmented, Sheet as SheetFrame, shortDate } from './ui'

type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sort = 'new' | 'priority'
type Sheet = { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'settings' } | { kind: 'filter' }
type Toast = { text: string; action?: { label: string; run: () => void } }

const millis = (t: Item['createdAt']) => t?.toMillis() ?? Number.MAX_SAFE_INTEGER

/** 右にこれだけ引くと「かなえた」になる */
const SWIPE_DONE = 88

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

/** 紙の上の一行。右にスワイプすると onSwipe、タップすると onOpen */
function Line({ swipeable, onSwipe, onOpen, className, children }: { swipeable: boolean; onSwipe: () => void; onOpen: () => void; className: string; children: ReactNode }) {
  const start = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null)
  const swiped = useRef(false)
  const [dx, setDx] = useState(0)

  const onTouchStart = (e: TouchEvent) => {
    if (!swipeable) return
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null }
  }
  const onTouchMove = (e: TouchEvent) => {
    const s = start.current
    if (!s) return
    const x = e.touches[0].clientX - s.x
    const y = e.touches[0].clientY - s.y
    // 最初に動いた向きで、横のスワイプか縦のスクロールかを決める
    if (s.horizontal === null && Math.hypot(x, y) > 8) s.horizontal = Math.abs(x) > Math.abs(y) && x > 0
    if (s.horizontal) setDx(Math.max(0, Math.min(x, 140)))
  }
  const onTouchEnd = () => {
    if (start.current?.horizontal) {
      swiped.current = true
      if (dx >= SWIPE_DONE) onSwipe()
    }
    start.current = null
    setDx(0)
  }

  return (
    <li className={className} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
      {dx > 0 && (
        <span className={'swipe-hint' + (dx >= SWIPE_DONE ? ' ready' : '')} style={{ opacity: Math.min(1, dx / SWIPE_DONE) }} aria-hidden>
          かなえた
        </span>
      )}
      <button
        className="line"
        style={dx ? { transform: `translateX(${dx}px)`, transition: 'none' } : undefined}
        onClick={() => {
          if (swiped.current) {
            swiped.current = false
            return
          }
          onOpen()
        }}
      >
        {children}
      </button>
    </li>
  )
}

export function MainScreen({ uid, spaceId }: { uid: string; spaceId: string }) {
  const { space, members, items } = useSpace(spaceId)
  const [ownerTab, setOwnerTab] = useState<OwnerTab>('both')
  const [category, setCategory] = useState<string>('all')
  const [sort, setSort] = useState<Sort>('new')
  const [onlyOpen, setOnlyOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState('')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [picked, setPicked] = useState<Item | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const composing = useRef(false)
  const lastWrite = useRef<{ title: string; at: number } | null>(null)
  const draftInput = useRef<HTMLInputElement>(null)
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

  // かなえた項目も移動させず、書いた順のまま同じ紙に並べる
  const lines = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    const list = byOwner
      .filter((i) => (category === 'all' || i.category === category) && (!kw || [i.title, i.memo, i.place, i.doneMemo].some((s) => s.toLowerCase().includes(kw))))
      .sort((a, b) => millis(a.createdAt) - millis(b.createdAt))
    if (sort === 'priority') list.sort((a, b) => b.priority - a.priority)
    return list
  }, [byOwner, category, keyword, sort])

  // 紙の右上に貼る写真は、いちばん最近の思い出から
  const pinnedPhoto = useMemo(
    () => (items ?? []).filter((i) => i.done && i.thumb).sort((a, b) => millis(b.doneAt) - millis(a.doneAt))[0]?.thumb ?? null,
    [items],
  )

  if (!space || !items) return <div className="loading">ひらいています…</div>

  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined
  const openCount = lines.filter((i) => !i.done).length
  const doneCount = lines.length - openCount
  const whose = ownerTab === 'both' ? 'ふたり' : ownerTab === 'me' ? (me?.displayName ?? '自分') : ownerTab === 'partner' ? (partner?.displayName ?? '相手') : 'みんな'
  const filtered = category !== 'all' || sort !== 'new'

  const write = (e?: FormEvent) => {
    e?.preventDefault()
    const title = draft.trim()
    if (!title) return draftInput.current?.focus()
    // 同じ文を続けて送ってしまったとき（変換確定の Enter など）は1件だけにする
    const last = lastWrite.current
    if (last && last.title === title && Date.now() - last.at < 3000) return setDraft('')
    lastWrite.current = { title, at: Date.now() }
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

  // 日本語入力の変換を確定する Enter では送らない
  const onDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    if (composing.current || e.nativeEvent.isComposing || e.keyCode === 229) return
    write()
  }

  const complete = (item: Item) => {
    markDone(spaceId, item.id).catch((err) => alert('書き込めませんでした: ' + err))
    setToast({ text: `「${item.title}」をかなえました`, action: { label: '思い出を残す', run: () => setSheet({ kind: 'complete', id: item.id }) } })
  }

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done)
    if (!candidates.length) return setToast({ text: 'まだ、これからのことが書かれていません' })
    let next = candidates[Math.floor(Math.random() * candidates.length)]
    if (candidates.length > 1 && next.id === picked?.id) next = candidates.find((i) => i.id !== picked.id)!
    setPicked(next)
  }

  return (
    <main className="app">
      <header className="top">
        <div className="top-row">
          <h1>バケットリスト</h1>
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
            <button className={'icon-btn' + (filtered ? ' marked' : '')} onClick={() => setSheet({ kind: 'filter' })} aria-label="絞り込みと設定">
              <Icon name="settings" />
            </button>
          </div>
        </div>
        {searching && (
          <div className="search">
            <Icon name="search" size={18} />
            <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ことばでさがす" aria-label="さがすことば" autoFocus />
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
      </header>

      <section className="paper">
        {pinnedPhoto && (
          <button className="pinned" onClick={pickRandom} aria-label="今日の一枚（迷ったら、ひとつ選びます）">
            <span className="tape" aria-hidden />
            <img src={pinnedPhoto} alt="" />
          </button>
        )}
        <header className="paper-head">
          <h2 className="paper-title">{whose}のやりたいこと</h2>
          <p className="paper-tally">
            <button className={onlyOpen ? 'on' : ''} onClick={() => setOnlyOpen(!onlyOpen)} aria-pressed={onlyOpen}>
              これから {openCount}
            </button>
            <span aria-hidden>・</span>
            <span>かなえた {doneCount}</span>
            {category !== 'all' && <span className="paper-filter">{findCategory(space.categories, category).name}</span>}
          </p>
        </header>

        <ol className="lines">
          {lines.map((item, i) => {
            const ink = inkOf(item.createdBy, memberOrder)
            return (
              <Line
                key={item.id}
                className={['row', item.done ? 'done' : '', item.done && onlyOpen ? 'dim' : '', fresh.isAdded(item) ? 'appear' : ''].filter(Boolean).join(' ')}
                swipeable={!item.done}
                onSwipe={() => complete(item)}
                onOpen={() => setSheet({ kind: 'detail', id: item.id })}
              >
                <span className="row-no">{i + 1}</span>
                <span className={'row-text ' + ink}>
                  {item.done ? (
                    <>
                      <s className={fresh.isStruck(item) ? 'strike drawing' : 'strike'}>{item.title}</s>
                      {item.doneAt && (
                        <span className="row-done-date" aria-label={`${shortDate(item.doneAt.toDate())}にかなえた`}>
                          {shortDate(item.doneAt.toDate())}
                        </span>
                      )}
                    </>
                  ) : (
                    item.title
                  )}
                </span>
                <span className="row-date">{item.createdAt && shortDate(item.createdAt.toDate())}</span>
                {item.thumb && (
                  <span className="row-photo" aria-hidden>
                    <span className="tape" />
                    <img src={item.thumb} alt="" />
                  </span>
                )}
              </Line>
            )
          })}
        </ol>
        {lines.length === 0 && <p className="paper-empty">{keyword ? '見つかりませんでした' : '下の欄から書いてみましょう'}</p>}
      </section>

      <form className="composer" onSubmit={write}>
        <input
          ref={draftInput}
          className={inkOf(uid, memberOrder)}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onDraftKeyDown}
          onCompositionStart={() => (composing.current = true)}
          onCompositionEnd={() => (composing.current = false)}
          placeholder={`${whose}のやりたいことを書く`}
          maxLength={100}
          enterKeyHint="done"
          aria-label="やりたいことを書き足す"
        />
        <button className="composer-send" aria-label="書き足す">
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

      {sheet?.kind === 'filter' && (
        <SheetFrame title="絞り込み" onClose={() => setSheet(null)}>
          <div className="form">
            <div className="field">
              <span className="field-label">分類</span>
              <Chips options={[{ value: 'all', label: 'すべて' }, ...space.categories.map((c) => ({ value: c.id, label: c.name }))]} value={category} onChange={setCategory} />
            </div>
            <div className="field">
              <span className="field-label">並び</span>
              <Segmented
                label="並び"
                options={[
                  { value: 'new', label: '書いた順' },
                  { value: 'priority', label: '大事な順' },
                ]}
                value={sort}
                onChange={setSort}
              />
            </div>
            <div className="field">
              <span className="field-label">かなえたこと</span>
              <Segmented
                label="かなえたこと"
                options={[
                  { value: 'show', label: 'そのまま見せる' },
                  { value: 'dim', label: '薄くする' },
                ]}
                value={onlyOpen ? 'dim' : 'show'}
                onChange={(v) => setOnlyOpen(v === 'dim')}
              />
            </div>
            <div className="form-actions">
              <button className="btn primary" onClick={() => setSheet(null)}>
                この条件で見る
              </button>
              <button className="btn ghost" onClick={() => setSheet({ kind: 'settings' })}>
                設定（名前・写真・招待コード・分類）
              </button>
            </div>
          </div>
        </SheetFrame>
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
