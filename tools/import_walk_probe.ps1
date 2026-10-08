# Deterministic fixed-canvas sampling and palette indexing. Does not draw or repair poses.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/walk-probe'
$sheet=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v2/khue.png'))
$palette=@{}
for($y=0;$y -lt $sheet.Height;$y++){for($x=0;$x -lt $sheet.Width;$x++){$c=$sheet.GetPixel($x,$y);if($c.A -gt 0){$palette[$c.ToArgb()]=$c}}}
$colors=@($palette.Values)
$report=@()
foreach($id in @('contact-left','passing-right','contact-right-attempt1','contact-right-attempt2')){
 $source=[System.Drawing.Bitmap]::FromFile((Join-Path $out ($id+'-source.png')))
 $dest=New-Object System.Drawing.Bitmap 32,48
 $headDiff=0;$occupied=0;$semi=0;$footPoints=@();$samples=@()
 for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
  $sx=[int][Math]::Floor(($x+0.5)*$source.Width/32);$sy=[int][Math]::Floor(($y+0.5)*$source.Height/48)
  $c=$source.GetPixel($sx,$sy)
  if($c.A -gt 0 -and $c.A -lt 255){$semi++}
  $chosen=[System.Drawing.Color]::Transparent
  if($c.A -ge 160){
   $best=[double]::PositiveInfinity
   foreach($color in $colors){$d=[Math]::Pow($c.R-$color.R,2)+[Math]::Pow($c.G-$color.G,2)+[Math]::Pow($c.B-$color.B,2);if($d -lt $best){$best=$d;$chosen=$color}}
   $dest.SetPixel($x,$y,$chosen);$occupied++
   if($y -ge 40){$footPoints+=@{x=$x;y=$y}}
  }
  $original=$sheet.GetPixel($x,$y+240)
  if($y -lt 24 -and (($original.A -gt 0) -ne ($chosen.A -gt 0) -or ($original.A -gt 0 -and $chosen.A -gt 0 -and $original.ToArgb() -ne $chosen.ToArgb()))){$headDiff++}
 }}
 $dest.Save((Join-Path $out ($id+'-native.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $report+=@{id=$id;sourceWidth=$source.Width;sourceHeight=$source.Height;nativeWidth=32;nativeHeight=48;occupiedPixels=$occupied;semiTransparentSamples=$semi;headRegionChangedPixels=$headDiff;headRegion='y=0..23, compared with approved left idle master';footRegion='y>=40; includes lower shin, not anatomical foot detection';footRegionPixels=$footPoints.Count}
 $dest.Dispose();$source.Dispose()
}
$sheet.Dispose()
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'metrics.json') -Encoding UTF8
$report | ForEach-Object {[pscustomobject]$_} | Select-Object id,occupiedPixels,semiTransparentSamples,headRegionChangedPixels | Format-Table -AutoSize
