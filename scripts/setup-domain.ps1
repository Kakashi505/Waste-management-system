# Domain Setup and SSL Configuration Script
param(
    [string]$Domain = "waste-management.jp",
    [string]$Region = "ap-northeast-1"
)

Write-Host "🌐 Setting up domain and SSL certificate..." -ForegroundColor Blue

# Request SSL certificate from AWS Certificate Manager
Write-Host "🔐 Requesting SSL certificate..." -ForegroundColor Blue
$CertificateArn = aws acm request-certificate `
    --domain-name $Domain `
    --subject-alternative-names "www.$Domain" "api.$Domain" "monitoring.$Domain" `
    --validation-method DNS `
    --region $Region `
    --query 'CertificateArn' `
    --output text

Write-Host "📋 Certificate ARN: $CertificateArn" -ForegroundColor Green

# Get DNS validation records
Write-Host "📝 Getting DNS validation records..." -ForegroundColor Blue
$ValidationRecords = aws acm describe-certificate `
    --certificate-arn $CertificateArn `
    --region $Region `
    --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]' `
    --output table

Write-Host "DNS Records to add:" -ForegroundColor Yellow
Write-Host $ValidationRecords -ForegroundColor Yellow

# Wait for certificate validation
Write-Host "⏳ Waiting for certificate validation..." -ForegroundColor Blue
Write-Host "Please add the DNS records above to your domain registrar and wait for validation." -ForegroundColor Yellow
Write-Host "Press any key when DNS validation is complete..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Check certificate status
do {
    $CertificateStatus = aws acm describe-certificate `
        --certificate-arn $CertificateArn `
        --region $Region `
        --query 'Certificate.Status' `
        --output text
    
    Write-Host "Certificate status: $CertificateStatus" -ForegroundColor Blue
    Start-Sleep -Seconds 30
} while ($CertificateStatus -ne "ISSUED")

Write-Host "✅ SSL certificate issued successfully!" -ForegroundColor Green

# Update ALB listener with SSL certificate
Write-Host "🔧 Updating ALB listener with SSL certificate..." -ForegroundColor Blue
aws elbv2 modify-listener `
    --listener-arn (aws elbv2 describe-listeners --load-balancer-arn (aws elbv2 describe-load-balancers --names "waste-management-alb" --query 'LoadBalancers[0].LoadBalancerArn' --output text) --query 'Listeners[0].ListenerArn' --output text) `
    --certificates CertificateArn=$CertificateArn

# Create Route 53 hosted zone (if not exists)
Write-Host "🗺️  Setting up Route 53 hosted zone..." -ForegroundColor Blue
try {
    $HostedZoneId = aws route53 get-hosted-zone --id $Domain --query 'HostedZone.Id' --output text 2>$null
    Write-Host "✅ Hosted zone already exists: $HostedZoneId" -ForegroundColor Green
} catch {
    Write-Host "📝 Creating new hosted zone..." -ForegroundColor Blue
    $HostedZoneId = aws route53 create-hosted-zone `
        --name $Domain `
        --caller-reference "waste-management-$(Get-Date -Format 'yyyyMMddHHmmss')" `
        --query 'HostedZone.Id' `
        --output text
    Write-Host "✅ Created hosted zone: $HostedZoneId" -ForegroundColor Green
}

# Get ALB DNS name
$ALBDNS = aws elbv2 describe-load-balancers --names "waste-management-alb" --query 'LoadBalancers[0].DNSName' --output text

# Create DNS records
Write-Host "📝 Creating DNS records..." -ForegroundColor Blue

# A record for main domain
$ChangeBatch = @{
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = $Domain
                Type = "A"
                AliasTarget = @{
                    DNSName = $ALBDNS
                    EvaluateTargetHealth = $true
                    HostedZoneId = "Z14GRHDCWA56QT"  # ALB hosted zone ID for ap-northeast-1
                }
            }
        }
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "www.$Domain"
                Type = "A"
                AliasTarget = @{
                    DNSName = $ALBDNS
                    EvaluateTargetHealth = $true
                    HostedZoneId = "Z14GRHDCWA56QT"
                }
            }
        }
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "api.$Domain"
                Type = "A"
                AliasTarget = @{
                    DNSName = $ALBDNS
                    EvaluateTargetHealth = $true
                    HostedZoneId = "Z14GRHDCWA56QT"
                }
            }
        }
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "monitoring.$Domain"
                Type = "A"
                AliasTarget = @{
                    DNSName = $ALBDNS
                    EvaluateTargetHealth = $true
                    HostedZoneId = "Z14GRHDCWA56QT"
                }
            }
        }
    )
} | ConvertTo-Json -Depth 10

aws route53 change-resource-record-sets `
    --hosted-zone-id $HostedZoneId `
    --change-batch $ChangeBatch

Write-Host "✅ DNS records created successfully!" -ForegroundColor Green

# Test domain resolution
Write-Host "🧪 Testing domain resolution..." -ForegroundColor Blue
Start-Sleep -Seconds 60  # Wait for DNS propagation

try {
    $Response = Invoke-WebRequest -Uri "https://$Domain/api/health" -UseBasicParsing
    Write-Host "✅ Domain is accessible: https://$Domain" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Domain may not be fully propagated yet. Please wait a few minutes." -ForegroundColor Yellow
}

Write-Host "🎉 Domain setup completed!" -ForegroundColor Blue
Write-Host "🌐 Your application is now accessible at: https://$Domain" -ForegroundColor Green
