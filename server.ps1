$http = New-Object System.Net.HttpListener
$http.Prefixes.Add("http://localhost:8080/")
$http.Start()
Write-Host "Server running at http://localhost:8080/"

while ($http.IsListening) {
    try {
        $context = $http.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $relPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($relPath)) { $relPath = "index.html" }
        
        $filePath = Join-Path $PSScriptRoot $relPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            if ($filePath.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($filePath.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($filePath.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.OutputStream.Close()
    } catch {
        # ignore context errors during teardown
    }
}
