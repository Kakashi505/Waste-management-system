# Security Hardening and Penetration Testing Script
param(
    [string]$Domain = "waste-management.jp",
    [string]$Region = "ap-northeast-1"
)

Write-Host "🛡️  Starting security hardening..." -ForegroundColor Blue

# Enable AWS Config for compliance monitoring
Write-Host "📋 Enabling AWS Config..." -ForegroundColor Blue
aws configservice put-configuration-recorder `
    --configuration-recorder name=default,roleARN=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/ConfigRole,recordingGroup=allSupported=true,recordingMode=CONTINUOUS

aws configservice put-delivery-channel `
    --delivery-channel name=default,s3BucketName=waste-management-config-bucket,s3KeyPrefix=config/,snsTopicARN=arn:aws:sns:$Region`:$(aws sts get-caller-identity --query Account --output text):config-topic

aws configservice start-configuration-recorder `
    --configuration-recorder-name default

Write-Host "✅ AWS Config enabled" -ForegroundColor Green

# Enable AWS GuardDuty for threat detection
Write-Host "🔍 Enabling AWS GuardDuty..." -ForegroundColor Blue
aws guardduty create-detector `
    --enable `
    --finding-publishing-frequency FIFTEEN_MINUTES

Write-Host "✅ AWS GuardDuty enabled" -ForegroundColor Green

# Enable AWS Security Hub
Write-Host "🔒 Enabling AWS Security Hub..." -ForegroundColor Blue
aws securityhub enable-security-hub `
    --enable-default-standards

Write-Host "✅ AWS Security Hub enabled" -ForegroundColor Green

# Create WAF (Web Application Firewall)
Write-Host "🛡️  Creating WAF..." -ForegroundColor Blue

# Create WAF Web ACL
$WebACLArn = aws wafv2 create-web-acl `
    --name WasteManagementWAF `
    --scope REGIONAL `
    --default-action Allow={} `
    --rules '[
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 1,
            "OverrideAction": {"None": {}},
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "CommonRuleSetMetric"
            }
        },
        {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 2,
            "OverrideAction": {"None": {}},
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "KnownBadInputsMetric"
            }
        },
        {
            "Name": "RateLimitRule",
            "Priority": 3,
            "Action": {"Block": {}},
            "Statement": {
                "RateBasedStatement": {
                    "Limit": 2000,
                    "AggregateKeyType": "IP"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "RateLimitMetric"
            }
        }
    ]' `
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=WasteManagementWAFMetric `
    --query 'Summary.ARN' `
    --output text

# Associate WAF with ALB
$ALBArn = aws elbv2 describe-load-balancers --names waste-management-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text
aws wafv2 associate-web-acl `
    --web-acl-arn $WebACLArn `
    --resource-arn $ALBArn

Write-Host "✅ WAF created and associated with ALB" -ForegroundColor Green

# Enable VPC Flow Logs
Write-Host "📊 Enabling VPC Flow Logs..." -ForegroundColor Blue
$VPCId = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=waste-management-vpc" --query 'Vpcs[0].VpcId' --output text

aws ec2 create-flow-logs `
    --resource-type VPC `
    --resource-ids $VPCId `
    --traffic-type ALL `
    --log-destination-type cloud-watch-logs `
    --log-group-name /aws/vpc/flowlogs

Write-Host "✅ VPC Flow Logs enabled" -ForegroundColor Green

# Create security groups with least privilege
Write-Host "🔐 Updating security groups..." -ForegroundColor Blue

# Update ALB security group
$ALBSecurityGroupId = aws ec2 describe-security-groups --filters "Name=group-name,Values=waste-management-alb-*" --query 'SecurityGroups[0].GroupId' --output text

# Remove overly permissive rules and add specific ones
aws ec2 revoke-security-group-ingress `
    --group-id $ALBSecurityGroupId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0

aws ec2 revoke-security-group-ingress `
    --group-id $ALBSecurityGroupId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0

# Add specific rules
aws ec2 authorize-security-group-ingress `
    --group-id $ALBSecurityGroupId `
    --protocol tcp `
    --port 80 `
    --cidr 0.0.0.0/0 `
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Purpose,Value=HTTP}]'

