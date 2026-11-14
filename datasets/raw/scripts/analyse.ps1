# Dose vs pressure (and temperature) from research/data/rad_obs.csv + rems_samples.csv.
# Writes research/data/sol_summary.csv and research/data/obs_matched.csv and prints the fits.
param([string]$DataDir = (Join-Path $PSScriptRoot "..\data"))
$ErrorActionPreference = 'Stop'
$inv = [Globalization.CultureInfo]::InvariantCulture
$D2R = [Math]::PI / 180
$SOL_DAYS = 1.0274912
$LANDING = [datetime]'2012-08-06T05:17:00'
function SolarLon([datetime]$dt) {
  $jd = ($dt - [datetime]'1970-01-01').TotalDays + 2440587.5; $d = $jd + 69.184 / 86400 - 2451545
  $M = 19.3871 + 0.52402073 * $d; $a = 270.3871 + 0.524038496 * $d
  $e = (10.691 + 3e-7 * $d) * [Math]::Sin($M * $D2R) + 0.623 * [Math]::Sin(2 * $M * $D2R) + 0.05 * [Math]::Sin(3 * $M * $D2R) + 0.005 * [Math]::Sin(4 * $M * $D2R)
  (($a + $e) % 360 + 360) % 360
}
function Hrs([string]$hms) { $p = $hms.Split(':'); [double]$p[0] + [double]$p[1] / 60 + [double]::Parse($p[2], $inv) / 3600 }
function Median($xs) { $s = @($xs | Sort-Object); if ($s.Count -eq 0) { return $null }; $n = $s.Count; if ($n % 2) { $s[($n - 1) / 2] } else { ($s[$n / 2 - 1] + $s[$n / 2]) / 2 } }
function Fit1($x, $y) { # least squares y = a + b x ; returns b, its standard error, r
  $n = $x.Count; $mx = ($x | Measure-Object -Average).Average; $my = ($y | Measure-Object -Average).Average
  $sxx = 0; $sxy = 0; $syy = 0; for ($i = 0; $i -lt $n; $i++) { $dx = $x[$i] - $mx; $dy = $y[$i] - $my; $sxx += $dx * $dx; $sxy += $dx * $dy; $syy += $dy * $dy }
  $b = $sxy / $sxx; $res = 0; for ($i = 0; $i -lt $n; $i++) { $r = $y[$i] - ($my + $b * ($x[$i] - $mx)); $res += $r * $r }
  [pscustomobject]@{ slope = $b; se = [Math]::Sqrt($res / ($n - 2) / $sxx); r = $sxy / [Math]::Sqrt($sxx * $syy); n = $n }
}
function Fit2($x1, $x2, $y) { # y = a + b1 x1 + b2 x2 on centred data; returns b1, b2 and standard errors
  $n = $y.Count; $m1 = ($x1 | Measure-Object -Average).Average; $m2 = ($x2 | Measure-Object -Average).Average; $my = ($y | Measure-Object -Average).Average
  $s11 = 0; $s22 = 0; $s12 = 0; $s1y = 0; $s2y = 0
  for ($i = 0; $i -lt $n; $i++) { $a = $x1[$i] - $m1; $b = $x2[$i] - $m2; $c = $y[$i] - $my; $s11 += $a * $a; $s22 += $b * $b; $s12 += $a * $b; $s1y += $a * $c; $s2y += $b * $c }
  $det = $s11 * $s22 - $s12 * $s12; $b1 = ($s22 * $s1y - $s12 * $s2y) / $det; $b2 = ($s11 * $s2y - $s12 * $s1y) / $det
  $res = 0; for ($i = 0; $i -lt $n; $i++) { $r = ($y[$i] - $my) - $b1 * ($x1[$i] - $m1) - $b2 * ($x2[$i] - $m2); $res += $r * $r }
  $s2 = $res / ($n - 3)
  [pscustomobject]@{ b1 = $b1; se1 = [Math]::Sqrt($s2 * $s22 / $det); b2 = $b2; se2 = [Math]::Sqrt($s2 * $s11 / $det); corr12 = $s12 / [Math]::Sqrt($s11 * $s22); n = $n }
}

$rad = Import-Csv (Join-Path $DataDir "rad_obs.csv") | Where-Object { [double]$_.dose_B_uGy_h -gt 0 -and [double]$_.dose_E_uGy_h -gt 0 }
$rems = Import-Csv (Join-Path $DataDir "rems_samples.csv")
$groupOf = @{}; Import-Csv (Join-Path $PSScriptRoot "..\pds_file_manifest.csv") | ForEach-Object { $groupOf[[int]$_.sol] = $_.group }

# REMS samples indexed by sol, with LMST in hours
$remsBySol = @{}
foreach ($r in $rems) {
  if ($r.lmst -notmatch '^(\d{5})M(\d\d:\d\d:\d\d(\.\d+)?)') { continue }
  $s = [int]$matches[1]; if (-not $remsBySol[$s]) { $remsBySol[$s] = New-Object System.Collections.Generic.List[object] }
  $t = if ($r.air_T_boom2_K) { [double]$r.air_T_boom2_K } elseif ($r.air_T_boom1_K) { [double]$r.air_T_boom1_K } else { $null }
  $remsBySol[$s].Add([pscustomobject]@{ h = (Hrs $matches[2]); p = [double]$r.pressure_Pa; t = $t })
}

