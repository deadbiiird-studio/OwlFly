$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$required = @(
  ".gitignore",
  "README.md",
  "package.json",
  "src\app\boot.js",
  "src\core\constants.js",
  "src\engine\gameLoop.js",
  "src\engine\entities\owl.js",
  "src\engine\entities\cactusPair.js",
  "web\index.html",
  "web\style.css",
  "web\manifest.webmanifest",
  "web\sw.js"
)

$missing = @()
foreach ($p in $required) {
  $full = Join-Path $root $p
  if (-not (Test-Path $full)) { $missing += $p }
}

if ($missing.Count -gt 0) {
  Write-Host "Missing files:"
  $missing | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "Tree verification OK."
