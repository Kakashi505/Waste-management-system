# Backup and Disaster Recovery Setup Script
param(
    [string]$Domain = "waste-management.jp",
    [string]$Region = "ap-northeast-1",
    [string]$BackupRetentionDays = "30"
)

Write-Host "💾 Setting up backup and disaster recovery..." -ForegroundColor Blue

# Create S3 bucket for backups
Write-Host "🪣 Creating S3 bucket for backups..." -ForegroundColor Blue
$BackupBucket = "waste-management-backups-$(Get-Date -Format 'yyyyMMddHHmmss')"
aws s3 mb "s3://$BackupBucket" --region $Region

# Enable versioning on backup bucket
aws s3api put-bucket-versioning `
    --bucket $BackupBucket `
    --versioning-configuration Status=Enabled

# Enable encryption on backup bucket
aws s3api put-bucket-encryption `
    --bucket $BackupBucket `
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'

Write-Host "✅ Backup bucket created: $BackupBucket" -ForegroundColor Green

# Create RDS automated backup policy
Write-Host "🗄️  Configuring RDS automated backups..." -ForegroundColor Blue
aws rds modify-db-instance `
    --db-instance-identifier waste-management-postgres `
    --backup-retention-period $BackupRetentionDays `
    --preferred-backup-window "03:00-04:00" `
    --preferred-maintenance-window "sun:04:00-sun:05:00" `
    --apply-immediately

Write-Host "✅ RDS backup policy configured" -ForegroundColor Green

# Create Lambda function for automated backups
Write-Host "⚡ Creating Lambda function for automated backups..." -ForegroundColor Blue

$LambdaCode = @"
import json
import boto3
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    rds = boto3.client('rds')
    s3 = boto3.client('s3')
    
    # Create RDS snapshot
    snapshot_id = f"waste-management-backup-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    try:
        # Create manual snapshot
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier='waste-management-postgres'
        )
        
        print(f"Snapshot creation initiated: {snapshot_id}")
        
        # Wait for snapshot to complete
        waiter = rds.get_waiter('db_snapshot_completed')
        waiter.wait(
            DBSnapshotIdentifier=snapshot_id,
            WaiterConfig={
                'Delay': 60,
                'MaxAttempts': 60
            }
        )
        
        print(f"Snapshot completed: {snapshot_id}")
        
        # Export snapshot to S3
        export_task_id = f"export-{snapshot_id}"
        export_response = rds.start_export_task(
            ExportTaskIdentifier=export_task_id,
            SourceArn=response['DBSnapshot']['DBSnapshotArn'],
            S3BucketName='$BackupBucket',
            S3Prefix='database-backups/',
            IamRoleArn=os.environ['EXPORT_ROLE_ARN'],
            KmsKeyId=os.environ['KMS_KEY_ID']
        )
        
        print(f"Export task started: {export_task_id}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Backup completed successfully',
                'snapshot_id': snapshot_id,
                'export_task_id': export_task_id
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
"@

# Create Lambda deployment package
$LambdaCode | Out-File -FilePath "backup/lambda_function.py" -Encoding UTF8

# Create Lambda deployment package
Compress-Archive -Path "backup/lambda_function.py" -DestinationPath "backup/lambda_function.zip" -Force

# Create IAM role for Lambda
$TrustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$TrustPolicy | Out-File -FilePath "backup/trust-policy.json" -Encoding UTF8

$RoleArn = aws iam create-role `
    --role-name WasteManagementBackupRole `
    --assume-role-policy-document file://backup/trust-policy.json `
    --query 'Role.Arn' `
    --output text

# Attach policies to role
aws iam attach-role-policy `
    --role-name WasteManagementBackupRole `
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy `
    --role-name WasteManagementBackupRole `
    --policy-arn arn:aws:iam::aws:policy/AmazonRDSFullAccess

aws iam attach-role-policy `
    --role-name WasteManagementBackupRole `
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create Lambda function
aws lambda create-function `
    --function-name WasteManagementBackup `
    --runtime python3.9 `
    --role $RoleArn `
    --handler lambda_function.lambda_handler `
    --zip-file fileb://backup/lambda_function.zip `
    --timeout 900 `
    --memory-size 512 `
    --environment Variables="{EXPORT_ROLE_ARN=$RoleArn,KMS_KEY_ID=alias/aws/rds}"

Write-Host "✅ Lambda backup function created" -ForegroundColor Green

# Create EventBridge rule for scheduled backups
Write-Host "⏰ Creating scheduled backup rule..." -ForegroundColor Blue
$RuleArn = aws events put-rule `
    --name WasteManagementBackupSchedule `
    --schedule-expression "cron(0 2 * * ? *)" `
    --description "Daily backup at 2 AM JST" `
    --query 'RuleArn' `
    --output text

# Add Lambda target to rule
aws events put-targets `
    --rule WasteManagementBackupSchedule `
    --targets "Id"="1","Arn"="arn:aws:lambda:$Region`:$(aws sts get-caller-identity --query Account --output text):function:WasteManagementBackup"

