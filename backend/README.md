# Azuki Generator Backend

Node.js + TypeScript + Express で実装されたAzuki NFT画像生成バックエンドAPI

## 🚀 クイックスタート

### 前提条件

- Node.js 20+
- Python 3.11+ (rembg用)
- OpenAI API Key
- Google Cloud Storage サービスアカウント

### ローカル開発

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**
```bash
cp .env.example .env
# .envファイルを編集して実際の値を設定
```

3. **rembgのインストール**
```bash
pip install rembg[cli]
```

4. **開発サーバーの起動**
```bash
npm run dev
```

### 本番デプロイ

#### Docker (Cloud Run)
```bash
# ビルド
docker build -t azuki-backend .

# ローカルテスト
docker run -p 8080:8080 --env-file .env azuki-backend

# Cloud Runにデプロイ
gcloud run deploy azuki-backend --source . --region asia-northeast1 --allow-unauthenticated
```

## 📡 API エンドポイント

### 1. `/api/analyze-item-image`
- **目的**: GPT-4o Visionでitem画像を分析
- **入力**: `{ "item_image": "base64_string" }`
- **出力**: `{ "species": "owl", "color": "pink", ... }`

### 2. `/api/generate-prompt`
- **目的**: DALL-E用プロンプトを生成
- **入力**: `{ "image-info": {...} }`
- **出力**: `{ "prompt": "..." }`

### 3. `/api/generate-mask-image`
- **目的**: inpainting用マスク画像を生成
- **入力**: `{ "item_image": "base64", "missing_part": "lower body" }`
- **出力**: `{ "mask_image": "base64_string" }`

### 4. `/api/generate-item-image`
- **目的**: DALL-E Edit APIで画像補完
- **入力**: `{ "base_image": "base64", "mask_image": "base64", "prompt": "..." }`
- **出力**: `{ "generated_image": "base64_string" }`

### 5. `/api/remove-background`
- **目的**: rembgで背景除去
- **入力**: `{ "image": "base64_string" }`
- **出力**: `{ "transparent_image": "base64_string" }`

### 6. `/api/generate`
- **目的**: 最終的な画像合成とGCSアップロード
- **入力**: `{ "base_image": "base64", "item_image": "base64", "position": {"x": 100, "y": 100} }`
- **出力**: `{ "result_image": "https://..." }`

## 🧪 テスト

### 個別APIテスト
```bash
# プロンプト生成テスト
node test-generate-prompt.js

# マスク生成テスト
node test-generate-mask.js
```

### 統合テスト（フロントエンド経由）
1. フロントエンドサーバーを起動
2. 画像をアップロードして動作確認

## 🔧 環境変数

```env
# 必須
OPENAI_API_KEY=sk-proj-...
GCS_BUCKET_NAME=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# オプション
PORT=8080
NODE_ENV=development
```

## 📦 主要依存関係

- `express`: REST API フレームワーク
- `openai`: OpenAI API クライアント
- `sharp`: 画像処理
- `@google-cloud/storage`: GCS アップロード
- `rembg`: 背景除去 (Python CLI)

## 🐛 トラブルシューティング

### rembgが見つからない
```bash
pip install rembg[cli]
which rembg  # パスを確認
```

### OpenAI API Key エラー
```bash
echo $OPENAI_API_KEY  # 環境変数を確認
```

### GCS アップロードエラー
```bash
# サービスアカウントキーのパスを確認
ls -la $GOOGLE_APPLICATION_CREDENTIALS
```