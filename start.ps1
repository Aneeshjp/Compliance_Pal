# GST Compass - Full Project Startup Script (Windows PowerShell)
# Run from project root: .\start.ps1

$ErrorActionPreference = "Continue"
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ROOT) { $ROOT = Get-Location }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GST Compass - Setup & Launch         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 0: Verify Prerequisites ---------------------------------------------

Write-Host "[0/5] Checking prerequisites..." -ForegroundColor Yellow

$allGood = $true

# Check Python
try {
    $pyVersion = python --version 2>&1
    Write-Host "  [OK] $pyVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Python not found! Install Python 3.11+ from https://python.org" -ForegroundColor Red
    $allGood = $false
}

# Check pip
try {
    $pipVersion = pip --version 2>&1
    Write-Host "  [OK] pip found" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] pip not found!" -ForegroundColor Red
    $allGood = $false
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  [OK] Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    $allGood = $false
}

# Check npm (using npm.cmd for strict Windows compatibility)
try {
    $npmVersion = npm.cmd --version 2>&1
    Write-Host "  [OK] npm v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  [FAIL] npm not found!" -ForegroundColor Red
    $allGood = $false
}

# Check .env
if (Test-Path "$ROOT\.env") {
    Write-Host "  [OK] .env file found" -ForegroundColor Green

    # Validate critical env vars
    $envContent = Get-Content "$ROOT\.env" -Raw
    if ($envContent -match "MONGODB_URI=\s*$" -or $envContent -notmatch "MONGODB_URI=") {
        Write-Host "  [WARN] MONGODB_URI is empty in .env!" -ForegroundColor Yellow
    }
    if ($envContent -match "GEMINI_API_KEY=\s*$" -or $envContent -notmatch "GEMINI_API_KEY=") {
        Write-Host "  [WARN] GEMINI_API_KEY is empty - AI assistant won't work" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [FAIL] .env file not found at $ROOT\.env" -ForegroundColor Red
    Write-Host "         Create it with MONGODB_URI, GEMINI_API_KEY, JWT_SECRET, etc." -ForegroundColor Yellow
    $allGood = $false
}

if (-not $allGood) {
    Write-Host ""
    Write-Host "Fix the above issues and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# --- Step 1: Python Virtual Environment ---------------------------------------

Write-Host "[1/5] Setting up Python virtual environment..." -ForegroundColor Yellow

$venvPath = "$ROOT\backend\venv"
if (Test-Path "$venvPath\Scripts\python.exe") {
    # Check if python is working (catches moved/broken venvs)
    & "$venvPath\Scripts\python.exe" --version 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] Virtual environment is broken. Recreating..." -ForegroundColor Yellow
        cmd.exe /c rd /s /q "$venvPath"
    }
}

if (-not (Test-Path "$venvPath\Scripts\python.exe")) {
    Write-Host "  Creating venv..." -ForegroundColor Gray
    python -m venv "$venvPath"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] Could not create virtual environment" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] venv ready at backend\venv" -ForegroundColor Green

# --- Step 2: Install Python Dependencies --------------------------------------

Write-Host "[2/5] Installing Python dependencies..." -ForegroundColor Yellow
& "$venvPath\Scripts\python.exe" -m pip install -r "$ROOT\backend\requirements.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [FAIL] pip install failed - check errors above" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] All Python packages installed" -ForegroundColor Green

# --- Step 3: Create Required Directories --------------------------------------

Write-Host "[3/5] Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "$ROOT\backend\uploads" -ErrorAction SilentlyContinue | Out-Null
New-Item -ItemType Directory -Force -Path "$ROOT\backend\demo_documents" -ErrorAction SilentlyContinue | Out-Null
Write-Host "  [OK] uploads/ and demo_documents/ ready" -ForegroundColor Green

# --- Step 4: Install Node.js Dependencies -------------------------------------

Write-Host "[4/5] Installing Node.js dependencies..." -ForegroundColor Yellow
Push-Location "$ROOT\frontend"
if (-not (Test-Path "node_modules\.package-lock.json")) {
    npm.cmd install --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [FAIL] npm install failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}
Pop-Location
Write-Host "  [OK] All Node packages installed" -ForegroundColor Green

# --- Step 5: Launch Servers ----------------------------------------------------

Write-Host ""
Write-Host "[5/5] Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Load .env into current process for backend
Get-Content "$ROOT\.env" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line -split "=", 2
        $key = $parts[0].Trim()
        $val = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
    }
}

# Start backend
$backendProc = Start-Process -FilePath "$venvPath\Scripts\python.exe" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--host", "0.0.0.0" `
    -WorkingDirectory "$ROOT\backend" `
    -PassThru -NoNewWindow

# Small delay to let backend start
Start-Sleep -Seconds 2

# Start frontend (using npm.cmd for strict Windows compatibility)
$frontendProc = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory "$ROOT\frontend" `
    -PassThru -NoNewWindow

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  GST Compass is running!              " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend API:  http://localhost:8000       " -ForegroundColor Cyan
Write-Host "  Frontend:     http://localhost:3000       " -ForegroundColor Cyan
Write-Host "  API Docs:     http://localhost:8000/docs  " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop both servers." -ForegroundColor Yellow
Write-Host ""

# Wait for either process to exit
try {
    while (-not $backendProc.HasExited -and -not $frontendProc.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nShutting down processes safely..." -ForegroundColor Yellow
    # Use taskkill to kill the entire process tree (/T) forcefully (/F) to prevent ghost node/python instances
    if (-not $backendProc.HasExited) { 
        taskkill /PID $($backendProc.Id) /T /F 2>&1 | Out-Null
    }
    if (-not $frontendProc.HasExited) { 
        taskkill /PID $($frontendProc.Id) /T /F 2>&1 | Out-Null
    }
    Write-Host "Both servers and child processes stopped. Goodbye!" -ForegroundColor Green
}
