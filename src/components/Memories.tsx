import { useEffect, useMemo, useState } from 'react'
import { fetchPhotos } from '../data'
import { findCategory, tapeOf } from '../categories'
import type { Category, Item, Member } from '../types'
import { CategoryArt, CoupleArt } from './illustrations'
import { Avatar, formatDate, inkOf } from './ui'

interface Props {
  spaceId: string
  items: Item[]
  members: Member[]
  memberOrder: string[]
  categories: Category[]
  /** 線画の塗り（選んでいる人のインクをごく薄く） */
  artFill: string
  onOpen: (item: Item) => void
  onPick: () => void
}

const millis = (t: Item['doneAt']) => t?.toMillis() ?? 0

/** 日付ごとに決まる「今日の一枚」。写真のある思い出を優先する */
function todaysMemory(memories: Item[]): Item | undefined {
  const withPhoto = memories.filter((i) => i.thumb)
  const pool = withPhoto.length ? withPhoto : memories
  if (!pool.length) return undefined
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / 86_400_000)
  return pool[day % pool.length]
}

export function Memories({ spaceId, items, members, memberOrder, categories, artFill, onOpen, onPick }: Props) {
  const memories = useMemo(() => items.filter((i) => i.done).sort((a, b) => millis(b.doneAt) - millis(a.doneAt)), [items])
  const today = todaysMemory(memories)
  const [todayPhoto, setTodayPhoto] = useState<string | null>(null)

  // 大きく見せるので、サムネイルではなく元の写真を読み込む
  useEffect(() => {
    setTodayPhoto(null)
    if (!today?.photoIds.length) return
    let alive = true
    fetchPhotos(spaceId, today.id).then((list) => {
      const first = list.find((p) => p.id === today.photoIds[0]) ?? list[0]
      if (alive && first) setTodayPhoto(first.data)
    })
    return () => {
      alive = false
    }
  }, [spaceId, today?.id, today?.photoIds])

  const achiever = (item: Item) => members.find((m) => m.uid === (item.doneBy ?? item.createdBy))
  const achieverInk = (item: Item) => inkOf(item.doneBy ?? item.createdBy, memberOrder)

  if (!memories.length) {
    return (
      <section className="memories-empty">
        <CoupleArt fill={artFill} />
        <p>かなえたことが、ここに並んでいきます</p>
        <button className="btn ghost" onClick={onPick}>
          今日やることを、ひとつ選ぶ
        </button>
      </section>
    )
  }

  return (
    <section className="memories">
      {today && (
        <>
          <button className="today-card" style={{ ['--cat' as string]: tapeOf(today.category) }} onClick={() => onOpen(today)}>
            <span className="today-label">今日の一枚</span>
            <span className="today-media">
              {todayPhoto || today.thumb ? <img src={todayPhoto ?? today.thumb!} alt="" /> : <CategoryArt category={today.category} fill={artFill} />}
            </span>
            <span className="today-title">{today.title}</span>
            <span className="memory-meta">
              <Avatar member={achiever(today)} ink={achieverInk(today)} size={22} />
              {today.doneAt && formatDate(today.doneAt.toDate())}
            </span>
          </button>
          <button className="btn ghost pick-link" onClick={onPick}>
            迷ったら、今日やることをひとつ選ぶ
          </button>
        </>
      )}

      <h2 className="section-title">
        かなえたこと <span>{memories.length}</span>
      </h2>
      <ul className="memory-grid">
        {memories.map((item) => (
          <li key={item.id}>
            <button className="memory-card" style={{ ['--cat' as string]: tapeOf(item.category) }} onClick={() => onOpen(item)}>
              <span className="memory-media">
                {item.thumb ? <img src={item.thumb} alt="" /> : <CategoryArt category={item.category} fill={artFill} />}
              </span>
              <span className="memory-title">{item.title}</span>
              <span className="memory-meta">
                <Avatar member={achiever(item)} ink={achieverInk(item)} size={20} />
                {item.doneAt && formatDate(item.doneAt.toDate())}
              </span>
              <span className="sr-only">{findCategory(categories, item.category).name}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
