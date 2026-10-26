import type { ReactNode } from 'react'

/** ログイン・はじめの画面。一枚の便箋に書くだけのレイアウト */
export function Composition({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <main className="page">
      <div className="paper intro">
        <h1 className="intro-title">{title}</h1>
        <p className="intro-lead">{lead}</p>
        {children}
      </div>
    </main>
  )
}
