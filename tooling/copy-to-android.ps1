$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$src  = Join-Path $root "web"
$dst  = Join-Path $root "android\app\src\main\assets\public"

if (-not (Test-Path $dst)) {
  Write-Host "Target not found: $dst"
  Write-Host "Generate android/ first (Capacitor), or edit `$dst in this script."
  exit 1
}

robocopy $src $dst /MIR | Out-Null
Write-Host "Copied web/ -> $dst"
