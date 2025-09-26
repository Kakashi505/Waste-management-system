# 廃棄物管理システム (Waste Management System)

日本企業向けの包括的な廃棄物管理システムです。排出事業者、元請業者、収集運搬業者向けの機能を提供し、電子マニフェスト（JWNET）連携、GPS追跡、写真管理、逆オークション機能を備えています。

## 🚀 主な機能

### 核心機能
- **廃棄物依頼管理**: 依頼作成、地域・許可証・価格に基づく自動マッチング、ステータス管理
- **GPS位置情報管理**: 閾値判定、OK/NG判定、現場・積込・処分場でのチェック
- **写真管理**: 排出現場・積込・処分場の必須写真、EXIF・GPS連携、保存要件対応
- **逆オークション機能**: 入札ルール、仮選定業者の自動確定、通知機能
- **拠点保管・移動管理**: マニフェスト番号・運搬業者許可番号の自動管理
- **電子マニフェスト連携**: JWNET自動登録・更新、受渡確認票出力
- **ユーザー権限管理**: 排出事業者、元請業者、収集運搬業者、システム管理者

### 技術的特徴
- **RESTful API**: OpenAPI 3.0準拠のAPI設計
- **リアルタイム処理**: WebSocket対応の逆オークション
- **セキュリティ**: JWT認証、RBAC、MFA対応
- **スケーラビリティ**: マイクロサービス対応、キュー処理
- **監査ログ**: 全操作の追跡可能なログ記録

## 🛠 技術スタック

### バックエンド
- **Node.js** + **TypeScript**
- **NestJS** - スケーラブルなNode.jsフレームワーク
- **PostgreSQL** + **PostGIS** - 地理空間データ対応
- **Redis** - キャッシュ・キュー処理
- **Bull** - ジョブキュー管理
- **AWS S3** - オブジェクトストレージ
- **JWT** - 認証・認可

### インフラ
- **Docker** + **Docker Compose**
- **Nginx** - リバースプロキシ
- **AWS** - クラウドインフラ

## 📋 前提条件

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## 🚀 クイックスタート

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd waste-management-system
```

### 2. 環境設定
```bash
cp env.example .env
# .envファイルを編集して設定を調整
```

### 3. Docker Composeで起動
```bash
docker-compose up -d
```

### 4. データベース初期化
```bash
# データベーススキーマが自動的に適用されます
# 必要に応じて初期データを投入
```

### 5. アプリケーションアクセス
- **API**: http://localhost:3000
- **API ドキュメント**: http://localhost:3000/api/docs
- **ヘルスチェック**: http://localhost:3000/health

## 📚 API ドキュメント

### 認証
```bash
# ユーザー登録
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "田中太郎",
  "role": "排出事業者"
}

# ログイン
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 廃棄物依頼管理
```bash
# 依頼作成
POST /api/cases
{
  "siteLat": 35.6762,
  "siteLng": 139.6503,
  "siteAddress": "東京都渋谷区恵比寿1-1-1",
  "wasteType": "一般廃棄物",
  "wasteCategory": "可燃ごみ",
  "scheduledDate": "2024-01-15T10:00:00Z"
}

# 依頼一覧取得
GET /api/cases?status=新規&priority=高

# マッチング結果取得
GET /api/cases/{id}/matching
```

### 写真管理
```bash
# プリサインドURL取得
POST /api/photos/presigned-url
{
  "caseId": "uuid",
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg"
}

# 写真アップロード
POST /api/photos/upload
# multipart/form-data with file and metadata
```

### GPS追跡
```bash
# GPSイベント登録
POST /api/gps/events
{
  "caseId": "uuid",
  "deviceId": "DEVICE_001",
  "lat": 35.6762,
  "lng": 139.6503,
  "accuracyM": 5.0,
  "eventType": "現場到着"
}
```

### 逆オークション
```bash
# 入札作成
POST /api/auction/bids
{
  "caseId": "uuid",
  "amount": 50000,
  "message": "迅速な対応を心がけます"
}

# オークション状況取得
GET /api/auction/status/{caseId}
```

