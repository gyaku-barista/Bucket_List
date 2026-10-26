import { useEffect, type ReactNode } from 'react'
import type { Member } from '../types'

export function Avatar({ member, size = 32 }: { member: Member | undefined; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.48 }
  if (member?.avatar) return <img className="avatar" src={member.avatar} alt={member.displayName} style={style} />
  return (
    <span className="avatar avatar-text" style={style}>
      {member?.displayName ? Array.from(member.displayName)[0] : '?'}
    </span>
  )
}

/** ふたりで の場合は2人のアイコンを重ねて表示 */
export function OwnerBadge({ owner, members, size = 22 }: { owner: string; members: Member[]; size?: number }) {
  if (owner === 'both') {
    return (
      <span className="avatar-pair">
        {members.slice(0, 2).map((m) => (
          <Avatar key={m.uid} member={m} size={size} />
        ))}
      </span>
    )
  }
  return <Avatar member={members.find((m) => m.uid === owner)} size={size} />
}

export function Sheet({ kicker, title, onClose, children }: { kicker: string; title: string; onClose: () => void; children: ReactNode }) {
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
        <div className="sprockets" aria-hidden />
        <header className="sheet-header">
          <div>
            <span className="kicker">{kicker}</span>
            <h2>{title}</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

/** 優先度や満足度を表す目盛り。onChange を渡すと入力になる */
export function Pips({ value, max, onChange, label }: { value: number; max: number; onChange?: (v: number) => void; label?: string }) {
  return (
    <span className={onChange ? 'pips pips-input' : 'pips'} role={onChange ? 'radiogroup' : 'img'} aria-label={label ? `${label} ${value}/${max}` : undefined}>
      {Array.from({ length: max }, (_, i) =>
        onChange ? (
          <button
            type="button"
            key={i}
            role="radio"
            aria-checked={i + 1 === value}
            aria-label={String(i + 1)}
            className={i < value ? 'on' : ''}
            onClick={() => onChange(value === i + 1 ? 0 : i + 1)}
          />
        ) : (
          <i key={i} className={i < value ? 'on' : ''} />
        ),
      )}
    </span>
  )
}

export function formatDate(d: Date, withTime = false): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
  if (!withTime) return date
  return `${date}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** <input type="datetime-local"> 用の文字列 */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
