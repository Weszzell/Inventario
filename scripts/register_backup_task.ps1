[CmdletBinding()]
param(
  [string]$TaskName = "WebInventoryDailyBackup",
  [string]$StartTime = "02:30",
  [string]$OutputDir = ".\backups",
  [int]$RetentionDays = 14,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot 'run_scheduled_backup.ps1'
$resolvedOutputDir = if ([System.IO.Path]::IsPathRooted($OutputDir)) { $OutputDir } else { Join-Path $projectRoot $OutputDir }
$taskCommand = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "' + $scriptPath + '" -OutputDir "' + $resolvedOutputDir + '" -RetentionDays ' + $RetentionDays

if ($Force) {
  schtasks /Delete /TN $TaskName /F 2>$null | Out-Null
}

schtasks /Create /F /SC DAILY /ST $StartTime /TN $TaskName /TR $taskCommand
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao registrar a tarefa '$TaskName' via schtasks."
}

Write-Output "Tarefa registrada: $TaskName"
Write-Output "Horario: $StartTime"
Write-Output "Comando: $taskCommand"
