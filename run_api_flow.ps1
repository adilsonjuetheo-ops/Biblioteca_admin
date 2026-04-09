$base='http://192.168.1.3:3000'
$canSkip=(Get-Command Invoke-WebRequest).Parameters.ContainsKey('SkipHttpErrorCheck')
function CallApi {
  param([string]$Method,[string]$Path,$Body=$null)
  $p=@{Uri="$base$Path";Method=$Method;Headers=@{'Content-Type'='application/json'}}
  if($canSkip){$p.SkipHttpErrorCheck=$true}
  if($null -ne $Body){$p.Body=($Body|ConvertTo-Json -Depth 10)}
  try{
    $r=Invoke-WebRequest @p
    [pscustomobject]@{status=[int]$r.StatusCode;ok=([int]$r.StatusCode -ge 200 -and [int]$r.StatusCode -lt 300);body=[string]$r.Content}
  }catch{
    [pscustomobject]@{status=$null;ok=$false;body=$null;error=$_.Exception.Message}
  }
}

$out=[ordered]@{}
$r1=CallApi GET '/livros'
$livros=@(); if($r1.body){try{$livros=@($r1.body|ConvertFrom-Json)}catch{}}
$ids=@($livros|ForEach-Object{$_.id})
$out.step1=[ordered]@{status=$r1.status;total=$ids.Count;ids=$ids}

$r2=CallApi DELETE '/livros/999999'
$out.step2=[ordered]@{status=$r2.status;ok=$r2.ok;body=$r2.body}

$deleteSupported=$false
$probe=$null
$currentIds=$ids
if($ids.Count -gt 0){
  $probeId=$ids[0]
  $probe=CallApi DELETE ("/livros/$probeId")
  $chk=CallApi GET '/livros'
  $livrosAfterProbe=@(); if($chk.body){try{$livrosAfterProbe=@($chk.body|ConvertFrom-Json)}catch{}}
  $idsAfterProbe=@($livrosAfterProbe|ForEach-Object{$_.id})
  if($idsAfterProbe -notcontains $probeId){$deleteSupported=$true}
  $currentIds=$idsAfterProbe
}

if($deleteSupported){
  $delLogs=@()
  foreach($id in $currentIds){
    $d=CallApi DELETE ("/livros/$id")
    $delLogs+=[pscustomobject]@{id=$id;status=$d.status;ok=$d.ok;body=($(if($d.ok){$null}else{$d.body}))}
  }
  $chk2=CallApi GET '/livros'
  $livrosAfterAll=@(); if($chk2.body){try{$livrosAfterAll=@($chk2.body|ConvertFrom-Json)}catch{}}
  $out.step3=[ordered]@{delete_supported=$true;probe=[ordered]@{status=$probe.status;ok=$probe.ok;body=($(if($probe.ok){$null}else{$probe.body}))};deletes=$delLogs;final_total=@($livrosAfterAll).Count;status_get=$chk2.status}
}else{
  $out.step3=[ordered]@{delete_supported=$false;probe=($(if($probe){[ordered]@{status=$probe.status;ok=$probe.ok;body=$probe.body}}else{$null}));acao='nao executado'}
}

$postLogs=@()
for($i=1;$i -le 10;$i++){
  $payload=[ordered]@{titulo="Livro Teste $i";autor="Autor $i";isbn="9780000000$('{0:D3}' -f $i)";genero='Ficcao';sinopse="Sinopse de teste $i";capa="https://example.com/capa$i.jpg";totalExemplares=5;disponiveis=5}
  $p=CallApi POST '/livros' $payload
  $postLogs+=[pscustomobject]@{i=$i;status=$p.status;ok=$p.ok;body=($(if($p.ok){$null}else{$p.body}))}
}
$out.step4=[ordered]@{success=@($postLogs|Where-Object{$_.ok}).Count;fail=@($postLogs|Where-Object{-not $_.ok}).Count;results=$postLogs}

$r5=CallApi GET '/livros'
$livros5=@(); if($r5.body){try{$livros5=@($r5.body|ConvertFrom-Json)}catch{}}
$out.step5=[ordered]@{status=$r5.status;total=@($livros5).Count;ids=@($livros5|ForEach-Object{$_.id})}

$r6=CallApi GET '/emprestimos'
$emp=@(); if($r6.body){try{$emp=@($r6.body|ConvertFrom-Json)}catch{}}
$out.step6=[ordered]@{status=$r6.status;total=@($emp).Count;body=($(if($r6.ok){$null}else{$r6.body}))}

$out|ConvertTo-Json -Depth 8
