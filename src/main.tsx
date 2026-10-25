import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './styles.css'

registerSW({ immediate: true })

const root = createRoot(document.getElementById('root')!)

// Firebase は apiKey が無いと初期化時に例外を投げるので、設定があるときだけ読み込む
if (import.meta.env.VITE_FIREBASE_API_KEY) {
  import('./App').then(({ App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  )
} else {
  root.render(<div className="center-screen">Firebase の設定がありません。README の手順で環境変数を設定してください。</div>)
}
