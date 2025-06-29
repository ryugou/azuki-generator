## 前提

- やり取りや指示を含む出力はすべて日本語で行ってください
- ディレクトリ構造・ファイル構成に変更が生じた場合は、必ず CLAUDE.md のディレクトリ構造も更新してください
- 各ステップの終了時には動作確認をお願いします。
- こちら側の作業や指示が必要なときは、勝手な判断をせず必ず確認をしてください
- 各ステップで、外部サービスの設定や必要な情報があれば、作業を開始する前に指示をしてください
- 秘密情報は .env に記述してください。また、.env.example にも同様の記述を行ってください
- 使用するライブラリはできる限り最新のものを使用してください
- 必ずコンパイル/ビルドは実行し、エラーが出ないところまでは確認してください
- 未使用のコード（インポートや変数、関数定義など）は削除してください
- git を操作する前に、毎回必ず .gitignore の内容を確認し、必要であれば修正を加えてください
- 各ステップの作業を行う前に git のブランチを切り替えて作業を行ってください。各ステップの作業が完了したら、github に push し、main ブランチにマージをしてから次のステップに進んでください。
- pull request の作成、マージは gh コマンドを使用してください

## 🎯 プロジェクトの目的

Azuki 系 NFT（base.jpg）をベースに、フクロウなどのアイテム画像（item.jpg）を肩に合成する Web サービス。

- アイテム画像は一部が欠損している可能性があるため、AI が自然に補完してから合成する
- 合成位置はユーザーが任意に動かせる UI あり
- フロントエンドは API を順にコールし、テイム画像の欠損を補完 → 透過 → ベース画像にのせる
- 補完後の画像を Cloud Run 上の NodeJS API で合成（位置は固定または UI で指定）
- 認証と利用制限のために Auth0 + Supabase を導入予定

---

## 🧑‍💻 フロントエンドの状態（すでに実装済）

- UI は `frontend/` 以下に Next.js + shadcn/ui にて実装済み
- ClaudeCode は、**既存 UI に対して機能追加・API 統合を行う**
- 実装済の機能一覧：
  - base.jpg / item.jpg のアップロード（`ImageUploader.tsx`）
  - item 画像の初期設置とドラッグ移動（`DraggableOverlay.tsx`）
  - 合成結果表示（`ResultViewer.tsx`）
- frontend/src/app/page.tsx に記述している `await new Promise((resolve) => setTimeout(resolve, 1000));` は 各 API をコールしている処理を想定したシミュレーション処理のため、実際は、最後の API のレスポンスが変えるまでローディングしている処理となる
- API のコール順は以下となる
  - 1. POST /api/analyze-item-image
  - 2. POST /api/generate-prompt
  - 3. POST /api/generate-mask-image
  - 4. POST /api/generate-item-image
  - 5. POST /api/remove-background
  - 6. POST /api/generate

🛠 Claude はこの既存 UI を壊さず、必要なバックエンド処理を統合してください。

---

## 🔁 Chain-of-Thought による ToDo ステップ

- 重要: Claude は混同しないこと：
  - `item_image`（肩に載せるアイテム）は DALL·E で補完する対象であり、`base_image`（Azuki 本体）は inpainting 処理には関与しない。

### ✅ Step 1. GPT-4o による画像分析（ /api/analyze-item-image の実装）

- ✅ node.js にて、「item.jpg に欠損があるか確認し、画像の内容を説明する JSON を生成する」コードを作成
- ✅ GPT-4o Vision を使用して画像を分析する
- ✅ API に関する実装はすべて /backend 以下に置くこと
- 🔄 この API は Google Cloud Run 上でホスティングする

### ✅ Step 2. 欠損部分を補うプロンプトの生成（ /api/generate-prompt の実装）

- ✅ node.js にて、Step 1. の結果をもとに、プロンプトを生成するコードを作成
- ✅ API に関する実装はすべて /backend 以下に置くこと
- 🔄 この API は Google Cloud Run 上でホスティングする

### ✅ Step 3.マスク画像の生成（ /api/generate-mask-image の実装）

- ✅ node.js にて、item 画像のマスク画像を生成するコードを作成
- ✅ API に関する実装はすべて /backend 以下に置くこと
- 🔄 この API は Google Cloud Run 上でホスティングする

