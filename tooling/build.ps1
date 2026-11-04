$ErrorActionPreference = "Stop"

# OwlFly build: use the canonical esbuild-based Node generator.
# Do not concatenate ES modules into a shared global scope.

$root = Split-Path -Parent $PSScriptRoot
$builder = Join-Path $PSScriptRoot "build.mjs"

if (!(Test-Path -LiteralPath $builder -PathType Leaf)) {
    throw "Missing OwlFly Node build generator: $builder"
}

$nodeCommand = Get-Command node -ErrorAction Stop

Push-Location -LiteralPath $root
try {
    & $nodeCommand.Source $builder
    if ($LASTEXITCODE -ne 0) {
        throw "OwlFly Node build failed with exit code $LASTEXITCODE"
    }

    # Preserve the legacy PowerShell entry point's index selection.
    $prod = Join-Path $root "web/index.prod.html"
    $index = Join-Path $root "web/index.html"

    if (!(Test-Path -LiteralPath $prod -PathType Leaf)) {
        throw "Missing production HTML template: $prod"
    }

    Copy-Item -LiteralPath $prod -Destination $index -Force

    Write-Host "OwlFly build complete."
}
finally {
    Pop-Location
}
