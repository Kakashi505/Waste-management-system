# 廃棄物管理システム 本番デプロイスクリプト (PowerShell)

Write-Host "🚀 廃棄物管理システムの本番デプロイを開始します..." -ForegroundColor Green

# 環境変数チェック
if (-not (Test-Path ".env.prod")) {
    Write-Host "❌ .env.prodファイルが見つかりません" -ForegroundColor Red
    Write-Host "env.prod.exampleをコピーして設定してください" -ForegroundColor Yellow
    exit 1
}

# 環境変数を読み込み
Get-Content ".env.prod" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Dockerイメージのビルド
Write-Host "📦 Dockerイメージをビルドしています..." -ForegroundColor Blue
docker build -t waste-management:latest .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dockerイメージのビルドに失敗しました" -ForegroundColor Red
    exit 1
}

# 既存のコンテナを停止・削除
Write-Host "🛑 既存のコンテナを停止しています..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down

# データベースのバックアップ（既存データがある場合）
if (docker ps -q -f "name=waste_management_db_prod") {
    Write-Host "💾 データベースをバックアップしています..." -ForegroundColor Blue
    $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    docker exec waste_management_db_prod pg_dump -U $env:DB_USERNAME $env:DB_DATABASE > $backupFile
}

# 本番環境で起動
Write-Host "🎯 本番環境を起動しています..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
Write-Host "🔍 ヘルスチェックを実行しています..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# アプリケーションのヘルスチェック
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ アプリケーションが正常に起動しました" -ForegroundColor Green
    } else {
        throw "HTTP $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ アプリケーションの起動に失敗しました" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs app
    exit 1
}

# データベースのヘルスチェック
try {
    $dbCheck = docker exec waste_management_db_prod pg_isready -U $env:DB_USERNAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ データベースが正常に起動しました" -ForegroundColor Green
    } else {
        throw "Database connection failed"
    }
} catch {
    Write-Host "❌ データベースの起動に失敗しました" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs postgres
    exit 1
}

# Redisのヘルスチェック
try {
    $redisCheck = docker exec waste_management_redis_prod redis-cli --no-auth-warning -a $env:REDIS_PASSWORD ping
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redisが正常に起動しました" -ForegroundColor Green
    } else {
        throw "Redis connection failed"
    }
} catch {
    Write-Host "❌ Redisの起動に失敗しました" -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml logs redis
    exit 1
}

Write-Host "🎉 デプロイが完了しました！" -ForegroundColor Green
Write-Host "📊 アプリケーション: https://$env:DOMAIN_NAME" -ForegroundColor Cyan
Write-Host "📚 API ドキュメント: https://$env:DOMAIN_NAME/api/docs" -ForegroundColor Cyan
Write-Host "🔍 ヘルスチェック: https://$env:DOMAIN_NAME/health" -ForegroundColor Cyan

Write-Host "📋 ログを確認するには:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Gray
