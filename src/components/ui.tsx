import { useEffect, type ReactNode } from 'react'
import type { Member } from '../types'

/** 写真があれば写真、なければ名前の一文字目を書いた人のインクで */
export function Avatar({ member, ink, size = 28 }: { member: Member | undefined; ink?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.46 }
  if (member?.avatar) return <img className="avatar" src={member.avatar} alt="" style={style} />
  return (
    <span className={'avatar avatar-text ' + (ink ?? '')} style={style} aria-hidden>
      {member?.displayName ? Array.from(member.displayName)[0] : ''}
    </span>
  )
}

/**
 * 書いた人ごとのインク。リストを作った人が紺、あとから参加した人がセピア。
 */
export function inkOf(uid: string | undefined, memberOrder: string[]): string {
  return memberOrder.indexOf(uid ?? '') === 1 ? 'ink-b' : 'ink-a'
}

const ICONS = {
  search: <path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 20 20" />,
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  sort: <path d="M7 5v14M4 8l3-3 3 3M17 19V5M14 16l3 3 3-3" />,
}

export function Icon({ name, size = 22 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[name]}
    </svg>
  )
}

/** 下から出てくる紙 */
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
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" aria-hidden />
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** 大事さ・よかった度。小さな丸を塗る */
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

/** 横いっぱいの切り替え */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** 小さな札を並べた選択 */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  scroll,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  scroll?: boolean
}) {
  return (
    <div className={'chips' + (scroll ? ' scroll' : '')}>
      {options.map((o) => (
        <button type="button" key={o.value} aria-pressed={o.value === value} className={'chip' + (o.value === value ? ' active' : '')} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** 「10月26日」。今年でなければ年も付ける */
export function formatDate(d: Date, withTime = false): string {
  const year = d.getFullYear() === new Date().getFullYear() ? '' : `${d.getFullYear()}年`
  const date = `${year}${d.getMonth() + 1}月${d.getDate()}日`
  if (!withTime) return date
  return `${date} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 行の右端に置く小さな日付「10/26」 */
export function shortDate(d: Date): string {
  const md = `${d.getMonth() + 1}/${d.getDate()}`
  return d.getFullYear() === new Date().getFullYear() ? md : `${d.getFullYear()}/${md}`
}

/** <input type="datetime-local"> 用の文字列 */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