# Match each RAD observation to the nearest REMS sample (same sol, within 40 minutes)
$matched = foreach ($o in $rad) {
  $s = [int]$o.obs_sol; $h = Hrs $o.lmst
  if ([int]$o.obs -eq 0 -and $h -gt 20) { $s-- } # a file's first observation can start late on the previous sol but carry the new sol number
  $cand = $remsBySol[$s]; if (-not $cand) { continue }
  $best = $null; $bd = 99; foreach ($c in $cand) { $d = [Math]::Abs($c.h - $h); if ($d -lt $bd) { $bd = $d; $best = $c } }
  if ($bd -gt 0.67) { continue }
  [pscustomobject]@{ sol = $s; group = $groupOf[[int]$o.sol]; lmst_h = [Math]::Round($h, 3); dose_B = [double]$o.dose_B_uGy_h; dose_E = [double]$o.dose_E_uGy_h; pressure_Pa = $best.p; air_T_K = $best.t; gap_min = [Math]::Round($bd * 60, 1) }
}
$matched | Export-Csv (Join-Path $DataDir "obs_matched.csv") -NoTypeInformation -Encoding UTF8

# Per-sol summary
$summary = foreach ($g in ($rad | Group-Object { [int]$_.sol })) {
  $s = [int]$g.Name; $p = $remsBySol[$s]
  $ls = SolarLon ($LANDING.AddDays($s * $SOL_DAYS + 0.5))
  $temps = if ($p) { @($p | Where-Object { $null -ne $_.t } | ForEach-Object { $_.t - 273.15 }) } else { @() }
  [pscustomobject]@{
    sol = $s; group = $groupOf[$s]; ls_deg = [Math]::Round($ls, 1); n_obs = $g.Count
    dose_B_uGy_day = [Math]::Round((Median ($g.Group | ForEach-Object { [double]$_.dose_B_uGy_h })) * 24.66, 1)
    dose_E_uGy_day = [Math]::Round((Median ($g.Group | ForEach-Object { [double]$_.dose_E_uGy_h })) * 24.66, 1)
    pressure_Pa = if ($p) { [Math]::Round(($p | Measure-Object p -Average).Average, 1) } else { $null }
    air_mean_C = if ($temps.Count) { [Math]::Round(($temps | Measure-Object -Average).Average, 1) } else { $null }
    air_min_C = if ($temps.Count) { [Math]::Round(($temps | Measure-Object -Minimum).Minimum, 1) } else { $null }
    air_max_C = if ($temps.Count) { [Math]::Round(($temps | Measure-Object -Maximum).Maximum, 1) } else { $null }
    flag = ''
  }
}
# Flag storm-like days: daily dose more than 4 robust sigmas from the median of its group
foreach ($grp in ($summary | Group-Object group)) {
  $v = @($grp.Group | ForEach-Object { $_.dose_E_uGy_day }); $med = Median $v; $mad = Median ($v | ForEach-Object { [Math]::Abs($_ - $med) })
  foreach ($r in $grp.Group) { if ($mad -gt 0 -and [Math]::Abs($r.dose_E_uGy_day - $med) / (1.4826 * $mad) -gt 4) { $r.flag = $(if ($r.dose_E_uGy_day -gt $med) { 'spike' } else { 'drop' }) } }
}
$summary = $summary | Sort-Object sol
$summary | Export-Csv (Join-Path $DataDir "sol_summary.csv") -NoTypeInformation -Encoding UTF8

"=== Per-group daily averages (unflagged sols) ==="
foreach ($grp in ($summary | Where-Object { -not $_.flag -and $null -ne $_.pressure_Pa } | Group-Object group)) {
  "{0,-14} sols={1,3}  Ls {2,5:N0}-{3,5:N0}  pressure {4,6:N1} Pa  dose(E) {5,6:N1} uGy/day  dose(B) {6,6:N1}  air {7,6:N1} C" -f $grp.Name, $grp.Count,
    ($grp.Group | Measure-Object ls_deg -Minimum).Minimum, ($grp.Group | Measure-Object ls_deg -Maximum).Maximum,
    ($grp.Group | Measure-Object pressure_Pa -Average).Average, ($grp.Group | Measure-Object dose_E_uGy_day -Average).Average,
    ($grp.Group | Measure-Object dose_B_uGy_day -Average).Average, ($grp.Group | Measure-Object air_mean_C -Average).Average
}
"Flagged sols: " + (($summary | Where-Object flag | ForEach-Object { "$($_.sol)($($_.flag))" }) -join ', ')

