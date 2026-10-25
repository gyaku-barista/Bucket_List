import { useEffect, type ReactNode } from 'react'
import type { Member } from '../types'

export function Avatar({ member, size = 32 }: { member: Member | undefined; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.45 }
  if (member?.avatar) return <img className="avatar" src={member.avatar} alt={member.displayName} style={style} />
  return (
    <span className="avatar avatar-text" style={style}>
      {member?.displayName?.slice(0, 1) ?? '?'}
    </span>
  )
}

/** ふたりで の場合は2人のアイコンを重ねて表示 */
export function OwnerBadge({ owner, members }: { owner: string; members: Member[] }) {
  if (owner === 'both') {
    return (
      <span className="avatar-pair">
        {members.slice(0, 2).map((m) => (
          <Avatar key={m.uid} member={m} size={22} />
        ))}
      </span>
    )
  }
  return <Avatar member={members.find((m) => m.uid === owner)} size={22} />
}

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
        <header className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Stars({
  value,
  max,
  onChange,
  symbol = '★',
}: {
  value: number
  max: number
  onChange?: (v: number) => void
  symbol?: string
}) {
  return (
    <span className={onChange ? 'stars stars-input' : 'stars'}>
      {Array.from({ length: max }, (_, i) => {
        const on = i < value
        return onChange ? (
          <button type="button" key={i} className={on ? 'on' : ''} onClick={() => onChange(value === i + 1 ? 0 : i + 1)}>
            {symbol}
          </button>
        ) : (
          <span key={i} className={on ? 'on' : ''}>
            {symbol}
          </span>
        )
      })}
    </span>
  )
}

export function formatDate(d: Date, withTime = false): string {
  const date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  if (!withTime) return date
  return `${date} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** <input type="datetime-local"> 用の文字列 */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
