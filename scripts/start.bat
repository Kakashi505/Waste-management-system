@echo off
REM 廃棄物管理システム起動スクリプト

echo 🚀 廃棄物管理システムを起動しています...

REM 環境変数チェック
if not exist .env (
    echo ⚠️  .envファイルが見つかりません。env.exampleをコピーして設定してください。
    copy env.example .env
    echo 📝 .envファイルを作成しました。設定を確認してください。
)

REM 依存関係のインストール
echo 📦 依存関係をインストールしています...
npm install

REM データベースの準備
echo 🗄️  データベースを準備しています...
REM Docker ComposeでPostgreSQLとRedisを起動
docker-compose up -d postgres redis

REM データベースの起動を待機
echo ⏳ データベースの起動を待機しています...
timeout /t 10 /nobreak > nul

REM アプリケーションの起動
echo 🎯 アプリケーションを起動しています...
npm run start:dev
