# Copy exact idle frames into a fixed 4x2 edit target, and build technical guides
# around their measured upper-body bounds. Character art is edited by imagegen.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/pilot-v6'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$sheet=[Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v5/khue.png'))
$poses=Get-Content -Raw -Encoding UTF8 (Join-Path $taskRoot 'assets/pixel/walk-cycle-probe/storyboards/landmarks.json') | ConvertFrom-Json
foreach($direction in @('up','down')){
 $row=@{up=7;down=4}[$direction]
 $target=[Drawing.Bitmap]::new(1024,768);$tg=[Drawing.Graphics]::FromImage($target)
 $tg.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$tg.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
 $guide=[Drawing.Bitmap]::new(1024,768);$gg=[Drawing.Graphics]::FromImage($guide);$gg.Clear([Drawing.Color]::FromArgb(246,246,240))
 $xmin=32;$xmax=-1;$ymin=48;$ymax=-1
 for($y=0;$y -lt 24;$y++){for($x=0;$x -lt 32;$x++){if($sheet.GetPixel($x,$row*48+$y).A -gt 0){$xmin=[Math]::Min($xmin,$x);$xmax=[Math]::Max($xmax,$x);$ymin=[Math]::Min($ymin,$y);$ymax=[Math]::Max($ymax,$y)}}}
 for($i=0;$i -lt 8;$i++){
  $cx=($i%4)*256;$cy=[int]([Math]::Floor($i/4)*384)
  $tg.DrawImage($sheet,[Drawing.Rectangle]::new($cx,$cy,256,384),0,$row*48,32,48,[Drawing.GraphicsUnit]::Pixel)
  $gg.ResetTransform();$gg.TranslateTransform($cx,$cy);$gg.ScaleTransform(8,8)
  $body=[Drawing.Pen]::new([Drawing.Color]::FromArgb(125,132,137),.5)
  $blue=[Drawing.Pen]::new([Drawing.Color]::FromArgb(80,112,148),3)
  $dark=[Drawing.Pen]::new([Drawing.Color]::FromArgb(32,46,65),3)
  foreach($p in @($blue,$dark)){$p.StartCap=[Drawing.Drawing2D.LineCap]::Round;$p.EndCap=[Drawing.Drawing2D.LineCap]::Round}
  $gg.DrawRectangle($body,$xmin,$ymin,($xmax-$xmin+1),($ymax-$ymin+1))
  $gg.DrawRectangle($body,11,24,10,8);$gg.DrawLine($body,11,32,21,32)
  $pose=$poses | Where-Object {$_.direction -eq $direction -and $_.frame -eq $i}
  $layers=@(@{pen=$blue;leg=$pose.leftLeg;hand=$pose.leftHand;shoulder=$(if($direction -eq 'down'){21}else{11})},@{pen=$dark;leg=$pose.rightLeg;hand=$pose.rightHand;shoulder=$(if($direction -eq 'down'){11}else{21})})
  foreach($l in ($layers | Sort-Object {$_.leg[5]})){
   $v=$l.leg;$gg.DrawLine($l.pen,[single]$v[0],33,[single]$v[2],[single]($v[3]+1));$gg.DrawLine($l.pen,[single]$v[2],[single]($v[3]+1),[single]$v[4],[single]$v[5])
   $brush=[Drawing.SolidBrush]::new($l.pen.Color);$gg.FillRectangle($brush,[single]($v[4]-2),[single]($v[5]-1),4,2);$brush.Dispose()
  }
  foreach($l in ($layers | Sort-Object {$_.hand[1]})){$h=$l.hand;$gg.DrawLine($l.pen,[single]$l.shoulder,26,[single]$h[0],[single]$h[1])}
  $body.Dispose();$blue.Dispose();$dark.Dispose()
 }
 $target.Save((Join-Path $out ($direction+'-idle-template.png')),[Drawing.Imaging.ImageFormat]::Png)
 $guide.Save((Join-Path $out ($direction+'-body-guide.png')),[Drawing.Imaging.ImageFormat]::Png)
 $tg.Dispose();$gg.Dispose();$target.Dispose();$guide.Dispose()
}
$sheet.Dispose()
