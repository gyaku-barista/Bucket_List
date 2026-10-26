import type { ReactNode } from 'react'

/** ログイン・はじめの画面。テープで留めた一枚のカード */
export function Composition({ title, lead, children }: { title: string; lead: string; children: ReactNode }) {
  return (
    <main className="intro">
      <div className="intro-card">
        <span className="tape" aria-hidden />
        <h1 className="intro-title">{title}</h1>
        <p className="intro-lead">{lead}</p>
        {children}
      </div>
    </main>
  )
}
