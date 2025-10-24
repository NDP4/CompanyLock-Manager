# CompanyLock Manager - Setup Script untuk Windows
# Script ini akan setup database MySQL dan menjalankan aplikasi

Write-Host "=== CompanyLock Manager Setup ===" -ForegroundColor Green
Write-Host ""

# Check apakah MySQL service berjalan
Write-Host "1. Checking MySQL service..." -ForegroundColor Yellow
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($mysqlService -and $mysqlService.Status -eq "Running") {
    Write-Host "✓ MySQL service is running" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL service not found or not running" -ForegroundColor Red
    Write-Host "Please install MySQL and start the service first." -ForegroundColor Red
    Write-Host "Download from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor Cyan
    exit 1
}

# Setup database
Write-Host ""
Write-Host "2. Setting up database..." -ForegroundColor Yellow
Write-Host "Please enter your MySQL root password when prompted." -ForegroundColor Cyan

# Coba jalankan setup database
try {
    mysql -u root -p < setup_database.sql
    Write-Host "✓ Database setup completed" -ForegroundColor Green
} catch {
    Write-Host "✗ Database setup failed" -ForegroundColor Red
    Write-Host "Please run this command manually:" -ForegroundColor Yellow
    Write-Host "mysql -u root -p < setup_database.sql" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Or connect to MySQL and run these commands:" -ForegroundColor Yellow
    Write-Host "CREATE DATABASE IF NOT EXISTS companylock_db;" -ForegroundColor Cyan
    Write-Host "CREATE USER IF NOT EXISTS 'companylock'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';" -ForegroundColor Cyan
    Write-Host "GRANT ALL PRIVILEGES ON companylock_db.* TO 'companylock'@'localhost';" -ForegroundColor Cyan
    Write-Host "FLUSH PRIVILEGES;" -ForegroundColor Cyan
    
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Generate secrets
Write-Host ""
Write-Host "3. Generating secrets..." -ForegroundColor Yellow
if (Test-Path "generate_secrets.py") {
    python generate_secrets.py
    Write-Host "✓ Secrets generated" -ForegroundColor Green
} else {
    Write-Host "✗ generate_secrets.py not found" -ForegroundColor Red
}

# Install frontend dependencies
Write-Host ""
Write-Host "4. Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
try {
    npm install
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend installation failed" -ForegroundColor Red
    Write-Host "Please run 'npm install' manually in frontend folder" -ForegroundColor Yellow
}
Set-Location ..

# Install backend dependencies
Write-Host ""
Write-Host "5. Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
try {
    pip install -r requirements.txt
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend installation failed" -ForegroundColor Red
    Write-Host "Please run 'pip install -r requirements.txt' manually in backend folder" -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "1. Start backend:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "2. Start frontend (in new terminal):" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "3. Access application at:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend API: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Default login: admin / admin123" -ForegroundColor Green