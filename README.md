# ふたりのバケットリスト 💞

恋人と「やりたいこと」を共有して、達成した思い出（日時・写真・メモ）を残す PWA です。
Android / iOS どちらもブラウザから「ホーム画面に追加」するだけでアプリのように使えます。

要件定義は [docs/requirements.md](docs/requirements.md) を参照してください。

## 主な機能

- メール＋パスワードでログイン、招待コードで2人のリストを共有（リアルタイム同期）
- 「ふたりで / 相手 / 自分」のタブ分け
- カテゴリ（映画・旅行・読書・カフェ・飲食店 など。追加・並べ替え・削除可）
- 表示名とアイコンの設定
- 達成記録：日時・写真（最大10枚）・メモ・満足度
- 検索、優先度、達成率、「今日なにする？」ランダム提案
- ダークモード、オフライン閲覧

## 構成

| 役割 | 使用技術 |
| --- | --- |
| フロント | React + TypeScript + Vite（PWA） |
| 認証・DB | Firebase Authentication / Cloud Firestore（無料の Spark プラン） |
| 公開 | GitHub Pages（GitHub Actions で自動デプロイ） |

## セットアップ手順（最初の1回だけ）

### 1. Firebase プロジェクトを作る

1. [Firebase コンソール](https://console.firebase.google.com/) で「プロジェクトを追加」
2. **Authentication** →「始める」→ ログイン方法で **メール / パスワード** を有効化
3. **Firestore Database** →「データベースを作成」→ ロケーションは `asia-northeast1`（東京）、本番環境モードで作成
4. Firestore の **ルール** タブに、このリポジトリの [`firestore.rules`](firestore.rules) の内容を貼り付けて「公開」
5. プロジェクトの設定 →「マイアプリ」→ ウェブアプリ（`</>`）を追加し、表示される `apiKey` / `authDomain` / `projectId` / `appId` を `src/firebase.ts` に書く

### 2. GitHub Pages で公開する

1. GitHub のリポジトリで **Settings → Pages → Source** を **GitHub Actions** にする
2. `main` ブランチに push すると自動でビルド・公開されます（Actions タブから手動実行も可）
3. Firebase コンソール → Authentication → 設定 → **承認済みドメイン** に `<ユーザー名>.github.io` を追加

> Firebase のウェブ用設定値は `src/firebase.ts` に直接書いています。公開されても問題ない値で、データはセキュリティルールで2人以外から保護されます。

### 3. スマホに入れる

- **Android（Chrome）**：公開URLを開く → メニュー →「ホーム画面に追加」
- **iOS（Safari）**：公開URLを開く → 共有ボタン →「ホーム画面に追加」

1人目が「リストを作る」→ 表示された招待コードを相手に送り、2人目が「招待コードで参加」で入力すれば共有完了です。

### 4. 通知（相手が書いたとき・かなえたとき）

通知は Cloud Functions（`functions/`）から Firebase Cloud Messaging で送ります。最初に一度だけ次の準備が必要です。

1. Firebase コンソールで **Blaze プラン**に切り替える（ふたりで使う程度なら無料枠に収まる）。予算アラートも設定しておく
2. プロジェクトの設定 → **Cloud Messaging** → ウェブプッシュ証明書で「鍵ペアを生成」し、公開鍵を `src/notifications.ts` の `VAPID_KEY` に書く
3. Google Cloud コンソールでサービスアカウントを作り、JSON 鍵を GitHub の Secrets に `FIREBASE_SERVICE_ACCOUNT` として登録する
   （`main` に `functions/` の変更を push すると、`.github/workflows/functions.yml` が Cloud Functions を公開する。Actions タブから手動でも実行できる）

各自、アプリの「設定」→「通知を受け取る」を押すと、その端末で通知を受け取れます（iPhone はホーム画面に追加したアプリから）。

## ローカル開発

```bash
npm install
npm run dev
```

Firebase エミュレータで動かす場合は `.env.example` を `.env.local` にコピーして値を埋め、`VITE_USE_EMULATOR=true` を追加したうえで
`npx firebase-tools emulators:start --only auth,firestore --project demo-bucket` を起動してください
（このときの `VITE_FIREBASE_*` の値は適当な文字列で構いません）。

## 無料枠の目安

写真は端末側で長辺1280pxに圧縮して Firestore に保存します（1枚あたり約0.1〜0.5MB）。
Firestore の無料枠は保存容量 1GiB なので、写真数千枚までは無料で使えます。