# Add permission for EventBridge to invoke Lambda
aws lambda add-permission `
    --function-name WasteManagementBackup `
    --statement-id AllowEventBridge `
    --action lambda:InvokeFunction `
    --principal events.amazonaws.com `
    --source-arn $RuleArn

Write-Host "✅ Scheduled backup rule created" -ForegroundColor Green

# Create disaster recovery plan
Write-Host "🚨 Creating disaster recovery plan..." -ForegroundColor Blue

$DRPlan = @"
# Waste Management System Disaster Recovery Plan

## Recovery Time Objectives (RTO)
- Critical Systems: 4 hours
- Non-Critical Systems: 24 hours
- Full System Recovery: 48 hours

## Recovery Point Objectives (RPO)
- Database: 1 hour
- File Storage: 4 hours
- Configuration: 24 hours

## Recovery Procedures

### 1. Database Recovery
1. Identify latest available RDS snapshot
2. Restore RDS instance from snapshot
3. Update connection strings
4. Verify data integrity

### 2. Application Recovery
1. Deploy application to new infrastructure
2. Update DNS records
3. Verify SSL certificates
4. Test all functionality

### 3. File Storage Recovery
1. Restore S3 bucket from backup
2. Update file access permissions
3. Verify file integrity

### 4. Monitoring and Alerting
1. Restore monitoring infrastructure
2. Update alert configurations
3. Verify alert delivery

## Backup Verification
- Daily automated backups
- Weekly manual verification
- Monthly disaster recovery testing

## Contact Information
- Primary Admin: admin@waste-management.jp
- Secondary Admin: backup-admin@waste-management.jp
- Emergency Contact: +81-90-1234-5678

## Recovery Checklist
- [ ] Assess damage and impact
- [ ] Activate disaster recovery team
- [ ] Restore database from latest snapshot
- [ ] Deploy application infrastructure
- [ ] Update DNS and SSL certificates
- [ ] Restore file storage
- [ ] Verify system functionality
- [ ] Update monitoring and alerting
- [ ] Notify stakeholders
- [ ] Document lessons learned
"@

$DRPlan | Out-File -FilePath "backup/disaster-recovery-plan.md" -Encoding UTF8

Write-Host "✅ Disaster recovery plan created" -ForegroundColor Green

# Create backup verification script
$BackupVerificationScript = @"
#!/bin/bash
# Backup Verification Script

echo "🔍 Verifying backups..."

# Check RDS snapshots
echo "📊 Checking RDS snapshots..."
aws rds describe-db-snapshots --db-instance-identifier waste-management-postgres --query 'DBSnapshots[0].[DBSnapshotIdentifier,Status,SnapshotCreateTime]' --output table

# Check S3 backup bucket
echo "🪣 Checking S3 backup bucket..."
aws s3 ls s3://$BackupBucket --recursive --human-readable --summarize

# Check Lambda function
echo "⚡ Checking Lambda function..."
aws lambda get-function --function-name WasteManagementBackup --query 'Configuration.[FunctionName,State,LastModified]' --output table

# Check EventBridge rule
echo "⏰ Checking EventBridge rule..."
aws events describe-rule --name WasteManagementBackupSchedule --query 'Rule.[Name,State,ScheduleExpression]' --output table

echo "✅ Backup verification completed"
"@

$BackupVerificationScript | Out-File -FilePath "scripts/verify-backup.ps1" -Encoding UTF8

# Create restore script
$RestoreScript = @"
#!/bin/bash
# System Restore Script

echo "🔄 Starting system restore..."

# Get latest snapshot
LATEST_SNAPSHOT=`aws rds describe-db-snapshots --db-instance-identifier waste-management-postgres --query 'DBSnapshots[0].DBSnapshotIdentifier' --output text`

echo "📊 Latest snapshot: `$LATEST_SNAPSHOT"

# Restore RDS instance
echo "🗄️  Restoring RDS instance..."
aws rds restore-db-instance-from-db-snapshot `
    --db-instance-identifier waste-management-postgres-restored `
    --db-snapshot-identifier `$LATEST_SNAPSHOT

# Wait for restore to complete
echo "⏳ Waiting for restore to complete..."
aws rds wait db-instance-available --db-instance-identifier waste-management-postgres-restored

echo "✅ Database restored successfully"

# Deploy application
echo "🚀 Deploying application..."
./scripts/deploy-production.ps1

echo "🎉 System restore completed!"
"@

$RestoreScript | Out-File -FilePath "scripts/restore-system.ps1" -Encoding UTF8

Write-Host "🎉 Backup and disaster recovery setup completed!" -ForegroundColor Blue
Write-Host "💾 Backup bucket: $BackupBucket" -ForegroundColor Green
Write-Host "⚡ Lambda function: WasteManagementBackup" -ForegroundColor Green
Write-Host "⏰ Backup schedule: Daily at 2 AM JST" -ForegroundColor Green
Write-Host "📋 DR Plan: backup/disaster-recovery-plan.md" -ForegroundColor Green
Write-Host "🔍 Verification script: scripts/verify-backup.ps1" -ForegroundColor Green
Write-Host "🔄 Restore script: scripts/restore-system.ps1" -ForegroundColor Green
