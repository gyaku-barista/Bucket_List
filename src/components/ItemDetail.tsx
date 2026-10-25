import { useEffect, useState } from 'react'
import { deleteItem, fetchPhotos, undoCompletion } from '../data'
import { findCategory } from '../categories'
import type { Category, Item, Member, Photo } from '../types'
import { Avatar, formatDate, Sheet, Stars } from './ui'

interface Props {
  spaceId: string
  item: Item
  members: Member[]
  categories: Category[]
  onEdit: () => void
  onComplete: () => void
  onClose: () => void
}

export function ItemDetail({ spaceId, item, members, categories, onEdit, onComplete, onClose }: Props) {
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
    if (!confirm('未達成に戻しますか？（写真やメモは残ります）')) return
    undoCompletion(spaceId, item.id).catch((err) => alert('更新に失敗しました: ' + err))
  }

  return (
    <Sheet title={category.emoji + ' ' + category.name} onClose={onClose}>
      <div className="detail">
        <h3 className="detail-title">
          {item.done && <span className="done-mark">✓ </span>}
          {item.title}
        </h3>
        <div className="detail-meta">
          <span className="owner-tag">{ownerLabel}</span>
          <Stars value={item.priority} max={3} symbol="♥" />
        </div>

        {item.place && <p>📍 {item.place}</p>}
        {item.url && (
          <p className="ellipsis">
            🔗{' '}
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.url}
            </a>
          </p>
        )}
        {item.memo && <p className="pre">{item.memo}</p>}
        <p className="sub">
          <Avatar member={creator} size={16} /> {creator?.displayName} が {item.createdAt ? formatDate(item.createdAt.toDate()) : ''} に追加
        </p>

        {item.done && (
          <section className="memory">
            <h4>🎉 達成の記録</h4>
            <p>{item.doneAt && formatDate(item.doneAt.toDate(), true)}</p>
            {item.rating > 0 && <Stars value={item.rating} max={5} />}
            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((p, i) => (
                  <button type="button" className="photo-cell" key={p.id} onClick={() => setViewing(i)}>
                    <img src={p.data} alt="" />
                  </button>
                ))}
              </div>
            )}
            {item.photoIds.length > 0 && photos.length === 0 && <p className="sub">写真を読み込み中…</p>}
            {item.doneMemo && <p className="pre">{item.doneMemo}</p>}
          </section>
        )}

        <div className="actions">
          {item.done ? (
            <>
              <button className="btn primary" onClick={onComplete}>
                思い出を編集
              </button>
              <button className="btn" onClick={undo}>
                未達成に戻す
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={onComplete}>
              達成した！
            </button>
          )}
          <button className="btn" onClick={onEdit}>
            内容を編集
          </button>
          <button className="btn danger" onClick={remove}>
            削除
          </button>
        </div>
      </div>

      {viewing !== null && (
        <div className="viewer" onClick={() => setViewing(null)}>
          <img src={photos[viewing].data} alt="" />
          {photos.length > 1 && (
            <div className="viewer-nav" onClick={(e) => e.stopPropagation()}>
              <button className="icon-btn" onClick={() => setViewing((viewing + photos.length - 1) % photos.length)}>
                ‹
              </button>
              <span>
                {viewing + 1} / {photos.length}
              </span>
              <button className="icon-btn" onClick={() => setViewing((viewing + 1) % photos.length)}>
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}
