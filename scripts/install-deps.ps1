# ============================================
# 📦 Install Dependencies for All Services
# ============================================
# PowerShell script for Windows
# Run this script to install all dependencies

$ErrorActionPreference = "Stop"

Write-Host "🚀 Installing dependencies for all DevConnect services..." -ForegroundColor Cyan
Write-Host ""

function Install-ServiceDeps {
    param(
        [string]$ServiceName,
        [string]$ServicePath
    )
    
    Write-Host "📦 Installing dependencies for $ServiceName..." -ForegroundColor Yellow
    
    Push-Location $ServicePath
    
    try {
        # Install base dependencies
        npm install
        
        # Install production security packages
        npm install --save helmet compression @nestjs/terminus
        npm install --save-dev @types/compression
        
        Write-Host "✅ $ServiceName dependencies installed" -ForegroundColor Green
        Write-Host ""
    }
    catch {
        Write-Host "❌ Error installing $ServiceName dependencies: $_" -ForegroundColor Red
        throw
    }
    finally {
        Pop-Location
    }
}

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

# Install root dependencies (if any)
if (Test-Path "package.json") {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Install for each service
Install-ServiceDeps -ServiceName "Core Service" -ServicePath "services\core-service"
Install-ServiceDeps -ServiceName "Chat Service" -ServicePath "services\chat-service"
Install-ServiceDeps -ServiceName "Projects Service" -ServicePath "services\projects-service"  
Install-ServiceDeps -ServiceName "Notification Service" -ServicePath "services\notification-service"

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables (.env files)"
Write-Host "2. Run Prisma migrations: npm run prisma:migrate"
Write-Host "3. Start services: docker-compose up --build"
Write-Host ""
Write-Host "For more details, see " -NoNewline
Write-Host "DEPLOYMENT.md" -ForegroundColor Green
