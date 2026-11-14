# Sorts every RAD reading from highest to lowest dose and pairs it with the REMS temperature and pressure recorded
# closest in time. Time is "sol + local hour / 24", so a reading just after midnight can match a sample from the
# previous sol. Temperature uses the closest *valid* reading (>= 170 K); pressure uses the closest reading.
param([string]$DataDir = (Join-Path $PSScriptRoot "..\data"), [double]$MaxGapMin = 60)
$ErrorActionPreference = 'Stop'
$inv = [Globalization.CultureInfo]::InvariantCulture
function Hrs([string]$hms) { $p = $hms.Split(':'); [double]$p[0] + [double]$p[1] / 60 + [double]::Parse($p[2], $inv) / 3600 }

$group = @{}; Import-Csv (Join-Path $PSScriptRoot "..\pds_file_manifest.csv") | ForEach-Object { $group[[int]$_.sol] = $_.group }
$flag = @{}; Import-Csv (Join-Path $DataDir "sol_summary.csv") | ForEach-Object { if ($_.flag) { $flag[[int]$_.sol] = $_.flag } }

# REMS samples on one time axis (in sols), kept per sol for fast lookup
$bySol = @{}
foreach ($r in (Import-Csv (Join-Path $DataDir "rems_samples.csv"))) {
  if ($r.lmst -notmatch '^(\d{5})M(\d\d:\d\d:\d\d(\.\d+)?)') { continue }
  $s = [int]$matches[1]; $h = Hrs $matches[2]
  $t = if ($r.air_T_boom2_K) { [double]$r.air_T_boom2_K } elseif ($r.air_T_boom1_K) { [double]$r.air_T_boom1_K } else { $null }
  if ($null -ne $t -and $t -lt 170) { $t = $null } # physically impossible at Gale: bad sensor reading
  if (-not $bySol[$s]) { $bySol[$s] = New-Object System.Collections.Generic.List[object] }
  $bySol[$s].Add([pscustomobject]@{ x = $s + $h / 24; h = $h; p = [double]$r.pressure_Pa; t = $t })
}

$out = foreach ($o in (Import-Csv (Join-Path $DataDir "rad_obs.csv"))) {
  $b = [double]$o.dose_B_uGy_h; $e = [double]$o.dose_E_uGy_h
  if ($b -le 0 -or $e -le 0) { continue }
  $s = [int]$o.obs_sol; $h = Hrs $o.lmst
  if ([int]$o.obs -eq 0 -and $h -gt 20) { $s-- } # first reading of a file can start late on the previous sol
  $x = $s + $h / 24
  $bestP = $null; $dP = 1e9; $bestT = $null; $dT = 1e9
  foreach ($k in ($s - 1), $s, ($s + 1)) {
    if (-not $bySol[$k]) { continue }
    foreach ($c in $bySol[$k]) {
      $d = [Math]::Abs($c.x - $x)
      if ($d -lt $dP) { $dP = $d; $bestP = $c }
      if ($null -ne $c.t -and $d -lt $dT) { $dT = $d; $bestT = $c }
    }
  }
  $gapP = $dP * 24 * 60; $gapT = $dT * 24 * 60
  [pscustomobject]@{
    dose_E_uGy_h = $e; dose_B_uGy_h = $b; sol = $s; group = $group[[int]$o.sol]; rad_lmst = $o.lmst; utc = $o.utc
    air_temp_C = if ($bestT -and $gapT -le $MaxGapMin) { [Math]::Round($bestT.t - 273.15, 1) } else { $null }
    temp_gap_min = if ($bestT) { [Math]::Round($gapT, 1) } else { $null }
    pressure_Pa = if ($bestP -and $gapP -le $MaxGapMin) { $bestP.p } else { $null }
    pressure_gap_min = if ($bestP) { [Math]::Round($gapP, 1) } else { $null }
    sol_flag = $flag[[int]$o.sol]
  }
}
# Readings far from their sol's median are suspect (very short or partial observations): flag, don't drop.
$med = @{}; foreach ($g in ($out | Group-Object sol)) { $v = @($g.Group.dose_E_uGy_h | Sort-Object); $med[$g.Name] = $v[[int]($v.Count / 2)] }
foreach ($r in $out) { $q = $r.dose_E_uGy_h / $med["$($r.sol)"]; $r | Add-Member -NotePropertyName reading_flag -NotePropertyValue $(if ($q -lt 0.5 -or $q -gt 2) { 'suspect' } else { '' }) }
$sorted = $out | Sort-Object dose_E_uGy_h -Descending
$i = 0; $sorted = foreach ($r in $sorted) { $i++; $r | Add-Member -NotePropertyName rank -NotePropertyValue $i -PassThru }
$sorted | Select-Object rank, dose_E_uGy_h, dose_B_uGy_h, sol, group, rad_lmst, utc, air_temp_C, temp_gap_min, pressure_Pa, pressure_gap_min, sol_flag, reading_flag |
  Export-Csv (Join-Path $PSScriptRoot "..\radiation_sorted_nearest_conditions.csv") -NoTypeInformation -Encoding UTF8

# Self-check: sorted order and gaps within limit
$prev = [double]::MaxValue; foreach ($r in $sorted) { if ($r.dose_E_uGy_h -gt $prev) { throw "sort check failed at rank $($r.rank)" }; $prev = $r.dose_E_uGy_h }
"rows: $($sorted.Count); with temperature: $(@($sorted | Where-Object { $null -ne $_.air_temp_C }).Count); with pressure: $(@($sorted | Where-Object { $null -ne $_.pressure_Pa }).Count)"
"median gap: temperature $((($sorted | Where-Object { $null -ne $_.air_temp_C } | Sort-Object temp_gap_min)[[int](@($sorted | Where-Object { $null -ne $_.air_temp_C }).Count/2)]).temp_gap_min) min, pressure $((($sorted | Where-Object { $null -ne $_.pressure_Pa } | Sort-Object pressure_gap_min)[[int](@($sorted | Where-Object { $null -ne $_.pressure_Pa }).Count/2)]).pressure_gap_min) min"
