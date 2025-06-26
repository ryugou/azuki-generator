### フロントエンド

- **ホスティング**：Vercel
- **技術スタック**：Next.js（App Router） + Tailwind CSS + shadcn/ui
- **ビルドディレクトリ**：`frontend/`
- **画像表示・アップロード UI**はすでに実装済

---

### バックエンド構成（2 段構え）

- **ビルドディレクトリ**: `backend/`

#### 1. Rust 画像合成 API（Cloud Run）

| 項目         | 内容                                               |
| ------------ | -------------------------------------------------- |
| 処理内容     | base.jpg に item.png を合成して result.png を生成  |
| 実装言語     | Rust（image + actix-web）                          |
| 実行基盤     | Google Cloud Run（Docker イメージとしてデプロイ）  |
| 入出力       | JSON 形式（Base64 画像または multipart/form-data） |
| 合成位置     | UI での任意座標                                    |
| タイムアウト | 初期は 240 秒に設定                                |
| スケーリング | 同時実行は Cloud Run の自動スケーリングに任せる    |

##### Cloud Run 構築ステップ（要 Dockerfile）

1. Dockerfile で Rust バイナリをビルド（マルチステージ推奨）
2. `actix-web` にて `/generate` エンドポイントを用意
3. `gcloud run deploy` によりデプロイ

#### 2. GPT-4o を使った画像補完

| 項目     | 内容                                                         |
| -------- | ------------------------------------------------------------ |
| 実行環境 | Next.js API Routes（Vercel or functions/api 配下）           |
| 処理内容 | Claude 生成プロンプト → GPT-4o → 補完画像を生成              |
| 外部 API | OpenAI Image API（DALL·E v3 / inpainting 未使用）            |
| 通信方式 | fetch or axios による HTTPS POST（OpenAI key は env で管理） |
| 出力形式 | base64 画像 or URL                                           |

---

### 認証・制限・DB 連携

| 種別 | サービス | 内容                                   |
| ---- | -------- | -------------------------------------- |
| 認証 | Auth0    | ユーザー単位のログインセッション管理   |
| DB   | Supabase | 利用回数制限・履歴記録用（PostgreSQL） |
| ORM  | Prisma   | Supabase への型付き DB アクセス        |

---

### ストレージ構成

- 合成後の画像を GCS (Google Cloud Storage) にアップロードする

---

### その他備考

- Cloud Run API は CORS 対応必須（Vercel → GCP 呼び出し）
