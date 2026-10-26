import { useEffect, type ReactNode } from 'react'
import type { Member } from '../types'

/** 写真があれば写真、なければ名前の一文字目を書いた人のインクで */
export function Avatar({ member, ink, size = 28 }: { member: Member | undefined; ink?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.46 }
  if (member?.avatar) return <img className={'avatar ' + (ink ?? '')} src={member.avatar} alt="" style={style} />
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

const INK_COLOR: Record<string, string> = { 'ink-a': '#2e4a6b', 'ink-b': '#9a5b3f' }

/** 線画の塗りに使う、インクをごく薄く紙に溶かした色 */
export function wash(ink: string): string {
  return `color-mix(in srgb, ${INK_COLOR[ink] ?? INK_COLOR['ink-a']} 18%, #fcf8f0)`
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
  list: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth="2.4" />
    </>
  ),
  memories: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="m3.5 16 5-4.5 4 3.5 2.5-2 5.5 4.5" />
      <circle cx="15.5" cy="9.5" r="1.5" />
    </>
  ),
  gear: (
    <>
      <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export function Icon({ name, size = 22 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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

/** <input type="datetime-local"> 用の文字列 */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
