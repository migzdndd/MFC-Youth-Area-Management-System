Get-ChildItem -Path Views,Styles -Filter *.xaml -Recurse | Select-String '<Setter Property="Foreground" Value="{StaticResource ([^}]+)}"' | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique

