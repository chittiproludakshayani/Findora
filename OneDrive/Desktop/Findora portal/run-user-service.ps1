$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$maven = Join-Path $projectRoot '.tools\apache-maven-3.9.9\bin\mvn.cmd'
$securePassword = Read-Host 'Enter the MySQL root password' -AsSecureString
$password = [System.Net.NetworkCredential]::new('', $securePassword).Password

if (-not (Test-Path $maven)) {
    throw "Local Maven was not found at $maven"
}

$env:DB_USERNAME = 'root'
$env:DB_PASSWORD = $password
$env:JWT_SECRET = 'findora-development-secret-change-this-32-chars'

Push-Location $projectRoot
try {
    & $maven -f '.\backend\user-service\pom.xml' spring-boot:run
} finally {
    Pop-Location
    Remove-Item Env:\DB_PASSWORD -ErrorAction SilentlyContinue
}
