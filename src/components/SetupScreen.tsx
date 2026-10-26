import { useState, type FormEvent } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { createSpace, joinSpace } from '../data'
import { Composition } from './Composition'
import { LinkChoice } from './ui'

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
    <Composition title="はじめに" lead="あなたの名前を書いてください。ふたりの紙を新しく用意するか、相手から届いた招待コードで同じ紙に参加します。">
      <form onSubmit={submit} className="form">
        <label>
          <span className="field-label">あなたの名前</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={20} required />
        </label>
        <LinkChoice
          options={[
            { value: 'create', label: '新しく紙を用意する' },
            { value: 'join', label: '招待コードで参加する' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'create' ? (
          <p className="note">用意したあと、設定に書いてある招待コードを相手に送ってください。</p>
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
        {message && <p className="note">{message}</p>}
        <div className="form-actions">
          <button className="link strong" disabled={busy}>
            {mode === 'create' ? '用意する' : '参加する'}
          </button>
          <button type="button" className="link quiet" onClick={() => signOut(auth)}>
            ログアウト
          </button>
        </div>
      </form>
    </Composition>
  )
}
