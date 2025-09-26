# Monitoring and Alerting Setup Script
param(
    [string]$Domain = "waste-management.jp",
    [string]$Region = "ap-northeast-1",
    [string]$AlertEmail = "admin@waste-management.jp"
)

Write-Host "📊 Setting up monitoring and alerting..." -ForegroundColor Blue

# Create CloudWatch Dashboard
Write-Host "📈 Creating CloudWatch Dashboard..." -ForegroundColor Blue
$DashboardBody = @{
    widgets = @(
        @{
            type = "metric"
            x = 0
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ECS", "CPUUtilization", "ServiceName", "waste-management-service", "ClusterName", "waste-management-cluster")
                    @(".", "MemoryUtilization", ".", ".", ".", ".")
                )
                view = "timeSeries"
                stacked = $false
                region = $Region
                title = "ECS Service Metrics"
                period = 300
            }
        }
        @{
            type = "metric"
            x = 12
            y = 0
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "waste-management-postgres")
                    @(".", "DatabaseConnections", ".", ".")
                    @(".", "FreeableMemory", ".", ".")
                )
                view = "timeSeries"
                stacked = $false
                region = $Region
                title = "RDS Database Metrics"
                period = 300
            }
        }
        @{
            type = "metric"
            x = 0
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ElastiCache", "CPUUtilization", "CacheClusterId", "waste-management-redis")
                    @(".", "CurrConnections", ".", ".")
                    @(".", "Evictions", ".", ".")
                )
                view = "timeSeries"
                stacked = $false
                region = $Region
                title = "Redis Cache Metrics"
                period = 300
            }
        }
        @{
            type = "metric"
            x = 12
            y = 6
            width = 12
            height = 6
            properties = @{
                metrics = @(
                    @("AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/waste-management-alb/1234567890123456")
                    @(".", "TargetResponseTime", ".", ".")
                    @(".", "HTTPCode_Target_2XX_Count", ".", ".")
                    @(".", "HTTPCode_Target_4XX_Count", ".", ".")
                    @(".", "HTTPCode_Target_5XX_Count", ".", ".")
                )
                view = "timeSeries"
                stacked = $false
                region = $Region
                title = "Application Load Balancer Metrics"
                period = 300
            }
        }
    )
} | ConvertTo-Json -Depth 10

aws cloudwatch put-dashboard `
    --dashboard-name "WasteManagementSystem" `
    --dashboard-body $DashboardBody

Write-Host "✅ CloudWatch Dashboard created" -ForegroundColor Green

# Create SNS Topic for alerts
Write-Host "📢 Creating SNS topic for alerts..." -ForegroundColor Blue
$TopicArn = aws sns create-topic --name "waste-management-alerts" --query 'TopicArn' --output text
Write-Host "📧 SNS Topic ARN: $TopicArn" -ForegroundColor Green

# Subscribe email to SNS topic
aws sns subscribe `
    --topic-arn $TopicArn `
    --protocol email `
    --notification-endpoint $AlertEmail

Write-Host "📧 Email subscription created. Please confirm subscription in your email." -ForegroundColor Yellow

# Create CloudWatch Alarms
Write-Host "🚨 Creating CloudWatch alarms..." -ForegroundColor Blue

# High CPU Usage Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "WasteManagement-HighCPU" `
    --alarm-description "High CPU usage on ECS service" `
    --metric-name "CPUUtilization" `
    --namespace "AWS/ECS" `
    --statistic "Average" `
    --period 300 `
    --threshold 80 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 2 `
    --alarm-actions $TopicArn `
    --dimensions Name=ServiceName,Value=waste-management-service Name=ClusterName,Value=waste-management-cluster

# High Memory Usage Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "WasteManagement-HighMemory" `
    --alarm-description "High memory usage on ECS service" `
    --metric-name "MemoryUtilization" `
    --namespace "AWS/ECS" `
    --statistic "Average" `
    --period 300 `
    --threshold 85 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 2 `
    --alarm-actions $TopicArn `
    --dimensions Name=ServiceName,Value=waste-management-service Name=ClusterName,Value=waste-management-cluster

# Database Connection Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "WasteManagement-DBConnections" `
    --alarm-description "High database connections" `
    --metric-name "DatabaseConnections" `
    --namespace "AWS/RDS" `
    --statistic "Average" `
    --period 300 `
    --threshold 80 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 2 `
    --alarm-actions $TopicArn `
    --dimensions Name=DBInstanceIdentifier,Value=waste-management-postgres

# High Error Rate Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "WasteManagement-HighErrorRate" `
    --alarm-description "High 5XX error rate" `
    --metric-name "HTTPCode_Target_5XX_Count" `
    --namespace "AWS/ApplicationELB" `
    --statistic "Sum" `
    --period 300 `
    --threshold 10 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 1 `
    --alarm-actions $TopicArn `
    --dimensions Name=LoadBalancer,Value=app/waste-management-alb/1234567890123456

# Response Time Alarm
aws cloudwatch put-metric-alarm `
    --alarm-name "WasteManagement-HighResponseTime" `
    --alarm-description "High response time" `
    --metric-name "TargetResponseTime" `
    --namespace "AWS/ApplicationELB" `
    --statistic "Average" `
    --period 300 `
    --threshold 2 `
    --comparison-operator "GreaterThanThreshold" `
    --evaluation-periods 2 `
    --alarm-actions $TopicArn `
    --dimensions Name=LoadBalancer,Value=app/waste-management-alb/1234567890123456