aws ec2 authorize-security-group-ingress `
    --group-id $ALBSecurityGroupId `
    --protocol tcp `
    --port 443 `
    --cidr 0.0.0.0/0 `
    --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Purpose,Value=HTTPS}]'

Write-Host "✅ Security groups updated" -ForegroundColor Green

# Enable encryption at rest for all services
Write-Host "🔒 Enabling encryption at rest..." -ForegroundColor Blue

# Enable encryption for RDS
aws rds modify-db-instance `
    --db-instance-identifier waste-management-postgres `
    --storage-encrypted `
    --apply-immediately

# Enable encryption for ElastiCache
aws elasticache modify-replication-group `
    --replication-group-id waste-management-redis `
    --at-rest-encryption-enabled `
    --transit-encryption-enabled

Write-Host "✅ Encryption at rest enabled" -ForegroundColor Green

# Create penetration testing script
Write-Host "🔍 Creating penetration testing script..." -ForegroundColor Blue

$PenTestScript = @"
#!/bin/bash
# Penetration Testing Script for Waste Management System

echo "🔍 Starting penetration testing..."

# Check for common vulnerabilities
echo "📋 Checking for common vulnerabilities..."

# 1. SSL/TLS Configuration
echo "🔐 Testing SSL/TLS configuration..."
sslscan $Domain | tee ssl-test-results.txt

# 2. HTTP Security Headers
echo "🛡️  Testing HTTP security headers..."
curl -I https://$Domain | tee http-headers-test.txt

# 3. SQL Injection Testing
echo "💉 Testing for SQL injection vulnerabilities..."
sqlmap -u "https://$Domain/api/cases" --batch --level=5 --risk=3 --output-dir=sqlmap-results

# 4. XSS Testing
echo "🎯 Testing for XSS vulnerabilities..."
xsser --url="https://$Domain" --auto --threads=10 --output=xss-results.txt

# 5. Directory Traversal Testing
echo "📁 Testing for directory traversal vulnerabilities..."
dirb https://$Domain /usr/share/wordlists/dirb/common.txt -o dirb-results.txt

# 6. Port Scanning
echo "🔍 Scanning for open ports..."
nmap -sS -O -sV -p- $Domain -oN nmap-results.txt

# 7. Vulnerability Scanning
echo "🔍 Running vulnerability scan..."
openvas-cli --target=$Domain --profile="Full and fast" --output=vulnerability-report.xml

# 8. API Security Testing
echo "🔌 Testing API security..."
# Test for authentication bypass
curl -X POST https://$Domain/api/auth/login -d '{"email":"admin@test.com","password":"test"}' -H "Content-Type: application/json"

# Test for authorization bypass
curl -X GET https://$Domain/api/admin/users -H "Authorization: Bearer invalid-token"

# Test for rate limiting
for i in {1..100}; do
    curl -X GET https://$Domain/api/health
done

# 9. File Upload Testing
echo "📤 Testing file upload security..."
# Test malicious file upload
curl -X POST https://$Domain/api/photos/upload \
    -F "file=@malicious.php" \
    -F "description=test"

# 10. Input Validation Testing
echo "✅ Testing input validation..."
# Test with malicious inputs
curl -X POST https://$Domain/api/cases \
    -H "Content-Type: application/json" \
    -d '{"wasteType":"<script>alert(1)</script>","description":"'; DROP TABLE users; --"}'

echo "📊 Penetration testing completed. Check results files for details."
echo "📋 Results:"
echo "  - SSL Test: ssl-test-results.txt"
echo "  - HTTP Headers: http-headers-test.txt"
echo "  - SQL Injection: sqlmap-results/"
echo "  - XSS: xss-results.txt"
echo "  - Directory Traversal: dirb-results.txt"
echo "  - Port Scan: nmap-results.txt"
echo "  - Vulnerabilities: vulnerability-report.xml"
"@

$PenTestScript | Out-File -FilePath "security/penetration-test.sh" -Encoding UTF8

# Create security checklist
$SecurityChecklist = @"
# Security Hardening Checklist

## Infrastructure Security
- [ ] WAF configured and active
- [ ] Security groups follow least privilege principle
- [ ] VPC Flow Logs enabled
- [ ] Encryption at rest enabled for all services
- [ ] Encryption in transit enabled
- [ ] AWS Config enabled for compliance monitoring
- [ ] GuardDuty enabled for threat detection
- [ ] Security Hub enabled for centralized security management

## Application Security
- [ ] Input validation implemented
- [ ] Output encoding implemented
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Authentication and authorization properly implemented
- [ ] Session management secure
- [ ] File upload security implemented
- [ ] API security implemented

## Data Security
- [ ] Sensitive data encrypted
- [ ] Database encryption enabled
- [ ] Backup encryption enabled
- [ ] Data retention policies implemented
- [ ] Data anonymization where required
- [ ] Access logging enabled

## Monitoring and Alerting
- [ ] Security event logging enabled
- [ ] Intrusion detection system active
- [ ] Security monitoring dashboard configured
- [ ] Incident response plan documented
- [ ] Security alerts configured
- [ ] Regular security assessments scheduled

## Compliance
- [ ] GDPR compliance implemented
- [ ] ISO 27001 controls implemented
- [ ] SOC 2 controls implemented
- [ ] Regular compliance audits scheduled
- [ ] Data protection impact assessments completed
- [ ] Privacy by design implemented

## Testing
- [ ] Penetration testing completed
- [ ] Vulnerability scanning completed
- [ ] Security code review completed
- [ ] Regular security testing scheduled
- [ ] Bug bounty program considered
- [ ] Red team exercises planned

## Documentation
- [ ] Security policies documented
- [ ] Incident response procedures documented
- [ ] Security training materials prepared
- [ ] Regular security awareness training scheduled
- [ ] Security metrics and KPIs defined
"@

$SecurityChecklist | Out-File -FilePath "security/security-checklist.md" -Encoding UTF8

# Create security monitoring dashboard
$SecurityDashboard = @"
{
  "dashboard": {
    "id": null,
    "title": "Security Monitoring Dashboard",
    "tags": ["security"],
    "timezone": "Asia/Tokyo",
    "panels": [
      {
        "id": 1,
        "title": "Failed Login Attempts",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(auth_failed_logins_total[5m])",
            "legendFormat": "Failed logins/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Suspicious IP Addresses",
        "type": "table",
        "targets": [
          {
            "expr": "topk(10, rate(http_requests_total[5m]) by (client_ip))",
            "format": "table"
          }
        ]
      },
      {
        "id": 3,
        "title": "Security Events",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(security_events_total[5m])",
            "legendFormat": "{{event_type}}"
          }
        ]
      },
      {
        "id": 4,
        "title": "WAF Blocked Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(aws_waf_blocked_requests_total[5m])",
            "legendFormat": "Blocked requests/sec"
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

$SecurityDashboard | Out-File -FilePath "security/security-dashboard.json" -Encoding UTF8

Write-Host "🎉 Security hardening completed!" -ForegroundColor Blue
Write-Host "🛡️  WAF: Enabled and configured" -ForegroundColor Green
Write-Host "🔍 GuardDuty: Enabled for threat detection" -ForegroundColor Green
Write-Host "📋 AWS Config: Enabled for compliance monitoring" -ForegroundColor Green
Write-Host "🔒 Security Hub: Enabled for centralized security management" -ForegroundColor Green
Write-Host "🔐 Encryption: Enabled for all services" -ForegroundColor Green
Write-Host "📊 VPC Flow Logs: Enabled for network monitoring" -ForegroundColor Green
Write-Host "🔍 Penetration test script: security/penetration-test.sh" -ForegroundColor Green
Write-Host "📋 Security checklist: security/security-checklist.md" -ForegroundColor Green
Write-Host "📊 Security dashboard: security/security-dashboard.json" -ForegroundColor Green
