[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedBackupFile = if ([System.IO.Path]::IsPathRooted($BackupFile)) { $BackupFile } else { Join-Path $projectRoot $BackupFile }
$containerName = "web-inventory-postgres-prod"

if (-not (Test-Path -LiteralPath $resolvedBackupFile)) {
  throw "Arquivo de backup nao encontrado: $resolvedBackupFile"
}

$fileName = [System.IO.Path]::GetFileName($resolvedBackupFile)
$tempFile = "/tmp/$fileName"

docker cp "$resolvedBackupFile" "${containerName}:$tempFile"
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao copiar backup para o container postgres."
}

$restoreCommand = 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-privileges "' + $tempFile + '"'
docker exec $containerName sh -lc $restoreCommand
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao restaurar backup no banco de producao."
}

docker exec $containerName sh -lc ('rm -f "' + $tempFile + '"') | Out-Null

Write-Output "Backup restaurado com sucesso: $resolvedBackupFile"
