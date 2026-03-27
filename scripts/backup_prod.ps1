[CmdletBinding()]
param(
  [string]$OutputDir = ".\backups"
)

$ErrorActionPreference = "Stop"

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) { $OutputDir } else { Join-Path $projectRoot $OutputDir }
$backupName = "web-inventory-prod-$timestamp"
$backupFile = Join-Path $backupDir "$backupName.dump"
$metaFile = Join-Path $backupDir "$backupName.meta.json"
$tempFile = "/tmp/$backupName.dump"
$containerName = "web-inventory-postgres-prod"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$dumpCommand = 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f "' + $tempFile + '"'
docker exec $containerName sh -lc $dumpCommand
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar dump no container postgres."
}

docker cp "${containerName}:$tempFile" "$backupFile"
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao copiar dump para o host."
}

docker exec $containerName sh -lc ('rm -f "' + $tempFile + '"') | Out-Null

$fileInfo = Get-Item -LiteralPath $backupFile
$meta = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  backupFile = $fileInfo.Name
  sizeBytes = $fileInfo.Length
  format = "pg_dump_custom"
  source = "postgresql"
  service = $containerName
}

$meta | ConvertTo-Json -Depth 4 | Set-Content -Path $metaFile

Write-Output "Backup criado em: $backupFile"
Write-Output "Metadados: $metaFile"
