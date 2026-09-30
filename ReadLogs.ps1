Get-ChildItem -Path "$env:LOCALAPPDATA\MFCYouthAreaManagementSystem\Logs" -Filter *.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 150

