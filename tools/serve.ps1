# Serves the game at http://localhost:8080 (ES modules need http://, not file://).
# Usage:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1 [-Port 8080]
param([int]$Port = 8080)

$root = Resolve-Path (Join-Path $PSScriptRoot '..')

# 1) Prefer Python with explicit no-store headers for the complete module graph.
# @(...) around the pipeline keeps it an array even when only one path matches
# (otherwise [0] would index into the string and return "C").
$candidates = @(@(
  (Get-Command python -ErrorAction SilentlyContinue).Source,
  "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
) | Where-Object { $_ -and (Test-Path $_) -and $_ -notlike '*\WindowsApps\*' })

if ($candidates.Count -gt 0) {
  Write-Host "Serving $root at http://localhost:$Port  (Ctrl+C to stop)"
  & $candidates[0] (Join-Path $PSScriptRoot 'serve.py') --port $Port
  exit $LASTEXITCODE
}

# 2) Fallback: minimal PowerShell static server.
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.mjs' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8'; '.vns' = 'text/plain; charset=utf-8'
  '.txt' = 'text/plain; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.webp' = 'image/webp'
  '.glb' = 'model/gltf-binary'; '.gltf' = 'model/gltf+json'; '.ogg' = 'audio/ogg'; '.mp3' = 'audio/mpeg'; '.wav' = 'audio/wav'
  '.svg' = 'image/svg+xml'; '.woff2' = 'font/woff2'
}
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port  (Ctrl+C to stop)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if (-not $path) { $path = 'index.html' }
    $file = [IO.Path]::GetFullPath((Join-Path $root $path))
    if ($file.StartsWith($root.Path) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [IO.File]::ReadAllBytes($file)
      $type = $mime[[IO.Path]::GetExtension($file).ToLower()]
      $ctx.Response.ContentType = if ($type) { $type } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate')
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop()
}
