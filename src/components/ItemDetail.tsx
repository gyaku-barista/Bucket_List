import { useEffect, useState } from 'react'
import { deleteItem, fetchPhotos, undoCompletion } from '../data'
import { findCategory } from '../categories'
import type { Category, Item, Member, Photo } from '../types'
import { Dots, formatDate, inkOf, Sheet } from './ui'

interface Props {
  spaceId: string
  item: Item
  members: Member[]
  memberOrder: string[]
  categories: Category[]
  onEdit: () => void
  onComplete: () => void
  onClose: () => void
}

export function ItemDetail({ spaceId, item, members, memberOrder, categories, onEdit, onComplete, onClose }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [viewing, setViewing] = useState<number | null>(null)
  const category = findCategory(categories, item.category)
  const creator = members.find((m) => m.uid === item.createdBy)
  const ownerLabel = item.shared ? 'ふたりで' : (creator?.displayName ?? '')
  const ink = inkOf(item.createdBy, memberOrder)

  // スナップショットのたびに配列が作り直されるので、中身が変わったときだけ再取得する
  const photoKey = item.photoIds.join(',')
  useEffect(() => {
    if (!item.done || item.photoIds.length === 0) return setPhotos([])
    fetchPhotos(spaceId, item.id).then((list) =>
      // photoIds の順に並べる
      setPhotos(item.photoIds.map((id) => list.find((p) => p.id === id)).filter((p): p is Photo => !!p)),
    )
  }, [spaceId, item.id, item.done, photoKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const remove = () => {
    if (!confirm(`「${item.title}」を捨てますか？\n写真や思い出のことばも一緒に消えます。`)) return
    deleteItem(spaceId, item).catch((err) => alert('捨てられませんでした: ' + err))
    onClose()
  }

  const undo = () => {
    if (!confirm('線を消して、これからに戻しますか？（写真やことばは残ります）')) return
    undoCompletion(spaceId, item.id).catch((err) => alert('戻せませんでした: ' + err))
  }

  return (
    <Sheet title={item.done ? 'かなえたこと' : 'これからのこと'} onClose={onClose}>
      <div className="detail">
        <p className={'detail-title ' + ink}>{item.done ? <s className="strike">{item.title}</s> : item.title}</p>

        <dl className="facts">
          <div>
            <dt>だれの</dt>
            <dd>{ownerLabel}</dd>
          </div>
          <div>
            <dt>分類</dt>
            <dd>{category.name}</dd>
          </div>
          <div>
            <dt>大事さ</dt>
            <dd>
              <Dots value={item.priority} max={3} label="大事さ" />
            </dd>
          </div>
          {item.place && (
            <div>
              <dt>場所</dt>
              <dd className={ink}>{item.place}</dd>
            </div>
          )}
          {item.url && (
            <div>
              <dt>リンク</dt>
              <dd className="ellipsis">
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.url.replace(/^https?:\/\//, '')}
                </a>
              </dd>
            </div>
          )}
          {item.memo && (
            <div>
              <dt>メモ</dt>
              <dd className={'pre ' + ink}>{item.memo}</dd>
            </div>
          )}
          <div>
            <dt>書いた日</dt>
            <dd>
              {creator?.displayName}　{item.createdAt ? formatDate(item.createdAt.toDate()) : ''}
            </dd>
          </div>
        </dl>

        {item.done && (
          <section className="memory">
            <h3 className="field-label">思い出</h3>
            <dl className="facts">
              <div>
                <dt>かなえた日</dt>
                <dd>{item.doneAt && formatDate(item.doneAt.toDate(), true)}</dd>
              </div>
              {item.rating > 0 && (
                <div>
                  <dt>よかった</dt>
                  <dd>
                    <Dots value={item.rating} max={5} label="よかった度" />
                  </dd>
                </div>
              )}
            </dl>
            {photos.length > 0 && (
              <div className="prints">
                {photos.map((p, i) => (
                  <button type="button" key={p.id} onClick={() => setViewing(i)} aria-label={`写真 ${i + 1}`}>
                    <img src={p.data} alt="" />
                  </button>
                ))}
              </div>
            )}
            {item.photoIds.length > 0 && photos.length === 0 && <p className="note">写真を出しています…</p>}
            {item.doneMemo && <p className={'memory-text pre ' + ink}>{item.doneMemo}</p>}
          </section>
        )}

        <div className="form-actions">
          {item.done ? (
            <>
              <button className="btn primary" onClick={onComplete}>
                思い出を書き足す
              </button>
              <button className="btn" onClick={undo}>
                線を消す
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={onComplete}>
              かなえた
            </button>
          )}
          <button className="btn" onClick={onEdit}>
            書き直す
          </button>
          <button className="btn danger" onClick={remove}>
            捨てる
          </button>
        </div>
      </div>

      {viewing !== null && (
        <div className="viewer" onClick={() => setViewing(null)}>
          <img src={photos[viewing].data} alt="" />
          <div className="form-actions" onClick={(e) => e.stopPropagation()}>
            {photos.length > 1 && (
              <button className="btn" onClick={() => setViewing((viewing + photos.length - 1) % photos.length)}>
                まえ
              </button>
            )}
            <span className="note">
              {viewing + 1} / {photos.length}
            </span>
            {photos.length > 1 && (
              <button className="btn" onClick={() => setViewing((viewing + 1) % photos.length)}>
                つぎ
              </button>
            )}
            <button className="btn ghost" onClick={() => setViewing(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
