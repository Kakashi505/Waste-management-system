#!/bin/bash

# 廃棄物管理システム 監視スクリプト

echo "🔍 廃棄物管理システムの監視を開始します..."

# 環境変数を読み込み
if [ -f .env.prod ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
else
    echo "❌ .env.prodファイルが見つかりません"
    exit 1
fi

# ヘルスチェック関数
check_health() {
    local service=$1
    local url=$2
    
    if curl -f "$url" > /dev/null 2>&1; then
        echo "✅ $service: 正常"
        return 0
    else
        echo "❌ $service: 異常"
        return 1
    fi
}

# コンテナステータスチェック関数
check_container() {
    local container=$1
    
    if docker ps | grep -q "$container"; then
        echo "✅ $container: 実行中"
        return 0
    else
        echo "❌ $container: 停止中"
        return 1
    fi
}

# ディスク使用量チェック関数
check_disk() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$usage" -lt 80 ]; then
        echo "✅ ディスク使用量: ${usage}% (正常)"
        return 0
    else
        echo "⚠️ ディスク使用量: ${usage}% (注意)"
        return 1
    fi
}

# メモリ使用量チェック関数
check_memory() {
    local usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$usage" -lt 80 ]; then
        echo "✅ メモリ使用量: ${usage}% (正常)"
        return 0
    else
        echo "⚠️ メモリ使用量: ${usage}% (注意)"
        return 1
    fi
}

echo "📊 システム監視レポート - $(date)"
echo "=================================="

# アプリケーションのヘルスチェック
echo ""
echo "🌐 アプリケーション監視:"
check_health "メインアプリケーション" "http://localhost/health"
check_health "API ドキュメント" "http://localhost/api/docs"

# コンテナのステータスチェック
echo ""
echo "🐳 コンテナ監視:"
check_container "waste_management_app_prod"
check_container "waste_management_db_prod"
check_container "waste_management_redis_prod"
check_container "waste_management_nginx_prod"

# データベースの接続チェック
echo ""
echo "🗄️ データベース監視:"
if docker exec waste_management_db_prod pg_isready -U $DB_USERNAME > /dev/null 2>&1; then
    echo "✅ PostgreSQL: 接続可能"
else
    echo "❌ PostgreSQL: 接続不可"
fi

# Redisの接続チェック
echo ""
echo "🔴 Redis監視:"
if docker exec waste_management_redis_prod redis-cli --no-auth-warning -a $REDIS_PASSWORD ping > /dev/null 2>&1; then
    echo "✅ Redis: 接続可能"
else
    echo "❌ Redis: 接続不可"
fi

# システムリソースの監視
echo ""
echo "💻 システムリソース監視:"
check_disk
check_memory

# ログの確認
echo ""
echo "📝 最近のエラーログ:"
docker-compose -f docker-compose.prod.yml logs --tail=10 app | grep -i error || echo "エラーログは見つかりませんでした"

# パフォーマンス統計
echo ""
echo "📈 パフォーマンス統計:"
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')%"
echo "メモリ使用率: $(free | awk 'NR==2{printf "%.1f", $3*100/$2}')%"
echo "ディスク使用率: $(df -h / | awk 'NR==2 {print $5}')"

echo ""
echo "🎯 監視完了 - $(date)"