"`n=== Within-sol (diurnal) fit, per group: dose anomaly vs pressure anomaly [and temperature anomaly] ==="
$okSols = @{}; $summary | Where-Object { -not $_.flag } | ForEach-Object { $okSols[$_.sol] = $_ }
foreach ($gname in 'sols_400_440', 'low_pressure', 'high_pressure', 'low_pressure_y2', 'ALL') {
  $rows = @($matched | Where-Object { $okSols.ContainsKey($_.sol) -and ($gname -eq 'ALL' -or $_.group -eq $gname) -and $null -ne $_.air_T_K -and $_.air_T_K -ge 170 }) # below 170 K (-103 C) is a bad ATS reading at Gale
  if ($rows.Count -lt 30) { "$gname : not enough matched observations ($($rows.Count))"; continue }
  foreach ($det in 'dose_B', 'dose_E') {
    $x = @(); $t = @(); $y = @(); $meanDose = @()
    foreach ($sg in ($rows | Group-Object sol)) {
      $md = ($sg.Group | Measure-Object $det -Average).Average; $mp = ($sg.Group | Measure-Object pressure_Pa -Average).Average; $mt = ($sg.Group | Measure-Object air_T_K -Average).Average
      foreach ($r in $sg.Group) { $x += $r.pressure_Pa - $mp; $t += $r.air_T_K - $mt; $y += $r.$det / $md - 1; $meanDose += $md }
    }
    $f1 = Fit1 $x $y; $f2 = Fit2 $x $t $y; $D = (($meanDose | Measure-Object -Average).Average) * 24.66
    $mu = -$f1.slope * 37.1
    "{0,-13} {1}: n={2}  pressure only: {3:N3} %/Pa (+/- {4:N3}), r={5:N2}  => mu = {6:N4} cm2/g, dD/dP = {7:N3} uGy/day/Pa" -f $gname, $det, $f1.n, ($f1.slope * 100), ($f1.se * 100), $f1.r, $mu, ($f1.slope * $D)
    "{0,-13} {1}:          pressure + temperature: P {2:N3} %/Pa (+/- {3:N3}); T {4:N3} %/K (+/- {5:N3}); corr(P,T) = {6:N2}" -f '', $det, ($f2.b1 * 100), ($f2.se1 * 100), ($f2.b2 * 100), ($f2.se2 * 100), $f2.corr12
  }
}

"`n=== Between sols (daily means, unflagged): dose vs pressure, all groups together ==="
$ok = @($summary | Where-Object { -not $_.flag -and $null -ne $_.pressure_Pa })
$f = Fit1 @($ok | ForEach-Object { [double]$_.pressure_Pa }) @($ok | ForEach-Object { [double]$_.dose_E_uGy_day })
"dose(E) vs pressure: {0:N3} uGy/day per Pa (+/- {1:N3}), r = {2:N2}, n = {3}  [mixes in solar-cycle changes between groups]" -f $f.slope, $f.se, $f.r, $f.n

"`n=== Same season, one Mars year apart: sols 0-30 vs 669-700 (solar drift) ==="
# shortcut: assumes the solar effect on dose drifts linearly (in log) with time between the two windows; a real correction needs neutron-monitor or modulation-potential data.
$gm = @{}; foreach ($grp in ($ok | Group-Object group)) {
  $gm[$grp.Name] = [pscustomobject]@{ sol = ($grp.Group | Measure-Object sol -Average).Average; p = ($grp.Group | Measure-Object pressure_Pa -Average).Average
    E = ($grp.Group | Measure-Object dose_E_uGy_day -Average).Average; B = ($grp.Group | Measure-Object dose_B_uGy_day -Average).Average; n = $grp.Count }
}
$y1 = $gm['low_pressure']; $y2 = $gm['low_pressure_y2']
if ($y1 -and $y2) {
  foreach ($det in 'E', 'B') {
    $rate = [Math]::Log($y2.$det / $y1.$det) / ($y2.sol - $y1.sol)
    "{0}: year 1 {1:N1} uGy/day at {2:N0} Pa; year 2 {3:N1} uGy/day at {4:N0} Pa => drift {5:+0.0;-0.0}% over {6:N0} sols" -f $det, $y1.$det, $y1.p, $y2.$det, $y2.p, (($y2.$det / $y1.$det - 1) * 100), ($y2.sol - $y1.sol)
    $xs = @(); $ys = @()
    foreach ($k in 'low_pressure', 'high_pressure', 'sols_400_440', 'low_pressure_y2') { $g = $gm[$k]; if (-not $g) { continue }
      $corr = $g.$det * [Math]::Exp(-$rate * ($g.sol - $y1.sol)); $xs += $g.p / 37.1; $ys += [Math]::Log($corr)
      "    {0,-16} sol~{1,4:N0}  {2,6:N1} Pa  dose {3,6:N1} -> drift-corrected {4,6:N1}" -f $k, $g.sol, $g.p, $g.$det, $corr }
    $fit = Fit1 $xs $ys
    "    between-group mu ({0}) = {1:N4} cm2/g (+/- {2:N4}) from {3} group means" -f $det, (-$fit.slope), $fit.se, $fit.n
  }
}
