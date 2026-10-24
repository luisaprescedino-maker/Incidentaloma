# Servidor de teste simples: mostra o app em http://localhost:8081
# Para parar, feche a janela preta.
param([int]$Porta = 8081, [switch]$SemNavegador)

$pasta = Split-Path -Parent $PSScriptRoot
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'; '.webmanifest' = 'application/manifest+json'
  '.png' = 'image/png'; '.svg' = 'image/svg+xml'; '.json' = 'application/json; charset=utf-8'
}

$servidor = New-Object System.Net.HttpListener
$servidor.Prefixes.Add("http://localhost:$Porta/")
$servidor.Start()
Write-Host ""
Write-Host "  Incidentaloma esta rodando em http://localhost:$Porta" -ForegroundColor Green
Write-Host "  Para parar, feche esta janela."
Write-Host ""
if (-not $SemNavegador) { Start-Process "http://localhost:$Porta" }

while ($servidor.IsListening) {
  $ctx = $servidor.GetContext()
  $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  if ($caminho -eq '') { $caminho = 'index.html' }
  $arquivo = Join-Path $pasta $caminho
  $resp = $ctx.Response
  $resp.Headers.Add('Cache-Control', 'no-cache')
  if ((Test-Path $arquivo -PathType Leaf) -and ((Resolve-Path $arquivo).Path.StartsWith($pasta))) {
    $bytes = [IO.File]::ReadAllBytes($arquivo)
    $ext = [IO.Path]::GetExtension($arquivo).ToLower()
    $resp.ContentType = if ($tipos[$ext]) { $tipos[$ext] } else { 'application/octet-stream' }
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $resp.StatusCode = 404
  }
  $resp.Close()
}
