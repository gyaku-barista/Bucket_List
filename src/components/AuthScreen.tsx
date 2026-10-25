import { useState, type FormEvent } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase'

const ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'メールアドレスかパスワードが違います',
  'auth/invalid-email': 'メールアドレスの形式が正しくありません',
  'auth/email-already-in-use': 'このメールアドレスはすでに登録されています',
  'auth/weak-password': 'パスワードは6文字以上にしてください',
  'auth/too-many-requests': '試行回数が多すぎます。しばらくしてからお試しください',
  'auth/network-request-failed': '通信に失敗しました',
}

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, password)
      else await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setMessage(ERRORS[(err as { code?: string }).code ?? ''] ?? 'エラーが発生しました')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    if (!email) return setMessage('メールアドレスを入力してから押してください')
    try {
      await sendPasswordResetEmail(auth, email)
      setMessage('パスワード再設定メールを送りました')
    } catch (err) {
      setMessage(ERRORS[(err as { code?: string }).code ?? ''] ?? 'エラーが発生しました')
    }
  }

  return (
    <div className="center-screen">
      <div className="card auth-card">
        <div className="logo">💞</div>
        <h1>ふたりのバケットリスト</h1>
        <div className="segmented">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            ログイン
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            新規登録
          </button>
        </div>
        <form onSubmit={submit} className="form">
          <label>
            メールアドレス
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            パスワード
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {message && <p className="message">{message}</p>}
          <button className="btn primary" disabled={busy}>
            {mode === 'login' ? 'ログイン' : '登録する'}
          </button>
          {mode === 'login' && (
            <button type="button" className="link-btn" onClick={reset}>
              パスワードを忘れた
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