### ✅ Step 4. DALL·E による画像補完（ /api/generate-item-image の実装）

- ✅ node.js にて、item 画像の欠損部分を補完する画像を生成するコードを作成
- ✅ API に関する実装はすべて /backend 以下に置くこと
- 🔄 この API は Google Cloud Run 上でホスティングする

### ✅ Step 5. 背景の除去（ /api/remove-background の実装）

- ✅ 背景が白の item 画像から背景を除去し、透過 PNG を生成する
- ✅ Claude は外部 API を一切使用せず、ローカルで完結する方法で実装すること（remove.bg は禁止）
- ✅ rembg（https://github.com/danielgatis/rembg）を使用する：
- ✅ Node.js から CLI で実行（例: rembg i input.png output.png）
- ✅ rembg は内部で ONNX モデルを使用（初回起動時に自動取得）
- ✅ Cloud Run 対応のため、必要なモデルファイルは Docker イメージに含める
- ✅ Claude は、必要に応じて Dockerfile も修正すること
- ✅ rembg の ONNX モデルファイルは初回実行時に自動でダウンロードされるが、Cloud Run ではこれが失敗する可能性がある
- ✅ Claude は `rembg i` 実行時に必要なモデルファイルを Docker イメージ内に事前に含めるよう構成すること（失敗した場合は対応を確認すること）

### ✅ Step 6. 画像合成 API 実装（/api/generate の実装）

- ✅ base 画像、生成・透過済み item 画像(Step 5. の結果)、位置（ユーザが画面上で選択）を受け取り、base 画像の指定位置に生成・透過済み item 画像を設置して、一枚の画像を生成するコードを作成
- ✅ 合成位置は UI で指定された座標
- ✅ 合成後の画像は GCS (Google Cloud Storage) にアップロードする

### ✅ Step 7. API 統合（Next.js の /api/generate 以下）

- ✅ フロントから Cloud Run の API を呼び出す処理を実装
- ✅ 以下の順序で、API をコール（同期で行なうこと）する
  - ✅ 1. POST /api/analyze-item-image
  - ✅ 2. POST /api/generate-prompt
  - ✅ 3. POST /api/generate-mask-image
  - ✅ 4. POST /api/generate-item-image
  - ✅ 5. POST /api/remove-background
  - ✅ 6. POST /api/generate

### Step 8. Auth0 による認証導入

- ログイン UI を追加し、ログイン済ユーザーのみに合成処理を許可

### Step 9. Supabase による利用制限管理

- 各ユーザーの履歴・回数制限を Supabase に記録・管理する

---

## 📁 ディレクトリ構成

```
.claude/
.env
.env.example
CLAUDE.md
backend/
├── .env
├── .env.example
├── .eslintrc.json
├── .gcloudignore
├── .gitignore
├── .prettierrc.json
├── Dockerfile
├── nodemon.json
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── routes/
│       ├── analyze-item-image.ts
│       ├── generate-prompt.ts
│       ├── generate-mask-image.ts
│       ├── generate-item-image.ts
│       ├── remove-background.ts
│       └── generate.ts
docs/
├── api.md
├── auth.md
├── db.md
└── infra.md
frontend/
├── .env.example
├── .env.local
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
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts
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

---

### 🔑 OpenAI API 使用に関する前提

- `DALL·E` は OpenAI の `images/edit` API を使用
- 入力画像・マスク画像は Base64 で送信する
- `.env` に以下を設定済み：
  - `OPENAI_API_KEY=...`
- Claude は `openai` ライブラリ（最新版）を使用して実装すること

---

### 📤 GCS アップロード仕様

- 保存先：.env の GCS_BUCKET_NAME から取得
- ファイル名：`output/{日付}/{UUID}.png`
- アップロードには公式 SDK（@google-cloud/storage）を使用
- 公開 URL を返す場合は signed URL ではなく公開設定にする
- - `.env` に以下を必ず記述すること：

```env
GCS_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

### 🔧 /backend の API 構成ルール

- すべてのエンドポイントは `/backend/src/routes/` 以下に設置
- 各ルートは `routes/[endpoint].ts` 形式
- `express.Router()` を使い、エントリポイントで統合
