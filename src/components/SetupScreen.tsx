import { useState, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { createSpace, joinSpace } from '../data'

export function SetupScreen({ uid }: { uid: string }) {
  const [displayName, setDisplayName] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'create') await createSpace(uid, displayName.trim())
      else await joinSpace(uid, displayName.trim(), code)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'エラーが発生しました')
      setBusy(false)
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="logo">👫</div>
        <h1>はじめに</h1>
        <form onSubmit={submit} className="form">
          <label>
            あなたの表示名
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} required />
          </label>
          <div className="segmented">
            <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
              リストを作る
            </button>
            <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
              招待コードで参加
            </button>
          </div>
          {mode === 'create' ? (
            <p className="hint">作成後に表示される招待コードを相手に送ってください。</p>
          ) : (
            <label>
              招待コード
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                className="code-input"
                required
              />
            </label>
          )}
          {message && <p className="message">{message}</p>}
          <button className="btn primary" disabled={busy}>
            {mode === 'create' ? '作成する' : '参加する'}
          </button>
          <button type="button" className="link-btn" onClick={() => signOut(auth)}>
            ログアウト
          </button>
        </form>
      </div>
    </div>
  )
}
