param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found on PATH."
    }
}

Require-Command node
Require-Command npx
Require-Command codex

$nodeVersion = (& node --version).Trim()
if ($nodeVersion -notmatch '^v(\d+)\.') {
    throw "Could not determine Node.js version: $nodeVersion"
}

$nodeMajor = [int]$Matches[1]
if ($nodeMajor -lt 18) {
    throw "ECC requires Node.js 18 or newer. Found $nodeVersion."
}

$arguments = @(
    "--yes",
    "ecc-universal@2.2.3",
    "install",
    "--guided",
    "--harness",
    "codex"
)

if ($DryRun) {
    $arguments += "--dry-run"
}

Write-Host "Running official ECC Codex installer..."
Write-Host ("npx " + ($arguments -join " "))

& npx @arguments
if ($LASTEXITCODE -ne 0) {
    throw "ECC installer exited with code $LASTEXITCODE."
}

if ($DryRun) {
    Write-Host "Dry run completed. No ECC install should have been applied."
} else {
    Write-Host "ECC Codex installation completed. Restart Codex before using the new plugin state."
}
