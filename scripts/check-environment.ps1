# Waste Management System Environment Check Script

Write-Host "Environment check for Waste Management System..." -ForegroundColor Green

$issues = @()

# Node.js Check
Write-Host "`nNode.js Check..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
    
    # Version check
    $version = [version]($nodeVersion -replace 'v', '')
    if ($version.Major -lt 18) {
        $issues += "Node.js 18+ required (current: $nodeVersion)"
    }
} catch {
    $issues += "Node.js not installed"
    Write-Host "Node.js: Not installed" -ForegroundColor Red
}

# npm Check
Write-Host "`nnpm Check..." -ForegroundColor Blue
try {
    $npmVersion = npm --version
    Write-Host "npm: $npmVersion" -ForegroundColor Green
} catch {
    $issues += "npm not available"
    Write-Host "npm: Not available" -ForegroundColor Red
}

# Docker Check
Write-Host "`nDocker Check..." -ForegroundColor Blue
try {
    $dockerVersion = docker --version
    Write-Host "Docker: $dockerVersion" -ForegroundColor Green
} catch {
    $issues += "Docker not installed"
    Write-Host "Docker: Not installed" -ForegroundColor Red
}

# Docker Compose Check
Write-Host "`nDocker Compose Check..." -ForegroundColor Blue
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    $issues += "Docker Compose not available"
    Write-Host "Docker Compose: Not available" -ForegroundColor Red
}

# Port Check
Write-Host "`nPort Check..." -ForegroundColor Blue
$ports = @(3000, 5432, 6379, 80)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "Port $port is in use" -ForegroundColor Yellow
        $issues += "Port $port is in use"
    } else {
        Write-Host "Port $port is available" -ForegroundColor Green
    }
}

# File Check
Write-Host "`nFile Check..." -ForegroundColor Blue
$requiredFiles = @(
    "package.json",
    "docker-compose.yml",
    "env.example",
    "src/main.ts",
    "frontend/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "$file exists" -ForegroundColor Green
    } else {
        Write-Host "$file not found" -ForegroundColor Red
        $issues += "$file not found"
    }
}

# Results
Write-Host "`nEnvironment Check Results" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "All environment checks passed!" -ForegroundColor Green
    Write-Host "`nYou can start the system:" -ForegroundColor Green
    Write-Host "  docker-compose up -d" -ForegroundColor Gray
    Write-Host "  npm run seed" -ForegroundColor Gray
    Write-Host "  npm run start:dev" -ForegroundColor Gray
} else {
    Write-Host "Issues found:" -ForegroundColor Yellow
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    
    Write-Host "`nSolutions:" -ForegroundColor Yellow
    Write-Host "  1. Install Node.js 18+" -ForegroundColor Gray
    Write-Host "  2. Install Docker Desktop" -ForegroundColor Gray
    Write-Host "  3. Resolve port conflicts" -ForegroundColor Gray
    Write-Host "  4. Check required files" -ForegroundColor Gray
    
    Write-Host "`nSee SETUP_GUIDE.md for details" -ForegroundColor Cyan
}

Write-Host "`nCheck completed - $(Get-Date)" -ForegroundColor Cyan