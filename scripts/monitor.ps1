# 廃棄物管理システム 監視スクリプト (PowerShell)

Write-Host "🔍 廃棄物管理システムの監視を開始します..." -ForegroundColor Green

# 環境変数を読み込み
if (Test-Path ".env.prod") {
    Get-Content ".env.prod" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# ヘルスチェック関数
function Test-Health {
    param(
        [string]$Service,
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $Service`: 正常" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Service`: 異常 (HTTP $($response.StatusCode))" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌ $Service`: 異常 ($($_.Exception.Message))" -ForegroundColor Red
        return $false
    }
}

# コンテナステータスチェック関数
function Test-Container {
    param([string]$Container)
    
    $containerStatus = docker ps --filter "name=$Container" --format "table {{.Names}}\t{{.Status}}"
    if ($containerStatus -match $Container) {
        Write-Host "✅ $Container`: 実行中" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ $Container`: 停止中" -ForegroundColor Red
        return $false
    }
}

# ディスク使用量チェック関数
function Test-DiskUsage {
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $usage = [math]::Round(($disk.Size - $disk.FreeSpace) / $disk.Size * 100, 1)
    
    if ($usage -lt 80) {
        Write-Host "✅ ディスク使用量: $usage% (正常)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️ ディスク使用量: $usage% (注意)" -ForegroundColor Yellow
        return $false
    }
}

# メモリ使用量チェック関数
function Test-MemoryUsage {
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $usage = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1)
    
    if ($usage -lt 80) {
        Write-Host "✅ メモリ使用量: $usage% (正常)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "⚠️ メモリ使用量: $usage% (注意)" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "📊 システム監視レポート - $(Get-Date)" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# アプリケーションのヘルスチェック
Write-Host ""
Write-Host "🌐 アプリケーション監視:" -ForegroundColor Blue
Test-Health "メインアプリケーション" "http://localhost/health"
Test-Health "API ドキュメント" "http://localhost/api/docs"

# コンテナのステータスチェック
Write-Host ""
Write-Host "🐳 コンテナ監視:" -ForegroundColor Blue
Test-Container "waste_management_app_prod"
Test-Container "waste_management_db_prod"
Test-Container "waste_management_redis_prod"
Test-Container "waste_management_nginx_prod"

# データベースの接続チェック
Write-Host ""
Write-Host "🗄️ データベース監視:" -ForegroundColor Blue
try {
    $dbCheck = docker exec waste_management_db_prod pg_isready -U $env:DB_USERNAME
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL: 接続可能" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL: 接続不可" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ PostgreSQL: 接続不可" -ForegroundColor Red
}

# Redisの接続チェック
Write-Host ""
Write-Host "🔴 Redis監視:" -ForegroundColor Blue
try {
    $redisCheck = docker exec waste_management_redis_prod redis-cli --no-auth-warning -a $env:REDIS_PASSWORD ping
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Redis: 接続可能" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis: 接続不可" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis: 接続不可" -ForegroundColor Red
}

# システムリソースの監視
Write-Host ""
Write-Host "💻 システムリソース監視:" -ForegroundColor Blue
Test-DiskUsage
Test-MemoryUsage

# ログの確認
Write-Host ""
Write-Host "📝 最近のエラーログ:" -ForegroundColor Blue
try {
    $errorLogs = docker-compose -f docker-compose.prod.yml logs --tail=10 app | Select-String -Pattern "error" -CaseSensitive:$false
    if ($errorLogs) {
        $errorLogs | ForEach-Object { Write-Host $_.Line -ForegroundColor Red }
    } else {
        Write-Host "エラーログは見つかりませんでした" -ForegroundColor Green
    }
} catch {
    Write-Host "ログの取得に失敗しました" -ForegroundColor Yellow
}

# パフォーマンス統計
Write-Host ""
Write-Host "📈 パフォーマンス統計:" -ForegroundColor Blue
$cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
$memory = Get-WmiObject -Class Win32_OperatingSystem
$disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"

Write-Host "CPU使用率: $([math]::Round($cpu.Average, 1))%" -ForegroundColor Gray
Write-Host "メモリ使用率: $([math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 1))%" -ForegroundColor Gray
Write-Host "ディスク使用率: $([math]::Round(($disk.Size - $disk.FreeSpace) / $disk.Size * 100, 1))%" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 監視完了 - $(Get-Date)" -ForegroundColor Cyan
