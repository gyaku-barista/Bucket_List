import { useState, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { createSpace, joinSpace } from '../data'
import { Composition } from './Composition'

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
    <Composition vertical={['一本目の', 'フィルムを。']}>
      <form onSubmit={submit} className="form">
        <label>
          <span className="field-label">あなたの表示名</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} required />
        </label>
        <div className="line-tabs">
          <button type="button" className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>
            リストを作る
          </button>
          <button type="button" className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>
            コードで参加
          </button>
        </div>
        {mode === 'create' ? (
          <p className="hint">作成後に表示される招待コードを、相手に送ってください。</p>
        ) : (
          <label>
            <span className="field-label">招待コード</span>
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
    </Composition>
  )
}
