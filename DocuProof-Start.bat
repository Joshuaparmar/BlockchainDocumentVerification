
@echo off
setlocal
title DocuProof Launcher

REM Find the project folder automatically
set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"

echo.
echo ======================================
echo       DocuProof Project Launcher
echo ======================================
echo.

REM Check Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not on PATH.
    pause
    exit /b 1
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) < 22 || (process.versions.node.split('.')[0] === '22' && Number(process.versions.node.split('.')[1]) < 13) ? 1 : 0)"
if errorlevel 1 (
    echo ERROR: Install Node.js 22.13.0 or later.
    echo Then reopen this launcher.
    pause
    exit /b 1
)

REM Check required files
if not exist "%ROOT%hardhat.config.js" (
    echo ERROR: hardhat.config.js not found.
    echo Place this BAT file in the project root.
    pause
    exit /b 1
)

if not exist "%ROOT%scripts\deploy.js" (
    echo ERROR: scripts\deploy.js not found.
    pause
    exit /b 1
)

if not exist "%BACKEND%\server.js" (
    echo ERROR: backend\server.js not found.
    pause
    exit /b 1
)

REM Install dependencies when needed
echo [1/6] Checking root dependencies...
if not exist "%ROOT%node_modules" (
    pushd "%ROOT%"
    call npm install
    if errorlevel 1 goto :failed
    popd
)

if not exist "%FRONTEND%\node_modules" (
    echo Installing frontend dependencies...
    pushd "%FRONTEND%"
    call npm install
    if errorlevel 1 goto :failed
    popd
)

if not exist "%BACKEND%\node_modules" (
    echo Installing backend dependencies...
    pushd "%BACKEND%"
    call npm install
    if errorlevel 1 goto :failed
    popd
)

REM Compile contract
echo [2/6] Compiling smart contract...
pushd "%ROOT%"
call npx hardhat compile
if errorlevel 1 goto :failed

REM Start blockchain
echo [3/6] Starting local blockchain...
start "DocuProof Blockchain" /D "%ROOT%" cmd /k "npx hardhat node"

echo Waiting for blockchain to start...
timeout /t 8 /nobreak >nul

REM Deploy contract
echo [4/6] Deploying contract...
call npx hardhat run scripts/deploy.js --network localhost
if errorlevel 1 goto :failed

popd

REM Check backend environment file
if not exist "%BACKEND%\.env" (
    echo.
    echo WARNING: backend\.env was not found.
    echo Configure your Pinata credentials before uploading documents.
    echo.
)

REM Start backend
echo [5/6] Starting backend...
start "DocuProof Backend" /D "%BACKEND%" cmd /k "node server.js"

REM Start frontend
echo [6/6] Starting frontend...
start "DocuProof Frontend" /D "%FRONTEND%" cmd /k "npm run dev"

echo.
echo ======================================
echo Startup commands have been launched.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3001
echo Blockchain: http://127.0.0.1:8545
echo ======================================
echo.
echo Keep the three server windows open.
echo Check the deployment address against
echo frontend\src\contract.js before testing.
echo.
pause
exit /b 0

:failed
echo.
echo ERROR: A setup, compilation, or deployment command failed.
echo Read the error above before trying again.
popd
pause
exit /b 1
