# Pulls only the needed bytes from PDS for each sol in research/pds_file_manifest.csv:
#   RAD  : the time and total dose (detectors B and E, µGy/h) of every observation, via byte ranges taken from the .LBL
#   REMS : one RNV row every $Stride rows (time, pressure, air temperature), via byte ranges on the fixed-length table
# Appends to research/data/rad_obs.csv and research/data/rems_samples.csv. Already-done sols are skipped.
param(
  [string]$Manifest = (Join-Path $PSScriptRoot "..\pds_file_manifest.csv"),
  [string]$OutDir = (Join-Path $PSScriptRoot "..\data"),
  [string]$LblDir = (Join-Path $PSScriptRoot "..\pds_raw\rad_lbl"),
  [int]$Stride = 120,
  [string]$Groups = "sols_400_440,low_pressure,high_pressure"
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
New-Item -ItemType Directory -Force $OutDir, $LblDir | Out-Null
$radCsv = Join-Path $OutDir "rad_obs.csv"
$remsCsv = Join-Path $OutDir "rems_samples.csv"
$latin = [Text.Encoding]::GetEncoding(28591)
$inv = [Globalization.CultureInfo]::InvariantCulture

function Get-Ranges([string]$url, [long[][]]$ranges) {
  # Requests many byte ranges in one go (in batches so the header stays short). Returns the raw text of all parts.
  $sb = New-Object Text.StringBuilder
  for ($k = 0; $k -lt $ranges.Count; $k += 150) {
    $batch = $ranges[$k..([Math]::Min($k + 149, $ranges.Count - 1))]
    for ($try = 1; $try -le 3; $try++) {
      try {
        $req = [Net.HttpWebRequest]::Create($url); $req.Timeout = 180000; $req.ReadWriteTimeout = 180000
        foreach ($r in $batch) { $req.AddRange([long]$r[0], [long]$r[1]) }
        $resp = $req.GetResponse()
        $ms = New-Object IO.MemoryStream; $resp.GetResponseStream().CopyTo($ms); $resp.Close()
        [void]$sb.Append($latin.GetString($ms.ToArray())); break
      } catch { if ($try -eq 3) { throw }; Start-Sleep -Seconds (5 * $try) }
    }
  }
  return $sb.ToString()
}
function Get-Text([string]$url) {
  for ($try = 1; $try -le 3; $try++) {
    try { return (Invoke-WebRequest -UseBasicParsing $url -TimeoutSec 300).Content } catch { if ($try -eq 3) { throw }; Start-Sleep -Seconds (5 * $try) }
  }
}

$doneRad = @{}; if (Test-Path $radCsv) { Import-Csv $radCsv | ForEach-Object { $doneRad[[int]$_.sol] = 1 } }
$doneRems = @{}; if (Test-Path $remsCsv) { Import-Csv $remsCsv | ForEach-Object { $doneRems[[int]$_.sol] = 1 } }
$want = $Groups -split ','
$rows = Import-Csv $Manifest | Where-Object { $want -contains $_.group }

foreach ($m in $rows) {
  $sol = [int]$m.sol
  # ---------- RAD ----------
  if ($m.rad_lbl -and -not $doneRad.ContainsKey($sol)) {
    try {
      $lblPath = Join-Path $LblDir ("sol{0:D4}.LBL" -f $sol)
      if (-not (Test-Path $lblPath)) { Invoke-WebRequest -UseBasicParsing $m.rad_lbl -OutFile $lblPath -TimeoutSec 300 }
      $l = [IO.File]::ReadAllText($lblPath)
      $ptr = { param($what) $h = @{}; foreach ($x in [regex]::Matches($l, "\^OBS(\d+)_$what\s*=\s*\(`"[^`"]+`",\s*(\d+)")) { $h[[int]$x.Groups[1].Value] = [long]$x.Groups[2].Value }; $h }
      $l1 = & $ptr 'L1_TABLE'; $db = & $ptr 'TOT_DOSE_B_ELEMENT'; $de = & $ptr 'TOT_DOSE_E_ELEMENT'
      $ranges = @()
      foreach ($o in ($db.Keys | Sort-Object)) {
        if ($l1.ContainsKey($o)) { $ranges += , @([Math]::Max(0, $l1[$o] - 700), ($l1[$o] - 2)) }
        $ranges += , @([Math]::Max(0, $db[$o] - 80), ($de[$o] + 30))
      }
      $txt = Get-Ranges $m.rad_txt $ranges
      $out = foreach ($blk in ([regex]::Split($txt, '\[OBSERVATION: ') | Select-Object -Skip 1)) {
        $n = [int]$blk.Substring(0, 2)
        $t = [regex]::Match($blk, 'START_OBS_MARS="(\d+) (\d\d:\d\d:\d\d)"'); $u = [regex]::Match($blk, 'START_OBS_UTC="([^"]+)"')
        $b = [regex]::Match($blk, '\[DOSIMETRY_TOTAL_DOSE_B: \d+\]\s+([\-\d.]+)'); $e = [regex]::Match($blk, '\[DOSIMETRY_TOTAL_DOSE_E: \d+\]\s+([\-\d.]+)')
        if ($b.Success) { [pscustomobject]@{ sol = $sol; obs = $n; obs_sol = [int]$t.Groups[1].Value; lmst = $t.Groups[2].Value; utc = $u.Groups[1].Value; dose_B_uGy_h = $b.Groups[1].Value; dose_E_uGy_h = $e.Groups[1].Value } }
      }
      $out | Export-Csv $radCsv -NoTypeInformation -Append -Encoding UTF8
      "RAD  sol $sol : $(@($out).Count) observations"
    } catch { "RAD  sol $sol FAILED: $($_.Exception.Message)" }
  }
  # ---------- REMS ----------
  if ($m.rems_folder -and $m.rems_folder -ne 'missing' -and -not $doneRems.ContainsKey($sol)) {
    try {
      $list = Get-Text $m.rems_folder
      $f = [regex]::Match($list, 'href="(RME_\w+RNV\w+\.TAB)"')
      if (-not $f.Success) { throw "no RNV table in $($m.rems_folder)" }
      $url = $m.rems_folder + $f.Groups[1].Value
      $req = [Net.HttpWebRequest]::Create($url); $req.AddRange(0, 0); $resp = $req.GetResponse(); $total = [long]($resp.Headers['Content-Range'] -split '/')[1]; $resp.Close()
      $nrows = [long][Math]::Floor($total / 659)
      $ranges = for ($i = 0; $i -lt $nrows; $i += $Stride) { , @(($i * 659), ($i * 659 + 658)) }
      $txt = Get-Ranges $url $ranges
      $out = foreach ($line in ($txt -split "`n")) {
        if ($line.Length -lt 655 -or $line -notmatch '^\s*\d{9,10},"') { continue }
        $num = { param($loc, $len) $s = $line.Substring($loc - 1, $len).Trim(); $v = 0.0; if ([double]::TryParse($s, [Globalization.NumberStyles]::Float, $inv, [ref]$v) -and $v -gt -900) { $v } else { $null } }
        $p1 = & $num 616 7; $p2 = & $num 624 7
        $p = if ($null -ne $p1) { $p1 } else { $p2 }
        if ($null -eq $p) { continue }
        [pscustomobject]@{ sol = $sol; lmst = $line.Substring(12, 18).Trim('"').Trim(); ltst = $line.Substring(33, 14).Trim('"').Trim(); pressure_Pa = $p
          air_T_boom2_K = & $num 350 7; air_T_boom1_K = & $num 287 7; ground_T_K = & $num 204 7 }
      }
      $out | Export-Csv $remsCsv -NoTypeInformation -Append -Encoding UTF8
      "REMS sol $sol : $(@($out).Count) samples from $nrows rows"
    } catch { "REMS sol $sol FAILED: $($_.Exception.Message)" }
  }
}
"done"
