#!/bin/bash

# 廃棄物管理システム 本番デプロイスクリプト

set -e

echo "🚀 廃棄物管理システムの本番デプロイを開始します..."

# 環境変数チェック
if [ ! -f .env.prod ]; then
    echo "❌ .env.prodファイルが見つかりません"
    echo "env.prod.exampleをコピーして設定してください"
    exit 1
fi

# 環境変数を読み込み
export $(cat .env.prod | grep -v '^#' | xargs)

# Dockerイメージのビルド
echo "📦 Dockerイメージをビルドしています..."
docker build -t waste-management:latest .

# 既存のコンテナを停止・削除
echo "🛑 既存のコンテナを停止しています..."
docker-compose -f docker-compose.prod.yml down || true

# データベースのバックアップ（既存データがある場合）
if [ "$(docker ps -q -f name=waste_management_db_prod)" ]; then
    echo "💾 データベースをバックアップしています..."
    docker exec waste_management_db_prod pg_dump -U $DB_USERNAME $DB_DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql
fi

# 本番環境で起動
echo "🎯 本番環境を起動しています..."
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo "🔍 ヘルスチェックを実行しています..."
sleep 30

# アプリケーションのヘルスチェック
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ アプリケーションが正常に起動しました"
else
    echo "❌ アプリケーションの起動に失敗しました"
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
fi

# データベースのヘルスチェック
if docker exec waste_management_db_prod pg_isready -U $DB_USERNAME > /dev/null 2>&1; then
    echo "✅ データベースが正常に起動しました"
else
    echo "❌ データベースの起動に失敗しました"
    docker-compose -f docker-compose.prod.yml logs postgres
    exit 1
fi

# Redisのヘルスチェック
if docker exec waste_management_redis_prod redis-cli --no-auth-warning -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
    echo "✅ Redisが正常に起動しました"
else
    echo "❌ Redisの起動に失敗しました"
    docker-compose -f docker-compose.prod.yml logs redis
    exit 1
fi

echo "🎉 デプロイが完了しました！"
echo "📊 アプリケーション: https://$DOMAIN_NAME"
echo "📚 API ドキュメント: https://$DOMAIN_NAME/api/docs"
echo "🔍 ヘルスチェック: https://$DOMAIN_NAME/health"

# ログの確認
echo "📋 ログを確認するには:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
