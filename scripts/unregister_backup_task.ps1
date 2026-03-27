[CmdletBinding()]
param(
  [string]$TaskName = "WebInventoryDailyBackup"
)

$ErrorActionPreference = "Stop"

schtasks /Delete /TN $TaskName /F
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao remover a tarefa '$TaskName'."
}

Write-Output "Tarefa removida: $TaskName"
