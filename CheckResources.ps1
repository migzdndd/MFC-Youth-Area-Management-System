$colors = Get-Content Styles\Colors.xaml | Select-String 'x:Key="([^"]+)"' | ForEach-Object { $_.Matches.Groups[1].Value }
$other = Get-Content Styles\*.xaml | Select-String 'x:Key="([^"]+)"' | ForEach-Object { $_.Matches.Groups[1].Value }
$allKeys = $colors + $other

Get-ChildItem -Path Views,Styles -Filter *.xaml -Recurse | Select-String 'StaticResource ([a-zA-Z0-9_]+)' | ForEach-Object { $_.Matches.Groups[1].Value } | Sort-Object -Unique | Where-Object { $allKeys -notcontains $_ }

