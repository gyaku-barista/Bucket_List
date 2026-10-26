import { useEffect, useState, type FormEvent } from 'react'
import { fetchPhotos, saveCompletion } from '../data'
import { compressImage, squareThumb } from '../image'
import type { Item, Photo } from '../types'
import { Pips, Sheet, toLocalInput } from './ui'

const MAX_PHOTOS = 10

export function CompleteForm({ spaceId, item, onClose }: { spaceId: string; item: Item; onClose: () => void }) {
  const [doneAt, setDoneAt] = useState(toLocalInput(item.doneAt?.toDate() ?? new Date()))
  const [doneMemo, setDoneMemo] = useState(item.doneMemo)
  const [rating, setRating] = useState(item.rating)
  const [existing, setExisting] = useState<Photo[]>([])
  // 既存写真を読み込む前に保存すると写真が消えてしまうので、読み込み完了まで保存させない
  const [loaded, setLoaded] = useState(item.photoIds.length === 0)
  const [added, setAdded] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (loaded) return
    fetchPhotos(spaceId, item.id)
      .then((photos) => {
        setExisting(photos)
        setLoaded(true)
      })
      .catch(() => alert('写真を読み込めませんでした'))
  }, [spaceId, item.id, loaded])

  const total = existing.length + added.length

  const addFiles = async (files: FileList | null) => {
    if (!files) return
    setProcessing(true)
    try {
      const list = Array.from(files).slice(0, MAX_PHOTOS - total)
      const compressed = await Promise.all(list.map((f) => compressImage(f, 1280)))
      setAdded((a) => [...a, ...compressed])
    } catch {
      alert('画像を読み込めませんでした')
    } finally {
      setProcessing(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const first = existing[0]?.data ?? added[0]
    const thumb = first ? await squareThumb(first, 240) : null
    const pending = saveCompletion(spaceId, item, {
      doneAt: new Date(doneAt),
      doneMemo: doneMemo.trim(),
      rating,
      keepPhotoIds: existing.map((p) => p.id),
      newPhotos: added,
      thumb,
    })
    pending.catch((err) => alert('保存に失敗しました: ' + err))
    onClose()
  }

  return (
    <Sheet kicker="DEVELOP" title={item.done ? '思い出を編集' : '達成を記録'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <p className="complete-title">{item.title}</p>
        <label>
          <span className="field-label">達成した日時</span>
          <input type="datetime-local" value={doneAt} onChange={(e) => setDoneAt(e.target.value)} required />
        </label>

        <fieldset>
          <legend className="field-label">満足度</legend>
          <Pips value={rating} max={5} onChange={setRating} label="満足度" />
        </fieldset>

        <fieldset>
          <legend className="field-label">
            写真 {total}/{MAX_PHOTOS}
          </legend>
          <div className="photo-grid">
            {existing.map((p) => (
              <div className="photo-cell" key={p.id}>
                <img src={p.data} alt="" />
                <button type="button" className="photo-remove" onClick={() => setExisting((x) => x.filter((y) => y.id !== p.id))} aria-label="削除">
                  ×
                </button>
              </div>
            ))}
            {added.map((data, i) => (
              <div className="photo-cell" key={'new' + i}>
                <img src={data} alt="" />
                <button type="button" className="photo-remove" onClick={() => setAdded((x) => x.filter((_, j) => j !== i))} aria-label="削除">
                  ×
                </button>
              </div>
            ))}
            {total < MAX_PHOTOS && (
              <label className="photo-cell photo-add">
                {processing ? '…' : '＋'}
                <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
              </label>
            )}
          </div>
        </fieldset>

        <label>
          <span className="field-label">メモ・感想</span>
          <textarea className="hand" rows={4} value={doneMemo} onChange={(e) => setDoneMemo(e.target.value)} maxLength={5000} />
        </label>

        <button className="btn primary" disabled={busy || processing || !loaded}>
          保存
        </button>
      </form>
    </Sheet>
  )
}
