$base='http://192.168.1.3:3000'
$canSkip = (Get-Command Invoke-WebRequest).Parameters.ContainsKey('SkipHttpErrorCheck')
function Invoke-Api {
  param([string]$Method,[string]$Path,$Body=$null)
  $uri = "$base$Path"
  $headers = @{ 'Content-Type'='application/json' }
  try {
    $params = @{ Uri=$uri; Method=$Method; Headers=$headers }
    if ($canSkip) { $params['SkipHttpErrorCheck'] = $true }
    if ($null -ne $Body) { $params['Body'] = ($Body | ConvertTo-Json -Depth 10) }
    $resp = Invoke-WebRequest @params
    [pscustomobject]@{ ok=($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300); status=[int]$resp.StatusCode; body=[string]$resp.Content; error=$null }
  } catch {
    $status = $null
    $errBody = $null
    $err = $_.Exception.Message
    if ($_.Exception.Response) {
      try { $status = [int]$_.Exception.Response.StatusCode.value__ } catch {}
      try { $errBody = $_.Exception.Response.Content.ReadAsStringAsync().Result } catch {}
    }
    [pscustomobject]@{ ok=$false; status=$status; body=$errBody; error=$err }
  }
}

$results = @()
$r1 = Invoke-Api -Method 'GET' -Path '/livros'
$livros = @(); if ($r1.body) { try { $livros = @($r1.body | ConvertFrom-Json) } catch {} }
$idsIniciais = @($livros | ForEach-Object { $_.id })
$results += [pscustomobject]@{step='1_GET_livros_inicial'; status=$r1.status; total=$idsIniciais.Count; ids=$idsIniciais; body=$r1.body; error=$r1.error }

$r2 = Invoke-Api -Method 'DELETE' -Path '/livros/999999'
$results += [pscustomobject]@{step='2_DELETE_teste_999999'; status=$r2.status; ok=$r2.ok; body=$r2.body; error=$r2.error }

$deleteExists = $false
if ($r2.status -in @(200,204,400,404,422)) { $deleteExists = $true }
if ($deleteExists -and $idsIniciais.Count -gt 0) {
  $deleteLogs = @()
  foreach ($id in $idsIniciais) {
    $rd = Invoke-Api -Method 'DELETE' -Path "/livros/$id"
    $deleteLogs += [pscustomobject]@{id=$id; status=$rd.status; ok=$rd.ok; body=$rd.body; error=$rd.error}
  }
  $r3check = Invoke-Api -Method 'GET' -Path '/livros'
  $livrosPosDelete = @(); if ($r3check.body) { try { $livrosPosDelete = @($r3check.body | ConvertFrom-Json) } catch {} }
  $results += [pscustomobject]@{step='3_DELETE_todos'; status='executado'; deletes=$deleteLogs; total_pos_delete=$livrosPosDelete.Count; body_get=$r3check.body; status_get=$r3check.status; error_get=$r3check.error }
} else {
  $results += [pscustomobject]@{step='3_DELETE_todos'; status='nao_executado'; motivo='DELETE endpoint ausente/inconclusivo ou sem IDs iniciais' }
}

$postLogs = @()
for ($i=1; $i -le 10; $i++) {
  $payload = [ordered]@{
    titulo = "Livro Teste $i"; autor = "Autor $i"; isbn = "9780000000$('{0:D3}' -f $i)"; genero = 'Ficcao'; sinopse = "Sinopse de teste $i"; capa = "https://example.com/capa$i.jpg"; totalExemplares = 5; disponiveis = 5
  }
  $rp = Invoke-Api -Method 'POST' -Path '/livros' -Body $payload
  $postLogs += [pscustomobject]@{indice=$i; status=$rp.status; ok=$rp.ok; body=$rp.body; error=$rp.error}
}
$results += [pscustomobject]@{step='4_POST_10_livros'; posts=$postLogs }

$r5 = Invoke-Api -Method 'GET' -Path '/livros'
$livrosFinal = @(); if ($r5.body) { try { $livrosFinal = @($r5.body | ConvertFrom-Json) } catch {} }
$idsFinais = @($livrosFinal | ForEach-Object { $_.id })
$results += [pscustomobject]@{step='5_GET_livros_final'; status=$r5.status; total=$livrosFinal.Count; ids=$idsFinais; body=$r5.body; error=$r5.error }

$r6 = Invoke-Api -Method 'GET' -Path '/emprestimos'
$emprestimos = @(); if ($r6.body) { try { $emprestimos = @($r6.body | ConvertFrom-Json) } catch {} }
$results += [pscustomobject]@{step='6_GET_emprestimos'; status=$r6.status; total=$emprestimos.Count; body=$r6.body; error=$r6.error }

$results | ConvertTo-Json -Depth 10
