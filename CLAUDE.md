## 前提

- やり取りや指示を含む出力はすべて日本語で行ってください
- ディレクトリ構造・ファイル構成に変更が生じた場合は、必ず CLAUDE.md のディレクトリ構造も更新してください
- 各ステップの終了時には動作確認をお願いします。
- こちら側の作業や指示が必要なときは、勝手な判断をせず必ず確認をしてください
- 各ステップで、外部サービスの設定や必要な情報があれば、作業を開始する前に指示をしてください
- 秘密情報は .env に記述してください。また、.env.example にも同様の記述を行ってください

## 🎯 プロジェクトの目的

Azuki 系 NFT（base.jpg）をベースに、フクロウなどのアイテム画像（item.jpg）を肩に合成する Web サービス。

- アイテム画像は一部が欠損している可能性があるため、AI が自然に補完してから合成する
- 合成位置はデフォルトで「肩」に設定。ユーザーが任意に動かせる UI あり
- Claude が欠損を判定し、GPT-4o（DALL·E）に渡すプロンプトを生成
- 補完後の画像を Cloud Run 上の Rust API で合成（位置は固定または UI で指定）
- 認証と利用制限のために Auth0 + Supabase を導入予定

---

## 🧑‍💻 フロントエンドの状態（すでに実装済）

- UI は `frontend/` 以下に Next.js + shadcn/ui にて実装済み
- ClaudeCode は、**既存 UI に対して機能追加・API 統合を行う**
- 実装済の機能一覧：
  - base.jpg / item.jpg のアップロード（`ImageUploader.tsx`）
  - item 画像の初期設置とドラッグ移動（`DraggableOverlay.tsx`）
  - 合成結果表示（`ResultViewer.tsx`）
- frontend/src/app/page.tsx に記述している `await new Promise((resolve) => setTimeout(resolve, 1000));` は `/api/generate`をコールしている処理を想定したシミュレーション処理のため、実際は、API のレスポンスが変えるまでローディングしている処理となる

🛠 Claude はこの既存 UI を壊さず、必要なバックエンド処理を統合してください。

---

## 🔁 Chain-of-Thought による ToDo ステップ

### Step 1. Claude による補完プロンプト生成

- Rust 言語にて、「item.jpg に欠損があるか確認し、背景の透過および欠損部分の補完を行なうプロンプトを DALL·E 形式で生成する」コードを作成

### Step 2. GPT-4o による画像補完

- Rust 言語にて、「「Step 1. Claude による補完プロンプト生成」で生成した Claude のプロンプトを元に、OpenAI API を呼び出して補完画像（PNG）を生成」するコードを作成

### Step 3. Rust による画像合成 API 実装（Cloud Run）

- Rust 言語にて、「Step 2. GPT-4o による画像補完」で実装し他処理によって生成した画像を base.jpg に重ね、result.png を生成する API を実装
- API に関する実装はすべて /backend 以下に置くこと
- 合成位置は固定（肩）または UI で指定された座標
- この API は Google Cloud Run 上でホスティングする
- 合成後の画像は GCS (Google Cloud Storage) にアップロードする

### Step 4. API 統合（Next.js の /functions 以下）

- フロントから Cloud Run の API を呼び出す処理を `/src/app/api/generate/route.ts ` に実装
- 画像アップロード・ダウンロード・エラー処理を含める

### Step 5. Auth0 による認証導入

- ログイン UI を追加し、ログイン済ユーザーのみに合成処理を許可

### Step 6. Supabase による利用制限管理

- 各ユーザーの履歴・回数制限を Supabase に記録・管理する

---

## 📁 ディレクトリ構成

```
.env
.env.example
backend/
frontend/
├── .gitignore
├── README.md
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── DraggableOverlay.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── ResultViewer.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       └── input.tsx
│   └── lib/
│       └── utils.ts
└── tsconfig.json
```

---

## 📚 参照仕様（ClaudeCode は必ず読むこと）

- [docs/api.md](./docs/api.md)：API 呼び出し仕様
- [docs/auth.md](./docs/auth.md)：Auth0 による認証仕様
- [docs/db.md](./docs/db.md)：ユーザー制限・履歴記録用 DB 構造
- [docs/infra.md](./docs/infra.md)：インフラ構成と構築手順
- [docs/cloud-run.md](./docs/cloud-run.md)：Rust による合成処理 API 仕様

---

## 🤖 Claude の役割

Claude は以下の 2 つを担う：

1. item.jpg に欠損部分があるかを判断し、自然な補完のための DALL·E プロンプトを生成
2. GPT-4o へ、そのプロンプトを渡して、補完画像（item 完成形）を生成する

プロンプト例：

> このフクロウの下半身が欠けているので、自然に補完してください。背景は透過のままでお願いします。

---
