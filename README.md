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
5. プロジェクトの設定 →「マイアプリ」→ ウェブアプリ（`</>`）を追加し、表示される `apiKey` / `authDomain` / `projectId` / `appId` を控える

### 2. GitHub Pages で公開する

1. GitHub のリポジトリで **Settings → Pages → Source** を **GitHub Actions** にする
2. **Settings → Secrets and variables → Actions → Variables** に以下を登録

   | 名前 | 値 |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | apiKey |
   | `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
   | `VITE_FIREBASE_PROJECT_ID` | projectId |
   | `VITE_FIREBASE_APP_ID` | appId |

3. `main` ブランチに push すると自動でビルド・公開されます（Actions タブから手動実行も可）
4. Firebase コンソール → Authentication → 設定 → **承認済みドメイン** に `<ユーザー名>.github.io` を追加

> Firebase のウェブ用設定値は公開されても問題ない値です。データはセキュリティルールで2人以外から保護されます。

### 3. スマホに入れる

- **Android（Chrome）**：公開URLを開く → メニュー →「ホーム画面に追加」
- **iOS（Safari）**：公開URLを開く → 共有ボタン →「ホーム画面に追加」

1人目が「リストを作る」→ 表示された招待コードを相手に送り、2人目が「招待コードで参加」で入力すれば共有完了です。

## ローカル開発

```bash
npm install
cp .env.example .env.local   # Firebase の値を記入
npm run dev
```

Firebase エミュレータで動かす場合は `.env.local` に `VITE_USE_EMULATOR=true` を追加し、
`npx firebase-tools emulators:start --only auth,firestore --project demo-bucket` を起動してください
（このときの `VITE_FIREBASE_*` の値は適当な文字列で構いません）。

## 無料枠の目安

写真は端末側で長辺1280pxに圧縮して Firestore に保存します（1枚あたり約0.1〜0.5MB）。
Firestore の無料枠は保存容量 1GiB なので、写真数千枚までは無料で使えます。
