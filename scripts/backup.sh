#!/bin/bash

# 廃棄物管理システム バックアップスクリプト

set -e

echo "💾 廃棄物管理システムのバックアップを開始します..."

# 環境変数を読み込み
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
else
    echo "❌ .env.prodファイルが見つかりません"
    exit 1
fi

# バックアップディレクトリの作成
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 バックアップディレクトリ: $BACKUP_DIR"

# データベースのバックアップ
echo "🗄️ データベースをバックアップしています..."
docker exec waste_management_db_prod pg_dump -U $DB_USERNAME $DB_DATABASE > "$BACKUP_DIR/database.sql"

# アプリケーションログのバックアップ
echo "📝 アプリケーションログをバックアップしています..."
if [ -d "./logs" ]; then
    cp -r ./logs "$BACKUP_DIR/"
fi

# Docker Compose設定のバックアップ
echo "⚙️ 設定ファイルをバックアップしています..."
cp docker-compose.prod.yml "$BACKUP_DIR/"
cp nginx.prod.conf "$BACKUP_DIR/"
cp filebeat.yml "$BACKUP_DIR/"
cp .env.prod "$BACKUP_DIR/"

# バックアップの圧縮
echo "📦 バックアップを圧縮しています..."
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
rm -rf "$(basename $BACKUP_DIR)"
cd ..

echo "✅ バックアップが完了しました: $BACKUP_DIR.tar.gz"

# 古いバックアップの削除（30日以上古いもの）
echo "🧹 古いバックアップを削除しています..."
find ./backups -name "*.tar.gz" -mtime +30 -delete

echo "🎉 バックアップ処理が完了しました！"
