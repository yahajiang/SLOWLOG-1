# SlowLog functional smoke test
$ErrorActionPreference = 'Continue'
$base = 'http://localhost:3000'
$script:results = New-Object System.Collections.Generic.List[object]

function Write-Result {
  param($Name, $Status, $Ms, $Len, $Ok, $Note, $Err)
  $tag = if ($Ok) { 'PASS' } else { 'FAIL' }
  $extra = ''
  if ($Note) { $extra = " $Note" }
  if ($Err) { $extra = " $Err" }
  Write-Host ("{0} {1} status={2} {3}ms len={4}{5}" -f $tag, $Name, $Status, $Ms, $Len, $extra)
  $script:results.Add([pscustomobject]@{
    Name = $Name; Status = $Status; Ms = $Ms; Len = $Len; Ok = [bool]$Ok; Note = $Note; Err = $Err
  }) | Out-Null
}

function Test-Route {
  param(
    [string]$Name,
    [string]$Url,
    [string]$Method = 'GET',
    $Body = $null,
    [hashtable]$Headers = @{},
    [int]$Expect = 0
  )
  $sw = [Diagnostics.Stopwatch]::StartNew()
  try {
    $p = @{
      Uri = $Url
      Method = $Method
      UseBasicParsing = $true
      TimeoutSec = 45
      Headers = $Headers
      MaximumRedirection = 5
    }
    if ($null -ne $Body) {
      if ($Body -is [string]) { $p.Body = $Body } else { $p.Body = ($Body | ConvertTo-Json -Compress -Depth 5) }
      $p.ContentType = 'application/json'
    }
    $r = Invoke-WebRequest @p
    $sw.Stop()
    $status = [int]$r.StatusCode
    $len = $r.RawContentLength
    $ok = $true
    $note = ''
    if ($Expect -gt 0) {
      $ok = ($status -eq $Expect)
    } elseif ($status -ge 400) {
      $ok = $false
    }
    if ($Name -eq 'rss' -or $Name -eq 'rss-evil-host') {
      if ($r.Content -match 'evil\.example') { $note += ' HOST-INJECTION'; $ok = $false }
      if ($r.Content -match '<rss') { $note += ' rss-ok' } else { $note += ' no-rss'; $ok = $false }
    }
    if ($Name -eq 'sitemap' -or $Name -eq 'sitemap-evil-host') {
      if ($r.Content -match 'evil\.example') { $note += ' HOST-INJECTION'; $ok = $false }
      if ($r.Content -match '<urlset') { $note += ' urlset-ok' } else { $note += ' no-urlset'; $ok = $false }
    }
    Write-Result $Name $status $sw.ElapsedMilliseconds $len $ok $note ''
  } catch {
    $sw.Stop()
    $code = 'ERR'
    $msg = $_.Exception.Message
    try { if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } } catch {}
    $ok = $false
    if ($Expect -gt 0 -and ([string]$code -eq [string]$Expect)) {
      $ok = $true
      $msg = "redirect/denied as expected ($Expect)"
    }
    Write-Result $Name $code $sw.ElapsedMilliseconds 0 $ok '' $msg
  }
}

Write-Host '=== PUBLIC ==='
Test-Route home "$base/"
Test-Route archive "$base/archive"
Test-Route login "$base/login"
Test-Route m-home "$base/m"
Test-Route m-archive "$base/m/archive"
Test-Route m-login "$base/m/login"
Test-Route rss "$base/rss.xml"
Test-Route sitemap "$base/sitemap.xml"
Test-Route api-posts "$base/api/posts"
Test-Route api-cats "$base/api/categories"
Test-Route api-thoughts "$base/api/thoughts"
Test-Route health "$base/api/health"

Write-Host '=== DASHBOARD GUARDS (no auth) ==='
Test-Route dash-unauth "$base/dashboard" -Expect 307
Test-Route mdash-unauth "$base/m/dashboard" -Expect 307

Write-Host '=== WRITE APIs (no auth) ==='
Test-Route post-write-unauth "$base/api/posts" -Method POST -Body @{title='x';tags=@('a');categoryId='c'} -Expect 401
Test-Route media-write-unauth "$base/api/media" -Method POST -Expect 401
Test-Route settings-write-unauth "$base/api/settings" -Method PUT -Body @{siteName='x'} -Expect 401

Write-Host '=== HOST HEADER INJECTION ==='
Test-Route rss-evil-host "$base/rss.xml" -Headers @{ 'X-Forwarded-Host' = 'evil.example' }
Test-Route sitemap-evil-host "$base/sitemap.xml" -Headers @{ 'X-Forwarded-Host' = 'evil.example' }

Write-Host ''
Write-Host '=== SUMMARY ==='
$pass = @($script:results | Where-Object { $_.Ok }).Count
$fail = @($script:results | Where-Object { -not $_.Ok }).Count
Write-Host "PASS=$pass FAIL=$fail TOTAL=$($script:results.Count)"
$script:results | Format-Table Name, Status, Ms, Len, Ok, Note, Err -AutoSize | Out-String | Write-Host
if ($fail -gt 0) { exit 1 } else { exit 0 }
