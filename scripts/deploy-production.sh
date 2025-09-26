#!/bin/bash

# Production Deployment Script for Waste Management System
set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="waste-management"
ENVIRONMENT="production"
REGION="ap-northeast-1"
DOMAIN="waste-management.jp"

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
command -v terraform >/dev/null 2>&1 || { echo -e "${RED}❌ Terraform is required but not installed.${NC}"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo -e "${RED}❌ AWS CLI is required but not installed.${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}"; exit 1; }

# Check AWS credentials
echo -e "${BLUE}🔐 Checking AWS credentials...${NC}"
aws sts get-caller-identity >/dev/null 2>&1 || { echo -e "${RED}❌ AWS credentials not configured.${NC}"; exit 1; }

# Set environment variables
export AWS_DEFAULT_REGION=$REGION
export TF_VAR_project_name=$PROJECT_NAME
export TF_VAR_environment=$ENVIRONMENT
export TF_VAR_domain_name=$DOMAIN

# Generate secure passwords
echo -e "${BLUE}🔑 Generating secure passwords...${NC}"
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Create terraform.tfvars
cat > infrastructure/aws/terraform.tfvars << EOF
aws_region = "$REGION"
project_name = "$PROJECT_NAME"
environment = "$ENVIRONMENT"
db_password = "$DB_PASSWORD"
redis_password = "$REDIS_PASSWORD"
domain_name = "$DOMAIN"
EOF

# Deploy infrastructure
echo -e "${BLUE}🏗️  Deploying AWS infrastructure...${NC}"
cd infrastructure/aws
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Get outputs
DB_ENDPOINT=$(terraform output -raw database_endpoint)
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
ALB_DNS=$(terraform output -raw alb_dns_name)
S3_BUCKET=$(terraform output -raw s3_bucket_name)

cd ../..

# Build and push Docker image
echo -e "${BLUE}🐳 Building and pushing Docker image...${NC}"
docker build -t $PROJECT_NAME:latest .
docker tag $PROJECT_NAME:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME:latest
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME:latest

# Create production environment file
echo -e "${BLUE}📝 Creating production environment configuration...${NC}"
cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://postgres:$DB_PASSWORD@$DB_ENDPOINT:5432/waste_management
DB_HOST=$DB_ENDPOINT
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=$DB_PASSWORD
DB_NAME=waste_management

# Redis Configuration
REDIS_URL=redis://:$REDIS_PASSWORD@$REDIS_ENDPOINT:6379
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# AWS Configuration
AWS_REGION=$REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
S3_BUCKET_NAME=$S3_BUCKET

# Application Configuration
APP_URL=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN
API_URL=https://$DOMAIN/api

# Security Configuration
CORS_ORIGIN=https://$DOMAIN
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
ELASTICSEARCH_ENABLED=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS

# SMS Configuration
TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER
EOF

# Deploy to ECS
echo -e "${BLUE}🚀 Deploying to ECS...${NC}"
aws ecs update-service \
  --cluster $PROJECT_NAME-cluster \
  --service $PROJECT_NAME-service \
  --force-new-deployment

# Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
  --cluster $PROJECT_NAME-cluster \
  --services $PROJECT_NAME-service

# Run database migrations
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
docker run --rm \
  --env-file .env.production \
  $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME:latest \
  npm run migration:run

# Seed initial data
echo -e "${BLUE}🌱 Seeding initial data...${NC}"
docker run --rm \
  --env-file .env.production \
  $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$PROJECT_NAME:latest \
  npm run seed

# Setup monitoring
echo -e "${BLUE}📊 Setting up monitoring...${NC}"
./scripts/setup-monitoring.sh

# Setup backup
echo -e "${BLUE}💾 Setting up backup...${NC}"
./scripts/setup-backup.sh

# Run health checks
echo -e "${BLUE}🏥 Running health checks...${NC}"
sleep 30
curl -f https://$DOMAIN/api/health || { echo -e "${RED}❌ Health check failed${NC}"; exit 1; }

# Final status
echo -e "${GREEN}✅ Production deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application URL: https://$DOMAIN${NC}"
echo -e "${GREEN}📊 Monitoring: https://monitoring.$DOMAIN${NC}"
echo -e "${GREEN}📋 Admin Panel: https://$DOMAIN/admin${NC}"

echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}1. Configure DNS to point to: $ALB_DNS${NC}"
echo -e "${YELLOW}2. Setup SSL certificate for: $DOMAIN${NC}"
echo -e "${YELLOW}3. Configure monitoring alerts${NC}"
echo -e "${YELLOW}4. Run performance tests${NC}"
echo -e "${YELLOW}5. Setup backup verification${NC}"

echo -e "${BLUE}🎉 Your Japanese Waste Management System is now LIVE!${NC}"
