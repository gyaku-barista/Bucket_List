import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type TouchEvent } from 'react'
import { addItem, markDone } from '../data'
import { findCategory, tapeOf } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { CoupleArt } from './illustrations'
import { Memories } from './Memories'
import { Avatar, Chips, Icon, inkOf, Segmented, Sheet as SheetFrame, shortDate, wash } from './ui'

type Tab = 'list' | 'memories' | 'settings'
type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sort = 'new' | 'priority'
type Sheet = { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'filter' }
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
  const [tab, setTab] = useState<Tab>('list')
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

  if (!space || !items) return <div className="loading">ひらいています…</div>

  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined
  const openCount = lines.filter((i) => !i.done).length
  const doneCount = lines.length - openCount
  const whose = ownerTab === 'both' ? 'ふたり' : ownerTab === 'me' ? (me?.displayName ?? '自分') : ownerTab === 'partner' ? (partner?.displayName ?? '相手') : 'みんな'
  const filtered = category !== 'all' || sort !== 'new'
  const myName = me?.displayName ?? '自分'
  const partnerName = partner?.displayName ?? '相手'
  // 空のときの一文（罫線に合わせて行ごとに書く）
  const emptyLines =
    ownerTab === 'both'
      ? ['ふたりでやりたいことを、', 'ひとつ書いてみましょう']
      : ownerTab === 'me'
        ? [`${myName}のやりたいことを、`, 'ひとつ書いてみましょう']
        : ownerTab === 'partner'
          ? partner
            ? [`${partnerName}のやりたいことは、`, 'まだありません']
            : [`${partnerName}を招待すると、`, `ここに${partnerName}の`, 'やりたいことが並びます']
          : ['最初のひとつを書いてみましょう']
  // 線画の塗りは、選んでいる人のインクをごく薄く
  const artFill = wash(ownerTab === 'partner' ? inkOf(partner?.uid ?? memberOrder[1], memberOrder) : inkOf(uid, memberOrder))

  const invite = async () => {
    const text = `ふたりのバケットリストに招待します。\n招待コード：${space.inviteCode}\n${location.href}`
    if (navigator.share) await navigator.share({ text }).catch(() => {})
    else {
      await navigator.clipboard.writeText(text).catch(() => {})
      setToast({ text: '招待の文面を写しました' })
    }
  }

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
    markDone(spaceId, item.id, uid).catch((err) => alert('書き込めませんでした: ' + err))
    setToast({ text: `「${item.title}」をかなえました`, action: { label: '思い出を残す', run: () => setSheet({ kind: 'complete', id: item.id }) } })
  }

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done)
    if (!candidates.length) return setToast({ text: 'まだ、これからのことが書かれていません' })
    let next = candidates[Math.floor(Math.random() * candidates.length)]
    if (candidates.length > 1 && next.id === picked?.id) next = candidates.find((i) => i.id !== picked.id)!
    setPicked(next)
  }

  const tabs: { key: Tab; label: string; icon: 'list' | 'memories' | 'gear' }[] = [
    { key: 'list', label: 'リスト', icon: 'list' },
    { key: 'memories', label: '思い出', icon: 'memories' },
    { key: 'settings', label: '設定', icon: 'gear' },
  ]

  return (
    <main className={'app on-' + tab}>
      <header className="top">
        <div className="top-row">
          {tab === 'list' ? <h1 className="headline latin">Bucket List</h1> : <h1 className="headline">{tab === 'memories' ? '思い出' : '設定'}</h1>}
          {tab === 'list' && (
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
              <button className={'icon-btn' + (filtered ? ' marked' : '')} onClick={() => setSheet({ kind: 'filter' })} aria-label="絞り込み">
                <Icon name="settings" />
              </button>
            </div>
          )}
        </div>
        {tab === 'list' && searching && (
          <div className="search">
            <Icon name="search" size={18} />
            <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ことばでさがす" aria-label="さがすことば" autoFocus />
          </div>
        )}
        {tab !== 'settings' && (
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
        )}
      </header>

      {tab === 'list' && (
        <div className="paper-sheet">
          <section className="paper">
            <p className="paper-tally">
              <button className={onlyOpen ? 'on' : ''} onClick={() => setOnlyOpen(!onlyOpen)} aria-pressed={onlyOpen}>
                これから {openCount}
              </button>
              <span aria-hidden>・</span>
              <span>かなえた {doneCount}</span>
              {category !== 'all' && <span className="paper-filter">{findCategory(space.categories, category).name}</span>}
            </p>

            <ol className="lines">
              {lines.map((item, i) => {
                const ink = inkOf(item.createdBy, memberOrder)
                const tape = tapeOf(item.category)
                return (
                  <Line
                    key={item.id}
                    className={['row', item.done ? 'done' : '', item.done && onlyOpen ? 'dim' : '', fresh.isAdded(item) ? 'appear' : ''].filter(Boolean).join(' ')}
                    swipeable={!item.done}
                    onSwipe={() => complete(item)}
                    onOpen={() => setSheet({ kind: 'detail', id: item.id })}
                  >
                    <span className="row-no">{i + 1}</span>
                    {/* 分類は、行頭に貼った半透明のテープで */}
                    <span className="cat-tape" style={{ background: tape }} title={findCategory(space.categories, item.category).name} aria-hidden />
                    <span className={'row-text ' + ink}>
                      {item.done ? (
                        <s className={fresh.isStruck(item) ? 'strike drawing' : 'strike'} style={{ ['--hl' as string]: tape }}>
                          {item.title}
                        </s>
                      ) : (
                        item.title
                      )}
                    </span>
                    {/* 並びは固定：日付 → 書いた人。かなえた行は日付の位置に達成日 */}
                    <span className="row-side">
                      {item.done ? (
                        // 「10/26 かなえた」は横に並べると項目名を押し出すので、日付の位置で2段にする
                        <span className="row-date stacked">
                          {item.doneAt && <span>{shortDate(item.doneAt.toDate())}</span>}
                          <span>かなえた</span>
                        </span>
                      ) : (
                        <span className="row-date">{item.createdAt && shortDate(item.createdAt.toDate())}</span>
                      )}
                      <Avatar member={members.find((m) => m.uid === item.createdBy)} ink={ink} size={22} />
                    </span>
                  </Line>
                )
              })}
            </ol>
            {lines.length === 0 &&
              (keyword || category !== 'all' ? (
                <p className="paper-empty">見つかりませんでした</p>
              ) : (
                <div className="paper-blank">
                  <div className="paper-blank-art">
                    <CoupleArt fill={artFill} />
                  </div>
                  <p>
                    {emptyLines.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                  {ownerTab === 'partner' && !partner && (
                    <button className="link-btn" onClick={invite}>
                      招待する
                    </button>
                  )}
                </div>
              ))}
          </section>
        </div>
      )}

      {tab === 'memories' && (
        <Memories
          spaceId={spaceId}
          items={byOwner}
          members={members}
          memberOrder={memberOrder}
          categories={space.categories}
          artFill={artFill}
          onOpen={(item) => setSheet({ kind: 'detail', id: item.id })}
          onPick={pickRandom}
        />
      )}

      {tab === 'settings' && <Settings space={space} uid={uid} members={members} items={items} />}

      {tab === 'list' && (
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
      )}

      <nav className="tabbar" aria-label="画面の切り替え">
        {tabs.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} aria-current={tab === t.key ? 'page' : undefined} onClick={() => setTab(t.key)}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

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
          uid={uid}
          item={sheetItem}
          // はじめてかなえたときは紙に戻り、線を引くところを見せる
          onClose={(saved) => setSheet(saved && !sheetItem.done ? null : { kind: 'detail', id: sheetItem.id })}
        />
      )}
    </main>
  )
}
