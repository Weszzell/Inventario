[CmdletBinding()]
param(
  [string]$OutputDir = ".\backups",
  [int]$RetentionDays = 14
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) { $OutputDir } else { Join-Path $projectRoot $OutputDir }

if (-not (Test-Path -LiteralPath $backupDir)) {
  Write-Output "Diretorio de backups inexistente: $backupDir"
  exit 0
}

$limit = (Get-Date).AddDays(-$RetentionDays)
$removed = Get-ChildItem -Path $backupDir -File | Where-Object {
  $_.Extension -in ".dump", ".json" -and $_.LastWriteTime -lt $limit
}

foreach ($file in $removed) {
  Remove-Item -LiteralPath $file.FullName -Force
}

Write-Output "Arquivos removidos: $($removed.Count)"
Write-Output "Retencao aplicada: $RetentionDays dias"
