import { firebaseConfigured } from './firebase'
import { useAuthUser, useSpaceId } from './hooks'
import { AuthScreen } from './components/AuthScreen'
import { MainScreen } from './components/MainScreen'
import { SetupScreen } from './components/SetupScreen'

export function App() {
  const user = useAuthUser()
  const spaceId = useSpaceId(user?.uid)

  if (!firebaseConfigured) {
    return <div className="center-screen">Firebase の設定がありません。README の手順で環境変数を設定してください。</div>
  }
  if (user === undefined) return <div className="center-screen">読み込み中…</div>
  if (user === null) return <AuthScreen />
  if (spaceId === undefined) return <div className="center-screen">読み込み中…</div>
  if (spaceId === null) return <SetupScreen uid={user.uid} />
  return <MainScreen key={spaceId} uid={user.uid} spaceId={spaceId} />
}
