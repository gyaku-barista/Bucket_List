import { useEffect, useState, type FormEvent } from 'react'
import { fetchPhotos, saveCompletion } from '../data'
import { compressImage, imageErrorMessage, squareThumb } from '../image'
import type { Item, Photo } from '../types'
import { Dots, Sheet, toLocalInput } from './ui'

const MAX_PHOTOS = 10

export function CompleteForm({ spaceId, uid, item, onClose }: { spaceId: string; uid: string; item: Item; onClose: (saved: boolean) => void }) {
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
    } catch (err) {
      alert(imageErrorMessage(err))
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
      doneBy: uid,
      doneMemo: doneMemo.trim(),
      rating,
      keepPhotoIds: existing.map((p) => p.id),
      newPhotos: added,
      thumb,
    })
    pending.catch((err) => alert('書き込めませんでした: ' + err))
    onClose(true)
  }

  return (
    <Sheet title={item.done ? '思い出を書き足す' : 'かなえた'} onClose={() => onClose(false)}>
      <form className="form" onSubmit={submit}>
        <p className="complete-title">{item.title}</p>
        <label>
          <span className="field-label">かなえた日</span>
          <input className="date-input" type="datetime-local" value={doneAt} onChange={(e) => setDoneAt(e.target.value)} required />
        </label>

        <div className="field">
          <span className="field-label">よかった度</span>
          <Dots value={rating} max={5} onChange={setRating} label="よかった度" />
        </div>

        <div className="field">
          <span className="field-label">
            写真（{total}/{MAX_PHOTOS}枚）
          </span>
          <div className="prints">
            {existing.map((p) => (
              <div className="print-edit" key={p.id}>
                <span className="print-frame">
                  <img src={p.data} alt="" />
                </span>
                <button type="button" className="btn ghost" onClick={() => setExisting((x) => x.filter((y) => y.id !== p.id))}>
                  はずす
                </button>
              </div>
            ))}
            {added.map((data, i) => (
              <div className="print-edit" key={'new' + i}>
                <span className="print-frame">
                  <img src={data} alt="" />
                </span>
                <button type="button" className="btn ghost" onClick={() => setAdded((x) => x.filter((_, j) => j !== i))}>
                  はずす
                </button>
              </div>
            ))}
          </div>
          {total < MAX_PHOTOS && (
            <label className="btn add-photo">
              {processing ? '写真を読み込んでいます…' : '写真を貼る'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </label>
          )}
        </div>

        <label>
          <span className="field-label">思い出のことば</span>
          <textarea rows={4} value={doneMemo} onChange={(e) => setDoneMemo(e.target.value)} maxLength={5000} />
        </label>

        <div className="form-actions">
          <button className="btn primary" disabled={busy || processing || !loaded}>
            これで残す
          </button>
        </div>
      </form>
    </Sheet>
  )
}
