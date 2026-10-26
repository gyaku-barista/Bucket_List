import { useEffect, useState, type CSSProperties } from 'react'
import { deleteItem, fetchPhotos, undoCompletion } from '../data'
import { findCategory, markOf } from '../categories'
import type { Category, Item, Member, Photo } from '../types'
import { Avatar, formatDate, Pips, Sheet } from './ui'

interface Props {
  spaceId: string
  item: Item
  frameNo: number
  members: Member[]
  categories: Category[]
  onEdit: () => void
  onComplete: () => void
  onClose: () => void
}

export function ItemDetail({ spaceId, item, frameNo, members, categories, onEdit, onComplete, onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [viewing, setViewing] = useState<number | null>(null)
  const category = findCategory(categories, item.category)
  const creator = members.find((m) => m.uid === item.createdBy)
  const ownerLabel = item.owner === 'both' ? 'ふたりで' : (members.find((m) => m.uid === item.owner)?.displayName ?? '')

  // スナップショットのたびに配列が作り直されるので、中身が変わったときだけ再取得する
  const photoKey = item.photoIds.join(',')
  useEffect(() => {
    if (!item.done || item.photoIds.length === 0) return setPhotos([])
    fetchPhotos(spaceId, item.id).then((list) =>
      // photoIds の順に並べる
      setPhotos(item.photoIds.map((id) => list.find((p) => p.id === id)).filter((p): p is Photo => !!p)),
    )
  }, [spaceId, item.id, item.done, photoKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async () => {
    if (!confirm(`「${item.title}」を削除しますか？\n写真や記録も削除されます。`)) return
    deleteItem(spaceId, item).catch((err) => alert('削除に失敗しました: ' + err))
    onClose()
  }

  const undo = () => {
    if (!confirm('「これから」に戻しますか？（写真やメモは残ります）')) return
    undoCompletion(spaceId, item.id).catch((err) => alert('更新に失敗しました: ' + err))
  }

  return (
    <Sheet kicker={`No.${String(frameNo).padStart(2, '0')} — ${item.done ? 'DEVELOPED' : 'LATENT'}`} title={category.name} onClose={onClose}>
      <div className="detail">
        <span className="detail-mark" aria-hidden>
          {markOf(category)}
        </span>
        <h3 className="detail-title">{item.title}</h3>
        <dl className="spec">
          <div>
            <dt>だれの</dt>
            <dd>{ownerLabel}</dd>
          </div>
          <div>
            <dt>優先度</dt>
            <dd>
              <Pips value={item.priority} max={3} label="優先度" />
            </dd>
          </div>
          {item.place && (
            <div>
              <dt>場所</dt>
              <dd>{item.place}</dd>
            </div>
          )}
          {item.url && (
            <div>
              <dt>URL</dt>
              <dd className="ellipsis">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url.replace(/^https?:\/\//, '')}
                </a>
              </dd>
            </div>
          )}
        </dl>
        {item.memo && <p className="pre memo">{item.memo}</p>}
        <p className="byline">
          <Avatar member={creator} size={18} />
          {creator?.displayName} — {item.createdAt ? formatDate(item.createdAt.toDate()) : ''}
        </p>

        {item.done && (
          <section className="memory">
            <header>
              <span className="kicker">DEVELOPED ON</span>
              <time>{item.doneAt && formatDate(item.doneAt.toDate(), true)}</time>
              {item.rating > 0 && <Pips value={item.rating} max={5} label="満足度" />}
            </header>
            {photos.length > 0 && (
              <div className="contact">
                {photos.map((p, i) => (
                  <button type="button" key={p.id} onClick={() => setViewing(i)} style={{ '--i': i } as CSSProperties}>
                    <img src={p.data} alt="" />
                  </button>
                ))}
              </div>
            )}
            {item.photoIds.length > 0 && photos.length === 0 && <p className="hint">現像中…</p>}
            {item.doneMemo && <p className="pre hand">{item.doneMemo}</p>}
          </section>
        )}

        <div className="actions">
          {item.done ? (
            <>
              <button className="btn primary" onClick={onComplete}>
                思い出を編集
              </button>
              <button className="btn" onClick={undo}>
                「これから」に戻す
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={onComplete}>
              達成した
            </button>
          )}
          <div className="actions row">
            <button className="btn" onClick={onEdit}>
              内容を編集
            </button>
            <button className="btn danger" onClick={remove}>
              削除
            </button>
          </div>
        </div>
      </div>

      {viewing !== null && (
        <div className="viewer" onClick={() => setViewing(null)}>
          <img src={photos[viewing].data} alt="" />
          <div className="viewer-nav" onClick={(e) => e.stopPropagation()}>
            {photos.length > 1 && (
              <button onClick={() => setViewing((viewing + photos.length - 1) % photos.length)} aria-label="前へ">
                ←
              </button>
            )}
            <span>
              {String(viewing + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
            </span>
            {photos.length > 1 && (
              <button onClick={() => setViewing((viewing + 1) % photos.length)} aria-label="次へ">
                →
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
