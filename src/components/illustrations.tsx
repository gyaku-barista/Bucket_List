import type { ReactNode } from 'react'

/**
 * 手描き風の線画。細い墨の線と、淡い色1色の塗りだけで描く。
 * className="fill" の部分に、--fill の色が入る。
 */

const CATEGORY_ART: Record<string, ReactNode> = {
  travel: (
    <>
      <rect x="38" y="34" width="44" height="34" rx="5" className="fill" />
      <path d="M50 34v-7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v7M38 45h44M52 45v23M68 45v23" />
      <circle cx="46" cy="72" r="2.5" />
      <circle cx="74" cy="72" r="2.5" />
      <path d="M88 24c1-4 7-5 9-1 3-1 6 1 5 4H87c-2 0-2-2 1-3z" />
    </>
  ),
  movie: (
    <>
      <rect x="34" y="40" width="52" height="30" rx="3" className="fill" />
      <path d="M34 40 83 27l2.2 8.3-49 13z" />
      <path d="M45 37.2l5.2 6.6M57 34l5.2 6.6M69 30.9l5.2 6.6" />
      <path d="M44 52h18M44 59h28" />
    </>
  ),
  cafe: (
    <>
      <path d="M40 42h34v12a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" className="fill" />
      <path d="M74 46h4a6 6 0 0 1 0 12h-5M34 72h52" />
      <path d="M51 34c-3-4 3-6 0-10M61 34c-3-4 3-6 0-10" />
    </>
  ),
  book: (
    <>
      <path d="M60 34c-8-6-18-6-26-4v36c8-2 18-2 26 4z" className="fill" />
      <path d="M60 34c8-6 18-6 26-4v36c-8-2-18-2-26 4z" className="fill" />
      <path d="M60 34v36M40 40c5-1 10-1 14 1M40 47c5-1 10-1 14 1M40 54c5-1 10-1 14 1M66 41c4-2 9-2 14-1M66 48c4-2 9-2 14-1" />
    </>
  ),
  restaurant: (
    <>
      <path d="M34 50h52c0 11-11 19-26 19s-26-8-26-19z" className="fill" />
      <path d="M72 22 60 46M80 25 66 47M30 72h60" />
      <path d="M46 42c-2-3 2-5 0-8" />
    </>
  ),
  outing: (
    <>
      <path d="M58 24c-10 0-16 8-14 16-6 2-6 12 2 14h24c8-2 8-12 2-14 2-8-4-16-14-16z" className="fill" />
      <path d="M58 54v16M48 70h20M30 70h60" />
      <circle cx="88" cy="28" r="5" />
      <path d="M88 18v-3M98 28h3M95 21l2-2" />
    </>
  ),
  activity: (
    <>
      <path d="M60 26c-17 0-28 11-28 22 0 9 7 14 15 12 5-1 6 4 10 6 15 4 31-6 31-19 0-12-12-21-28-21z" className="fill" />
      <circle cx="47" cy="44" r="3" />
      <circle cx="59" cy="37" r="3" />
      <circle cx="72" cy="40" r="3" />
      <path d="M78 66 94 30" />
    </>
  ),
  event: (
    <>
      <ellipse cx="45" cy="64" rx="7" ry="5" className="fill" />
      <ellipse cx="73" cy="58" rx="7" ry="5" className="fill" />
      <path d="M52 64V34l28-7v31M52 43l28-7" />
      <path d="M92 30c3 2 3 6 0 8M97 26c5 4 5 12 0 16" />
    </>
  ),
  shopping: (
    <>
      <path d="M40 40h40l-3 30H43z" className="fill" />
      <path d="M50 40v-4a10 10 0 0 1 20 0v4" />
      <path d="M52 50c2 3 14 3 16 0" />
    </>
  ),
  home: (
    <>
      <path d="M42 48v22h36V48" className="fill" />
      <path d="M36 52 60 31l24 21M55 70V58h10v12M71 37v-8h6v13" />
    </>
  ),
  anniversary: (
    <>
      <rect x="38" y="44" width="44" height="26" className="fill" />
      <rect x="35" y="36" width="50" height="8" className="fill" />
      <path d="M60 36v34" />
      <path d="M60 36c-4-8-14-8-12-1 1 3 7 2 12 1zM60 36c4-8 14-8 12-1-1 3-7 2-12 1z" />
    </>
  ),
  other: (
    <>
      <circle cx="60" cy="31" r="6" className="fill" />
      <circle cx="69.5" cy="38" r="6" className="fill" />
      <circle cx="66" cy="49" r="6" className="fill" />
      <circle cx="54" cy="49" r="6" className="fill" />
      <circle cx="50.5" cy="38" r="6" className="fill" />
      <circle cx="60" cy="41" r="3.5" />
      <path d="M60 55v17M60 64c-5-5-11-4-13 0 5 2 9 2 13 0zM40 72h40" />
    </>
  ),
}

export function CategoryArt({ category, fill }: { category: string; fill: string }) {
  return (
    <svg className="art" viewBox="0 0 120 90" style={{ ['--fill' as string]: fill }} aria-hidden>
      <g fill="none" stroke="#2a2622" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {CATEGORY_ART[category] ?? CATEGORY_ART.other}
      </g>
    </svg>
  )
}

/** ふたりがベンチに並んで座っている線画（リストが空のとき） */
export function CoupleArt({ fill }: { fill: string }) {
  return (
    <svg className="art couple-art" viewBox="0 0 200 140" style={{ ['--fill' as string]: fill }} aria-hidden>
      <g fill="none" stroke="#2a2622" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="30" y="92" width="140" height="8" rx="2" className="fill" />
        <path d="M38 70h124M44 70v22M156 70v22M42 100v22M158 100v22M10 122h180" />
        {/* 左の人 */}
        <circle cx="82" cy="50" r="11" />
        <path d="M71 92c0-16 4-25 11-25s11 9 11 25" className="fill" />
        <path d="M92 78c3 3 6 5 8 6" />
        <path d="M76 100c-1 8 0 15-2 22M88 100c1 8 3 15 3 22" />
        {/* 右の人 */}
        <circle cx="118" cy="49" r="11" />
        <path d="M107 47c1-13 21-14 22-1 1 6 0 12-2 16" />
        <path d="M107 92c0-16 4-25 11-25s11 9 11 25" className="fill" />
        <path d="M108 78c-3 3-5 5-8 6" />
        <path d="M112 100c0 8-2 15-2 22M124 100c1 8 1 15 3 22" />
        {/* 足もとの草 */}
        <path d="M20 122c3-9 3-16 0-24M20 106c-6-2-8-6-8-10 6 0 8 4 8 10zM20 112c6-2 8-6 8-10-6 0-8 4-8 10z" />
        <path d="M180 122c-2-6-2-11 0-16M180 112c4-1 6-4 6-7-4 0-6 3-6 7z" />
      </g>
    </svg>
  )
}
