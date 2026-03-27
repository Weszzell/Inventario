[CmdletBinding()]
param(
  [string]$OutputDir = ".\backups",
  [int]$RetentionDays = 14,
  [string]$LogDir = ".\backups\logs"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) { $OutputDir } else { Join-Path $projectRoot $OutputDir }
$resolvedLogDir = if ([System.IO.Path]::IsPathRooted($LogDir)) { $LogDir } else { Join-Path $projectRoot $LogDir }

New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
New-Item -ItemType Directory -Path $resolvedLogDir -Force | Out-Null

$logFile = Join-Path $resolvedLogDir ("scheduled-backup-" + (Get-Date -Format "yyyyMM") + ".log")

function Write-BackupLog([string]$message) {
  $line = "[$((Get-Date).ToString('o'))] $message"
  Add-Content -Path $logFile -Value $line
  Write-Output $line
}

try {
  Write-BackupLog "Iniciando rotina agendada de backup."
  & (Join-Path $PSScriptRoot 'backup_prod.ps1') -OutputDir $resolvedOutputDir
  Write-BackupLog "Backup concluido com sucesso."
  & (Join-Path $PSScriptRoot 'cleanup_backups.ps1') -OutputDir $resolvedOutputDir -RetentionDays $RetentionDays
  Write-BackupLog "Limpeza de retencao concluida com sucesso."
  Write-BackupLog "Rotina agendada finalizada sem erros."
}
catch {
  Write-BackupLog ("Falha na rotina agendada: " + $_.Exception.Message)
  throw
}
