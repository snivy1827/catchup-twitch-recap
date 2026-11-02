$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$outputDir = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$allowed = @('src','public','tests','scripts','docs','package.json','package-lock.json','.env.example','.gitignore','README.md','README.zh-TW.md','LICENSE','SPEC.md')
$paths = $allowed | ForEach-Object { Join-Path $projectRoot $_ }
foreach ($file in $paths) { if (-not (Test-Path -LiteralPath $file)) { throw "Missing required package file: $file" } }
$zip = Join-Path $outputDir 'catchup-demo-v0.1.zip'
Compress-Archive -LiteralPath $paths -DestinationPath $zip -Force
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
Set-Content -LiteralPath (Join-Path $outputDir 'SHA256.txt') -Value "$hash  catchup-demo-v0.1.zip" -Encoding ascii
Write-Output $zip
Write-Output $hash
