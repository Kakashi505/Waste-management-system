# Production Deployment Script for Waste Management System (Windows)
param(
    [string]$ProjectName = "waste-management",
    [string]$Environment = "production",
    [string]$Region = "ap-northeast-1",
    [string]$Domain = "waste-management.jp"
)

Write-Host "🚀 Starting Production Deployment..." -ForegroundColor Blue
Write-Host "==================================" -ForegroundColor Blue

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

# Check if Terraform is installed
try {
    terraform --version | Out-Null
    Write-Host "✅ Terraform found" -ForegroundColor Green
} catch {
    Write-Host "❌ Terraform is required but not installed." -ForegroundColor Red
    exit 1
}

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is required but not installed." -ForegroundColor Red
    exit 1
}

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker found" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is required but not installed." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
Write-Host "🔐 Checking AWS credentials..." -ForegroundColor Blue
try {
    aws sts get-caller-identity | Out-Null
    Write-Host "✅ AWS credentials configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured." -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:AWS_DEFAULT_REGION = $Region
$env:TF_VAR_project_name = $ProjectName
$env:TF_VAR_environment = $Environment
$env:TF_VAR_domain_name = $Domain

# Generate secure passwords
Write-Host "🔑 Generating secure passwords..." -ForegroundColor Blue
$DBPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
$RedisPassword = [System.Web.Security.Membership]::GeneratePassword(32, 8)
$JWTSecret = [System.Web.Security.Membership]::GeneratePassword(64, 16)

# Create terraform.tfvars
Write-Host "📝 Creating Terraform configuration..." -ForegroundColor Blue
$TerraformVars = @"
aws_region = "$Region"
project_name = "$ProjectName"
environment = "$Environment"
db_password = "$DBPassword"
redis_password = "$RedisPassword"
domain_name = "$Domain"
"@

$TerraformVars | Out-File -FilePath "infrastructure/aws/terraform.tfvars" -Encoding UTF8

# Deploy infrastructure
Write-Host "🏗️  Deploying AWS infrastructure..." -ForegroundColor Blue
Set-Location "infrastructure/aws"
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get outputs
$DBEndpoint = terraform output -raw database_endpoint
$RedisEndpoint = terraform output -raw redis_endpoint
$ALBDNS = terraform output -raw alb_dns_name
$S3Bucket = terraform output -raw s3_bucket_name

Set-Location "../.."

# Build and push Docker image
Write-Host "🐳 Building and pushing Docker image..." -ForegroundColor Blue
docker build -t $ProjectName`:latest .
docker tag $ProjectName`:latest $env:AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ProjectName`:latest
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $env:AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com
docker push $env:AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ProjectName`:latest

# Create production environment file
Write-Host "📝 Creating production environment configuration..." -ForegroundColor Blue
$ProductionEnv = @"
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://postgres:$DBPassword@$DBEndpoint:5432/waste_management
DB_HOST=$DBEndpoint
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$DBPassword
DB_NAME=waste_management

# Redis Configuration
REDIS_URL=redis://:$RedisPassword@$RedisEndpoint:6379
REDIS_HOST=$RedisEndpoint
REDIS_PORT=6379
REDIS_PASSWORD=$RedisPassword

# JWT Configuration
JWT_SECRET=$JWTSecret
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=$Region
AWS_ACCESS_KEY_ID=$env:AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$env:AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME=$S3Bucket

# Application Configuration
APP_URL=https://$Domain
FRONTEND_URL=https://$Domain
API_URL=https://$Domain/api

# Security Configuration
CORS_ORIGIN=https://$Domain
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELASTICSEARCH_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$env:SMTP_USER
SMTP_PASS=$env:SMTP_PASS

# SMS Configuration
TWILIO_ACCOUNT_SID=$env:TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$env:TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$env:TWILIO_PHONE_NUMBER
"@

$ProductionEnv | Out-File -FilePath ".env.production" -Encoding UTF8

# Deploy to ECS
Write-Host "🚀 Deploying to ECS..." -ForegroundColor Blue
aws ecs update-service --cluster $ProjectName-cluster --service $ProjectName-service --force-new-deployment

# Wait for deployment to complete
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Blue
aws ecs wait services-stable --cluster $ProjectName-cluster --services $ProjectName-service

# Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Blue
docker run --rm --env-file .env.production $env:AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ProjectName`:latest npm run migration:run

# Seed initial data
Write-Host "🌱 Seeding initial data..." -ForegroundColor Blue
docker run --rm --env-file .env.production $env:AWS_ACCOUNT_ID.dkr.ecr.$Region.amazonaws.com/$ProjectName`:latest npm run seed

# Setup monitoring
Write-Host "📊 Setting up monitoring..." -ForegroundColor Blue
& ".\scripts\setup-monitoring.ps1"

# Setup backup
Write-Host "💾 Setting up backup..." -ForegroundColor Blue
& ".\scripts\setup-backup.ps1"

# Run health checks
Write-Host "🏥 Running health checks..." -ForegroundColor Blue
Start-Sleep -Seconds 30
try {
    Invoke-WebRequest -Uri "https://$Domain/api/health" -UseBasicParsing | Out-Null
    Write-Host "✅ Health check passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
    exit 1
}

# Final status
Write-Host "✅ Production deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application URL: https://$Domain" -ForegroundColor Green
Write-Host "📊 Monitoring: https://monitoring.$Domain" -ForegroundColor Green
Write-Host "📋 Admin Panel: https://$Domain/admin" -ForegroundColor Green

Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure DNS to point to: $ALBDNS" -ForegroundColor Yellow
Write-Host "2. Setup SSL certificate for: $Domain" -ForegroundColor Yellow
Write-Host "3. Configure monitoring alerts" -ForegroundColor Yellow
Write-Host "4. Run performance tests" -ForegroundColor Yellow
Write-Host "5. Setup backup verification" -ForegroundColor Yellow

Write-Host "🎉 Your Japanese Waste Management System is now LIVE!" -ForegroundColor Blue
