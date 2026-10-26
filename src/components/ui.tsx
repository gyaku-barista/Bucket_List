import { useEffect, type ReactNode } from 'react'
import type { Member } from '../types'

/** 写真を選んだ人だけ、小さな丸い写真を添える */
export function Avatar({ member, size = 22 }: { member: Member | undefined; size?: number }) {
  if (!member?.avatar) return null
  return <img className="avatar" src={member.avatar} alt="" style={{ width: size, height: size }} />
}

/**
 * 書いた人ごとのインク。リストを作った人が紺、あとから参加した人がセピア。
 */
export function inkOf(uid: string | undefined, memberOrder: string[]): string {
  return memberOrder.indexOf(uid ?? '') === 1 ? 'ink-b' : 'ink-a'
}

/** 下から重ねるもう一枚の紙 */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet paper" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="link" onClick={onClose}>
            閉じる
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** 大事さ・満足度。小さな丸を塗る */
export function Dots({ value, max, onChange, label }: { value: number; max: number; onChange?: (v: number) => void; label: string }) {
  if (!onChange) {
    return (
      <span className="dots" role="img" aria-label={`${label} ${value}/${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < value ? 'on' : ''} />
        ))}
      </span>
    )
  }
  return (
    <span className="dots dots-input" role="radiogroup" aria-label={label}>
      {Array.from({ length: max }, (_, i) => (
        <button
          type="button"
          key={i}
          role="radio"
          aria-checked={i + 1 === value}
          aria-label={String(i + 1)}
          className={i < value ? 'on' : ''}
          onClick={() => onChange(value === i + 1 ? 0 : i + 1)}
        >
          <i />
        </button>
      ))}
    </span>
  )
}

/** 小さな文字のリンクを「・」で区切って並べる選択 */
export function LinkChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <span className="link-choice">
      {options.map((o) => (
        <button type="button" key={o.value} className={'link' + (o.value === value ? ' current' : '')} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </span>
  )
}

/** 「10月26日」。今年でなければ年も付ける */
export function formatDate(d: Date, withTime = false): string {
  const year = d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}年`
  const date = `${year}${d.getMonth() + 1}月${d.getDate()}日`
  if (!withTime) return date
  return `${date} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 行の右端に置く小さな日付「10.26」 */
export function shortDate(d: Date): string {
  const md = `${d.getMonth() + 1}.${d.getDate()}`
  return d.getFullYear() === new Date().getFullYear() ? md : `${String(d.getFullYear()).slice(2)}.${md}`
}

/** <input type="datetime-local"> 用の文字列 */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
