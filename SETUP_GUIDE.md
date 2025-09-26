# 廃棄物管理システム セットアップガイド

## 🚨 現在の状況
システムは完全に実装済みですが、実行環境（Node.js、Docker）がインストールされていません。

## 📋 必要な環境

### 1. Node.js のインストール
```bash
# Node.js 18+ をインストール
# https://nodejs.org/ からダウンロード
# または Chocolatey を使用
choco install nodejs

# または winget を使用
winget install OpenJS.NodeJS
```

### 2. Docker Desktop のインストール
```bash
# Docker Desktop for Windows をインストール
# https://www.docker.com/products/docker-desktop/
# または Chocolatey を使用
choco install docker-desktop

# または winget を使用
winget install Docker.DockerDesktop
```

## 🚀 システム起動手順

### 方法1: 完全なDocker環境（推奨）
```bash
# 1. 環境変数設定
cp env.example .env

# 2. 全サービスをDockerで起動
docker-compose up -d

# 3. データベース初期化
docker-compose exec app npm run seed

# 4. アクセス
# - API: http://localhost:3000
# - API ドキュメント: http://localhost:3000/api/docs
# - フロントエンド: http://localhost:80
```

### 方法2: ローカル開発環境
```bash
# 1. 依存関係インストール
npm install

# 2. データベースのみDockerで起動
docker-compose up -d postgres redis

# 3. 環境変数設定
cp env.example .env

# 4. データベース初期化
npm run seed

# 5. バックエンド起動
npm run start:dev

# 6. フロントエンド起動（別ターミナル）
cd frontend
npm install
npm start
```

## 🔧 トラブルシューティング

### Node.js が見つからない場合
```bash
# PATH を確認
echo $env:PATH

# Node.js を再インストール
# インストール後、PowerShell を再起動
```

### Docker が見つからない場合
```bash
# Docker Desktop を起動
# システムトレイでDockerアイコンを確認

# Docker サービスを開始
Start-Service docker
```

### ポートが使用中の場合
```bash
# ポート使用状況を確認
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# プロセスを終了
taskkill /PID <PID番号> /F
```

## 📊 システム確認

### ヘルスチェック
```bash
# アプリケーション状態
curl http://localhost:3000/health

# データベース接続
curl http://localhost:3000/api/health/db

# Redis接続
curl http://localhost:3000/api/health/redis
```

### ログ確認
```bash
# 全サービスログ
docker-compose logs

# 特定サービスログ
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis
```

## 🎯 本番デプロイ

### 本番環境デプロイ
```bash
# Windows
npm run deploy:win

# Linux/Mac
npm run deploy
```

### 監視・バックアップ
```bash
# 監視
npm run monitor:win

# バックアップ
npm run backup
```

## 📚 追加リソース

- **API ドキュメント**: http://localhost:3000/api/docs
- **システム構成**: README.md
- **環境変数**: env.example
- **Docker設定**: docker-compose.yml

## 🆘 サポート

問題が発生した場合：
1. ログを確認
2. 環境変数を確認
3. ポートの競合を確認
4. 依存関係を再インストール

---

**注意**: 初回起動時は、データベースの初期化に時間がかかる場合があります。