Write-Host "✅ CloudWatch alarms created" -ForegroundColor Green

# Setup Prometheus and Grafana (if using self-hosted monitoring)
Write-Host "📊 Setting up Prometheus and Grafana..." -ForegroundColor Blue

# Create Prometheus configuration
$PrometheusConfig = @"
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'waste-management-api'
    static_configs:
      - targets: ['$Domain:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['$Domain:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['$Domain:9187']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
"@

$PrometheusConfig | Out-File -FilePath "monitoring/prometheus.yml" -Encoding UTF8

# Create Grafana dashboard configuration
$GrafanaDashboard = @"
{
  "dashboard": {
    "id": null,
    "title": "Waste Management System",
    "tags": ["waste-management"],
    "timezone": "Asia/Tokyo",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5XX errors"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends",
            "legendFormat": "Active connections"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
"@

$GrafanaDashboard | Out-File -FilePath "monitoring/grafana-dashboard.json" -Encoding UTF8

Write-Host "✅ Prometheus and Grafana configuration created" -ForegroundColor Green

# Setup log aggregation with ELK Stack
Write-Host "📝 Setting up log aggregation..." -ForegroundColor Blue

# Create Elasticsearch configuration
$ElasticsearchConfig = @"
cluster.name: waste-management-cluster
node.name: waste-management-node
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
"@

$ElasticsearchConfig | Out-File -FilePath "monitoring/elasticsearch.yml" -Encoding UTF8

# Create Logstash configuration
$LogstashConfig = @"
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "waste-management" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "waste-management-%{+YYYY.MM.dd}"
  }
}
"@

$LogstashConfig | Out-File -FilePath "monitoring/logstash.conf" -Encoding UTF8

Write-Host "✅ ELK Stack configuration created" -ForegroundColor Green

# Create monitoring deployment script
$MonitoringDeployScript = @"
#!/bin/bash
# Deploy monitoring stack

# Start Elasticsearch
docker run -d --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -v monitoring/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml \
  elasticsearch:8.11.0

# Start Logstash
docker run -d --name logstash \
  -p 5044:5044 \
  -v monitoring/logstash.conf:/usr/share/logstash/pipeline/logstash.conf \
  --link elasticsearch:elasticsearch \
  logstash:8.11.0

# Start Kibana
docker run -d --name kibana \
  -p 5601:5601 \
  --link elasticsearch:elasticsearch \
  kibana:8.11.0

# Start Prometheus
docker run -d --name prometheus \
  -p 9090:9090 \
  -v monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:latest

# Start Grafana
docker run -d --name grafana \
  -p 3001:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=admin" \
  grafana/grafana:latest

echo "Monitoring stack deployed successfully!"
echo "Prometheus: http://localhost:9090"
echo "Grafana: http://localhost:3001 (admin/admin)"
echo "Kibana: http://localhost:5601"
"@

$MonitoringDeployScript | Out-File -FilePath "scripts/deploy-monitoring.sh" -Encoding UTF8

Write-Host "🎉 Monitoring setup completed!" -ForegroundColor Blue
Write-Host "📊 CloudWatch Dashboard: https://console.aws.amazon.com/cloudwatch/home?region=$Region#dashboards:name=WasteManagementSystem" -ForegroundColor Green
Write-Host "📧 Alerts will be sent to: $AlertEmail" -ForegroundColor Green
Write-Host "📈 Prometheus: http://$Domain:9090" -ForegroundColor Green
Write-Host "📊 Grafana: http://$Domain:3001" -ForegroundColor Green
Write-Host "📝 Kibana: http://$Domain:5601" -ForegroundColor Green
