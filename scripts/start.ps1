$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
docker compose up --build -d
Write-Host "Running at http://localhost:8000"
