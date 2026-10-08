# Fixed full-canvas import only; no pose synthesis, mirroring, recentering or anatomical repairs.
param([ValidateRange(1,8)][int]$Count=8)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/walk-cycle-probe'
$original=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v2/khue.png'))
$palette=@{}
for($y=0;$y -lt $original.Height;$y++){for($x=0;$x -lt $original.Width;$x++){$c=$original.GetPixel($x,$y);if($c.A -gt 0){$palette[$c.ToArgb()]=$c}}}
$colors=@($palette.Values)
$strip=New-Object System.Drawing.Bitmap ($Count*32),48
$report=@()
for($index=0;$index -lt $Count;$index++){
 $src=[System.Drawing.Bitmap]::FromFile((Join-Path $out ('frame-'+$index+'-source.png')))
 if([Math]::Abs($src.Width/$src.Height-2/3) -gt 0.001){throw "Frame $index has unexpected aspect ratio"}
 $dest=New-Object System.Drawing.Bitmap 32,48
 $headDiff=0;$minX=32;$maxX=-1;$lowerPixels=0
 for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
  $c=$src.GetPixel([int][Math]::Floor(($x+0.5)*$src.Width/32),[int][Math]::Floor(($y+0.5)*$src.Height/48))
  $chosen=[System.Drawing.Color]::Transparent
  if($c.A -ge 160){
   $best=[double]::PositiveInfinity
   foreach($color in $colors){$d=[Math]::Pow($c.R-$color.R,2)+[Math]::Pow($c.G-$color.G,2)+[Math]::Pow($c.B-$color.B,2);if($d -lt $best){$best=$d;$chosen=$color}}
   $dest.SetPixel($x,$y,$chosen);$strip.SetPixel($index*32+$x,$y,$chosen)
   if($y -ge 37){$minX=[Math]::Min($minX,$x);$maxX=[Math]::Max($maxX,$x);$lowerPixels++}
  }
  $o=$original.GetPixel($x,$y+240)
  if($y -lt 24 -and (($o.A -gt 0) -ne ($chosen.A -gt 0) -or ($o.A -gt 0 -and $chosen.A -gt 0 -and $o.ToArgb() -ne $chosen.ToArgb()))){$headDiff++}
 }}
 $dest.Save((Join-Path $out ('frame-'+$index+'-native.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $report+=@{frame=$index;lowerRegionWidth=if($maxX -ge $minX){$maxX-$minX+1}else{0};lowerRegionPixels=$lowerPixels;headChangedPixels=$headDiff;sourceWidth=$src.Width;sourceHeight=$src.Height}
 $dest.Dispose();$src.Dispose()
}
$strip.Save((Join-Path $out 'khue-left-walk-native.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$strip.Dispose();$original.Dispose()
@{frames=$report;lowerRegion='alpha bounds at y>=37, a spread indicator; not anatomical foot identification';headRegion='y<24 compared against approved idle master';import='fixed 32x48 canvas, alpha>=160, nearest approved Khue RGB palette';previewStridePixels=32;previewVelocity=40} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'metrics.json') -Encoding UTF8
$report | ForEach-Object {[pscustomobject]$_} | Select-Object frame,lowerRegionWidth,headChangedPixels | Format-Table -AutoSize
