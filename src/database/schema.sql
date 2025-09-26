-- 廃棄物管理システム データベーススキーマ
-- Waste Management System Database Schema

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table (ユーザー管理)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('排出事業者', '元請', '収集運搬', '管理者')),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carriers table (収集運搬業者マスタ)
CREATE TABLE carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50) UNIQUE NOT NULL,
    permits JSONB NOT NULL, -- 許可証情報
    service_areas JSONB NOT NULL, -- サービスエリア（地理的範囲）
    price_matrix JSONB NOT NULL, -- 価格表
    reliability_score DECIMAL(3,2) DEFAULT 0.00,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cases table (廃棄物依頼案件)
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number VARCHAR(50) UNIQUE NOT NULL,
    site_lat DECIMAL(10, 8) NOT NULL,
    site_lng DECIMAL(11, 8) NOT NULL,
    site_address TEXT NOT NULL,
    waste_type VARCHAR(100) NOT NULL,
    waste_category VARCHAR(50) NOT NULL,
    estimated_volume DECIMAL(10, 2), -- 推定容量
    estimated_weight DECIMAL(10, 2), -- 推定重量
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT '新規' CHECK (status IN ('新規', 'マッチング中', '業者選定済み', '収集完了', '処分完了', 'キャンセル')),
    priority VARCHAR(20) DEFAULT '通常' CHECK (priority IN ('緊急', '高', '通常', '低')),
    special_requirements TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_carrier_id UUID REFERENCES carriers(id),
    auto_assign BOOLEAN DEFAULT false,
    auction_enabled BOOLEAN DEFAULT false,
    auction_start_at TIMESTAMP WITH TIME ZONE,
    auction_end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bids table (入札情報)
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    carrier_id UUID NOT NULL REFERENCES carriers(id),
    amount DECIMAL(12, 2) NOT NULL,
    message TEXT,
    status VARCHAR(20) DEFAULT '提出済み' CHECK (status IN ('提出済み', '受注', '落札', 'キャンセル')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, carrier_id)
);

-- Photos table (写真管理)
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id),
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    exif_lat DECIMAL(10, 8),
    exif_lng DECIMAL(11, 8),
    exif_time TIMESTAMP WITH TIME ZONE,
    accuracy_m DECIMAL(8, 2),
    hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity
    tag VARCHAR(50) NOT NULL CHECK (tag IN ('排出現場', '積込', '処分場', 'その他')),
    status VARCHAR(20) DEFAULT 'アップロード済み' CHECK (status IN ('アップロード済み', '検証済み', 'フラグ付き', 'エラー')),
    validation_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GPS Events table (GPS位置情報管理)
CREATE TABLE gps_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    device_id VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    accuracy_m DECIMAL(8, 2) NOT NULL,
    altitude DECIMAL(8, 2),
    speed DECIMAL(8, 2),
    heading DECIMAL(5, 2),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('現場到着', '積込開始', '積込完了', '処分場到着', '処分完了', 'その他')),
    status VARCHAR(20) DEFAULT 'OK' CHECK (status IN ('OK', 'NG', '要確認')),
    threshold_distance_m DECIMAL(8, 2),
    distance_from_site_m DECIMAL(8, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- JWNET Jobs table (電子マニフェスト連携)
CREATE TABLE jwnet_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('登録', '更新', '受渡確認', '完了報告')),
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT '待機中' CHECK (status IN ('待機中', '処理中', '完了', 'エラー', 'リトライ')),
    external_id VARCHAR(100), -- JWNET側のID
    external_response JSONB,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table (監査ログ)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity VARCHAR(100) NOT NULL, -- テーブル名
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, etc.
    actor_id UUID NOT NULL REFERENCES users(id),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_scheduled_date ON cases(scheduled_date);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_location ON cases USING GIST(ST_Point(site_lng, site_lat));
CREATE INDEX idx_photos_case_id ON photos(case_id);
CREATE INDEX idx_photos_status ON photos(status);
CREATE INDEX idx_gps_events_case_id ON gps_events(case_id);
CREATE INDEX idx_gps_events_timestamp ON gps_events(timestamp);
CREATE INDEX idx_gps_events_location ON gps_events USING GIST(ST_Point(lng, lat));
CREATE INDEX idx_jwnet_jobs_status ON jwnet_jobs(status);
CREATE INDEX idx_jwnet_jobs_next_retry ON jwnet_jobs(next_retry_at) WHERE status = '待機中';
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jwnet_jobs_updated_at BEFORE UPDATE ON jwnet_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
