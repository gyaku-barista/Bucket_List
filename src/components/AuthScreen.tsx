import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { Composition } from './Composition'
import { LinkChoice } from './ui'

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
    <Composition title="ふたりのやりたいこと" lead="ふたりでしたいこと、それぞれしたいことを、一枚の紙に書きためていく帳面です。">
      <LinkChoice
        options={[
          { value: 'login', label: 'ログイン' },
          { value: 'signup', label: 'はじめて使う' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <form onSubmit={submit} className="form">
        <label>
          <span className="field-label">メールアドレス</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span className="field-label">パスワード</span>
          <input
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {message && <p className="note">{message}</p>}
        <div className="form-actions">
          <button className="link strong" disabled={busy}>
            {mode === 'login' ? 'ひらく' : '登録する'}
          </button>
          {mode === 'login' && (
            <button type="button" className="link quiet" onClick={reset}>
              パスワードを忘れた
            </button>
          )}
        </div>
      </form>
    </Composition>
  )
}
