#!/bin/bash

# 廃棄物管理システム起動スクリプト

echo "🚀 廃棄物管理システムを起動しています..."

# 環境変数チェック
if [ ! -f .env ]; then
    echo "⚠️  .envファイルが見つかりません。env.exampleをコピーして設定してください。"
    cp env.example .env
    echo "📝 .envファイルを作成しました。設定を確認してください。"
fi

# 依存関係のインストール
echo "📦 依存関係をインストールしています..."
npm install

# データベースの準備
echo "🗄️  データベースを準備しています..."
# Docker ComposeでPostgreSQLとRedisを起動
docker-compose up -d postgres redis

# データベースの起動を待機
echo "⏳ データベースの起動を待機しています..."
sleep 10

# アプリケーションの起動
echo "🎯 アプリケーションを起動しています..."
npm run start:dev
