import type { ReactNode } from 'react'

/** ログイン・初期設定画面の共通レイアウト。縦書きの大きな見出しとフォームを斜めに重ねる */
export function Composition({ vertical, children }: { vertical: string[]; children: ReactNode }) {
  return (
    <div className="composition">
      <div className="crop-marks" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
      <h1 className="vertical-title">
        {vertical.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <span className="composition-kicker">BUCKET LIST — FOR TWO</span>
      <div className="composition-panel">{children}</div>
      <span className="composition-foot" aria-hidden>
        ISO 400 · 36 EXP
      </span>
    </div>
  )
}
