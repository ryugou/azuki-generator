#!/bin/bash

# Cloud Run デプロイスクリプト

# 設定変数
PROJECT_ID="azuki-generator"
SERVICE_NAME="azuki-backend"
REGION="asia-northeast1"
OPENAI_API_KEY="${OPENAI_API_KEY}"

echo "🚀 Cloud Run デプロイを開始します..."

# 1. Google Cloud プロジェクトを設定
echo "📋 プロジェクト設定: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 2. 必要なAPIを有効化
echo "🔧 必要なAPIを有効化..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com

# 3. Docker イメージをビルドしてContainer Registryにプッシュ
echo "🐳 Docker イメージをビルド中..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME .

# 4. Cloud Run にデプロイ
echo "☁️ Cloud Run にデプロイ中..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars="OPENAI_API_KEY=$OPENAI_API_KEY,GCS_BUCKET_NAME=azuki-generator-images,DEV_MODE=false"

# 5. デプロイ完了メッセージ
echo "✅ デプロイ完了！"
echo "📍 サービスURL:"
gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'