## 🏗 アーキテクチャ

### システム構成
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Mobile PWA    │    │   VOLT UI       │
│   (React)       │    │   (React)       │    │   (Integration) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx         │
                    │   (Reverse      │
                    │    Proxy)       │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   NestJS API    │
                    │   (Backend)     │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis         │    │   AWS S3        │
│   (Database)    │    │   (Cache/Queue) │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┼───────────────────────┐
                                 │                       │
                    ┌─────────────────┐    ┌─────────────────┐
                    │   JWNET API     │    │   External      │
                    │   (Integration) │    │   Services      │
                    └─────────────────┘    └─────────────────┘
```

### データフロー
1. **依頼作成**: 排出事業者が廃棄物依頼を作成
2. **自動マッチング**: 地域・許可証・価格に基づく業者マッチング
3. **逆オークション**: 複数業者による入札競争
4. **業者選定**: 最適な業者の自動選定
5. **現場作業**: GPS追跡・写真撮影による進捗管理
6. **電子マニフェスト**: JWNET連携による自動登録
7. **完了報告**: 処分完了までの全工程管理

## 🔒 セキュリティ

### 認証・認可
- **JWT認証**: セキュアなトークンベース認証
- **RBAC**: 役割ベースアクセス制御
- **MFA**: 多要素認証対応
- **セッション管理**: 安全なセッション管理

### データ保護
- **暗号化**: S3でのAES-256暗号化
- **TLS**: 全通信の暗号化
- **監査ログ**: 全操作の追跡
- **データマスキング**: 機密データの保護

## 📊 監視・運用

### ヘルスチェック
```bash
# アプリケーション状態確認
curl http://localhost:3000/health

# データベース接続確認
curl http://localhost:3000/api/health/db

# Redis接続確認
curl http://localhost:3000/api/health/redis
```

### ログ管理
- **構造化ログ**: JSON形式でのログ出力
- **ログレベル**: DEBUG, INFO, WARN, ERROR
- **監査ログ**: 全操作の追跡可能なログ

### メトリクス
- **パフォーマンス**: レスポンス時間、スループット
- **エラー率**: API エラー率の監視
- **リソース使用量**: CPU、メモリ、ディスク使用量

## 🧪 テスト

### 単体テスト
```bash
npm run test
```

### 統合テスト
```bash
npm run test:e2e
```

### テストカバレッジ
```bash
npm run test:cov
```

## 🚀 デプロイ

### 本番環境デプロイ
```bash
# 本番用Dockerイメージビルド
docker build -t waste-management:latest .

# 本番環境デプロイ
docker-compose -f docker-compose.prod.yml up -d
```

### 環境変数設定
本番環境では以下の環境変数を設定してください：
- `NODE_ENV=production`
- `JWT_SECRET`: 強力なJWT秘密鍵
- `DB_*`: 本番データベース設定
- `AWS_*`: AWS認証情報
- `JWNET_*`: JWNET API設定

## 📈 パフォーマンス

### 推奨スペック
- **CPU**: 2コア以上
- **メモリ**: 4GB以上
- **ストレージ**: 50GB以上（SSD推奨）
- **ネットワーク**: 100Mbps以上

### スケーリング
- **水平スケーリング**: 複数インスタンスでの負荷分散
- **データベース**: 読み取り専用レプリカの活用
- **キャッシュ**: Redis クラスターでの分散キャッシュ

## 🤝 貢献

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

- **ドキュメント**: [API ドキュメント](http://localhost:3000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **メール**: support@example.com

## 🔄 更新履歴

### v1.0.0 (2024-01-15)
- 初回リリース
- 基本機能の実装
- JWNET連携機能
- 逆オークション機能
- GPS追跡機能
- 写真管理機能

---

**廃棄物管理システム** - 日本の廃棄物管理をデジタル化し、効率化を実現します。
