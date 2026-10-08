param([string]$Url = 'http://localhost:8080/tests/index.html')
$ErrorActionPreference = 'Stop'
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$logFile = Join-Path $PSScriptRoot 'test_results.log'
$errFile = Join-Path $PSScriptRoot 'test_browser.log'
$profileRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$profile = Join-Path $profileRoot ('ask-test-' + [Guid]::NewGuid().ToString('N'))
$code = 1
try {
  if (!(Test-Path -LiteralPath $edge)) { throw 'Microsoft Edge was not found.' }
  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
  if ($response.StatusCode -ne 200) { throw "Test server returned $($response.StatusCode)." }
  $arguments = @('--headless', '--disable-gpu', '--no-first-run', ('--user-data-dir="' + $profile + '"'),
    '--virtual-time-budget=60000', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--dump-dom', $Url)
  # ProcessStartInfo avoids PowerShell's duplicate Path/PATH environment bug.
  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $edge
  $startInfo.Arguments = $arguments -join ' '
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo = $startInfo
  $proc.Start() | Out-Null
  $stdout = $proc.StandardOutput.ReadToEndAsync()
  $stderr = $proc.StandardError.ReadToEndAsync()
  if (!$proc.WaitForExit(45000)) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    throw 'Browser tests timed out after 45 seconds.'
  }
  [IO.File]::WriteAllText($logFile, $stdout.Result, [Text.Encoding]::UTF8)
  [IO.File]::WriteAllText($errFile, $stderr.Result, [Text.Encoding]::UTF8)
  $content = Get-Content -LiteralPath $logFile -Encoding UTF8 -Raw
  $summary = [regex]::Match($content, '<p class="(?:ok|bad)">(\d+)/(\d+) passed</p>')
  if (!$summary.Success) { throw "Tests did not finish. See $logFile and $errFile." }
  Write-Host $summary.Groups[0].Value.Replace('<p class="ok">', '').Replace('<p class="bad">', '').Replace('</p>', '')
  if ($summary.Groups[1].Value -eq $summary.Groups[2].Value -and [int]$summary.Groups[2].Value -gt 0) { $code = 0 }
  else { Write-Host "Failing tests are recorded in $logFile" }
} catch {
  Write-Host $_.Exception.Message
} finally {
  # Only the unique temporary profile created by this invocation is removed.
  $resolvedProfile = [IO.Path]::GetFullPath($profile)
  if ($resolvedProfile.StartsWith($profileRoot, [StringComparison]::OrdinalIgnoreCase) -and
      [IO.Path]::GetFileName($resolvedProfile).StartsWith('ask-test-')) {
    Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
  }
}
exit $code
