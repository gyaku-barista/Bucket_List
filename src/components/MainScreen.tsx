import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { addItem } from '../data'
import { findCategory } from '../categories'
import { useSpace } from '../hooks'
import type { Item } from '../types'
import { CompleteForm } from './CompleteForm'
import { ItemDetail } from './ItemDetail'
import { ItemForm } from './ItemForm'
import { Settings } from './Settings'
import { Avatar, inkOf, LinkChoice, shortDate } from './ui'

type OwnerTab = 'both' | 'partner' | 'me' | 'all'
type Sort = 'new' | 'priority'
type Sheet = { kind: 'edit'; id: string } | { kind: 'detail'; id: string } | { kind: 'complete'; id: string } | { kind: 'settings' }

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
  const [showCategories, setShowCategories] = useState(false)
  const [sort, setSort] = useState<Sort>('new')
  const [searching, setSearching] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [draft, setDraft] = useState('')
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [picked, setPicked] = useState<Item | null>(null)
  const fresh = useFreshIds(items)

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

  if (!space || !items) return <div className="page loading">ひらいています…</div>

  const sheetItem = sheet && 'id' in sheet ? items.find((i) => i.id === sheet.id) : undefined
  const categoryName = category === 'all' ? 'すべて' : findCategory(space.categories, category).name

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

  const pickRandom = () => {
    const candidates = byOwner.filter((i) => !i.done)
    if (!candidates.length) return alert('まだ、これからのことが書かれていません')
    let next = candidates[Math.floor(Math.random() * candidates.length)]
    if (candidates.length > 1 && next.id === picked?.id) next = candidates.find((i) => i.id !== picked.id)!
    setPicked(next)
  }

  const toggleSearch = () => {
    if (searching) setKeyword('')
    setSearching(!searching)
  }

  return (
    <main className="page">
      <div className="paper sheet-main">
        <button className="corner-photo" onClick={pickRandom} aria-label="今日の一枚（やりたいことをひとつ選ぶ）">
          <span className="tape" aria-hidden />
          <span className="corner-photo-frame">{cornerPhoto && <img src={cornerPhoto} alt="" />}</span>
          <span className="corner-photo-caption">今日の一枚</span>
        </button>

        <header className="row head">
          <h1 className="title">ふたりのやりたいこと</h1>
          <span className="head-links">
            <button className={'link' + (searching ? ' current' : '')} onClick={toggleSearch}>
              さがす
            </button>
            <button className="link" onClick={() => setSheet({ kind: 'settings' })}>
              設定
            </button>
          </span>
        </header>

        <p className="row names">
          <span className={'name ' + inkOf(me?.uid, memberOrder)}>
            <Avatar member={me} size={20} />
            {me?.displayName}
          </span>
          {partner && (
            <>
              <span className="and">と</span>
              <span className={'name ' + inkOf(partner.uid, memberOrder)}>
                <Avatar member={partner} size={20} />
                {partner.displayName}
              </span>
            </>
          )}
        </p>

        <nav className="row controls" aria-label="だれの">
          <LinkChoice
            options={[
              { value: 'both', label: 'ふたりで' },
              { value: 'partner', label: partner?.displayName ?? '相手' },
              { value: 'me', label: me?.displayName ?? '自分' },
              { value: 'all', label: 'すべて' },
            ]}
            value={ownerTab}
            onChange={setOwnerTab}
          />
        </nav>

        <div className="row controls">
          <span className="control">
            分類
            <button className={'link' + (showCategories ? ' current' : '')} onClick={() => setShowCategories(!showCategories)} aria-expanded={showCategories}>
              {categoryName}
            </button>
          </span>
          <span className="control">
            並び
            <button className="link" onClick={() => setSort(sort === 'new' ? 'priority' : 'new')}>
              {sort === 'new' ? '新しい順' : '大事な順'}
            </button>
          </span>
        </div>

        {showCategories && (
          <div className="rows controls category-links">
            <LinkChoice
              options={[{ value: 'all', label: 'すべて' }, ...space.categories.map((c) => ({ value: c.id, label: c.name }))]}
              value={category}
              onChange={(v) => {
                setCategory(v)
                setShowCategories(false)
              }}
            />
          </div>
        )}

        {searching && (
          <div className="row search">
            <input type="search" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ことばを入れてさがす" aria-label="さがす" autoFocus />
          </div>
        )}

        <p className="row tally">
          これから {open.length}　・　かなえた {done.length}
        </p>

        <ol className="lines">
          {open.map((item, i) => (
            <li key={item.id} className={fresh.isAdded(item) ? 'appear' : undefined}>
              <button className="line" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                <span className="line-no">{i + 1}</span>
                <span className={'line-text ' + inkOf(item.createdBy, memberOrder)}>{item.title}</span>
                <span className="line-date">{item.createdAt && shortDate(item.createdAt.toDate())}</span>
              </button>
            </li>
          ))}
          {!keyword && (
            <li className="write-line">
              <form className="line" onSubmit={write}>
                <span className="line-no">{open.length + 1}</span>
                <input
                  className={'line-text ' + inkOf(uid, memberOrder)}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="ここに書き足す"
                  maxLength={100}
                  enterKeyHint="done"
                  aria-label="やりたいことを書き足す"
                />
                {draft.trim() && <button className="link strong line-date">書く</button>}
              </form>
            </li>
          )}
        </ol>

        {done.length > 0 && (
          <>
            <p className="row tally">かなえたこと</p>
            <ol className="lines done-lines">
              {done.map((item, i) => (
                <li key={item.id}>
                  <button className="line" onClick={() => setSheet({ kind: 'detail', id: item.id })}>
                    <span className="line-no">{open.length + i + 1}</span>
                    <span className={'line-text ' + inkOf(item.createdBy, memberOrder)}>
                      <s className={fresh.isStruck(item) ? 'strike drawing' : 'strike'}>{item.title}</s>
                    </span>
                    <span className="line-date">{item.doneAt && shortDate(item.doneAt.toDate())}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}

        {keyword && open.length + done.length === 0 && <p className="row tally">見つかりませんでした</p>}
      </div>

      {picked && (
        <div className="sheet-backdrop center" onClick={() => setPicked(null)}>
          <div className="slip paper" role="dialog" aria-label="今日の一枚" onClick={(e) => e.stopPropagation()}>
            <p className="slip-lead">今日は、これはどうでしょう</p>
            <p className={'slip-text ' + inkOf(picked.createdBy, memberOrder)}>{picked.title}</p>
            <div className="form-actions">
              <button
                className="link strong"
                onClick={() => {
                  setSheet({ kind: 'detail', id: picked.id })
                  setPicked(null)
                }}
              >
                くわしく
              </button>
              <button className="link" onClick={pickRandom}>
                ほかのを
              </button>
              <button className="link quiet" onClick={() => setPicked(null)}>
                閉じる
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
