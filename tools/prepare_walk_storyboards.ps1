# Technical motion diagrams derived from the approved side-view pose landmarks.
# No character artwork is generated or modified by this script.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/walk-cycle-probe/storyboards'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$poses=Get-Content -LiteralPath (Join-Path $taskRoot 'assets/pixel/walk-cycle-probe/guide-landmarks.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$phaseNames=@('CONTACT A','CLOSING A','PASSING A','OPENING A','CONTACT B','CLOSING B','PASSING B','OPENING B')
$manifest=@()
function Project-Leg($leg,[string]$direction,[double]$anatomicalSide){
 if($direction -eq 'left'){return ,@($leg[0],$leg[1],$leg[2],$leg[3],$leg[4],$leg[5],$leg[6],$leg[7])}
 if($direction -eq 'right'){return ,@((32-$leg[0]),$leg[1],(32-$leg[2]),$leg[3],(32-$leg[4]),$leg[5],(32-$leg[6]),$leg[7])}
 $facing=if($direction -eq 'down'){1}else{-1}
 $side=$anatomicalSide*$facing
 $result=@([double](16+$side*3),32)
 foreach($joint in @(2,4)){
  $depth=17-$leg[$joint]
  $x=16+$side*(2+[Math]::Abs($depth)/8)
  $y=32+($leg[$joint+1]-32)*0.8+$facing*$depth*0.25
  $result+=@([double]$x,[double]$y)
 }
 # Front/back shoes project across the screen, rather than pointing sideways.
 $result+=@([double]($result[4]+$side*1.5),[double]$result[5])
 return ,$result
}
function Project-Hand($hand,[string]$direction,[double]$anatomicalSide){
 if($direction -eq 'left'){return ,@($hand[0],$hand[1])}
 if($direction -eq 'right'){return ,@((32-$hand[0]),$hand[1])}
 $facing=if($direction -eq 'down'){1}else{-1}
 $depth=17-$hand[0]
 return ,@([double](16+$anatomicalSide*$facing*(6+[Math]::Abs($depth)*0.12)),[double](31+$facing*$depth*0.45+($hand[1]-32)*0.15))
}
foreach($direction in @('left','right','up','down')){
 $sideView=$direction -in @('left','right')
 $overview=[Drawing.Bitmap]::new(1024,768)
 $og=[Drawing.Graphics]::FromImage($overview)
 $og.Clear([Drawing.Color]::FromArgb(246,246,240))
 $og.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $og.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
 $font=[Drawing.Font]::new('Arial',13,[Drawing.FontStyle]::Bold)
 $labelBrush=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(50,60,65))
 for($i=0;$i -lt 8;$i++){
  $pose=$poses[$i]
  $leftLeg=Project-Leg $pose.nearLeg $direction 1
  $rightLeg=Project-Leg $pose.farLeg $direction -1
  $leftHand=Project-Hand $pose.nearHand $direction 1
  $rightHand=Project-Hand $pose.farHand $direction -1
  $diagram=[Drawing.Bitmap]::new(512,768)
  $g=[Drawing.Graphics]::FromImage($diagram)
  $g.Clear([Drawing.Color]::FromArgb(246,246,240));$g.ScaleTransform(16,16)
  $body=[Drawing.Pen]::new([Drawing.Color]::FromArgb(125,132,137),3)
  $blue=[Drawing.Pen]::new([Drawing.Color]::FromArgb(80,112,148),3)
  $dark=[Drawing.Pen]::new([Drawing.Color]::FromArgb(32,46,65),3)
  foreach($pen in @($body,$blue,$dark)){$pen.StartCap=[Drawing.Drawing2D.LineCap]::Round;$pen.EndCap=[Drawing.Drawing2D.LineCap]::Round}
  $ground=[Drawing.Pen]::new([Drawing.Color]::FromArgb(185,185,180),0.15)
  $handBrush=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(189,151,111))
  $g.DrawLine($ground,1,46,31,46)
  $g.DrawEllipse($body,10,7,12,13)
  $g.DrawLine($body,16,21,16,25)
  $hipX=if($direction -eq 'left'){17}elseif($direction -eq 'right'){15}else{16}
  $g.DrawLine($body,16,25,$hipX,32)
  if(-not $sideView){$g.DrawLine($body,11,25,21,25);$g.DrawLine($body,13,32,19,32)}
  # Direction marker and face/back cue; same head bounds in every view.
  $marker=[Drawing.Pen]::new([Drawing.Color]::FromArgb(70,85,90),0.35)
  if($direction -eq 'left'){$g.DrawLine($marker,14,14,10,14);$g.DrawLine($marker,10,14,12,12);$g.DrawLine($marker,10,14,12,16)}
  elseif($direction -eq 'right'){$g.DrawLine($marker,18,14,22,14);$g.DrawLine($marker,22,14,20,12);$g.DrawLine($marker,22,14,20,16)}
  elseif($direction -eq 'down'){$g.DrawLine($marker,13,13,13,15);$g.DrawLine($marker,19,13,19,15);$g.DrawLine($marker,16,17,16,19)}
  else{$g.DrawLine($marker,16,8,16,11)}
  $ls=if($sideView){16}elseif($direction -eq 'down'){21}else{11}
  $rs=if($sideView){16}elseif($direction -eq 'down'){11}else{21}
  $layers=@(@{pen=$blue;leg=$leftLeg;hand=$leftHand;shoulder=$ls;id='left'},@{pen=$dark;leg=$rightLeg;hand=$rightHand;shoulder=$rs;id='right'})
  $legLayers=if($direction -eq 'left'){@($layers[1],$layers[0])}elseif($direction -eq 'right'){@($layers[0],$layers[1])}else{@($layers | Sort-Object {$_.leg[5]})}
  foreach($layer in $legLayers){
   $v=$layer.leg
   for($j=0;$j -lt 4;$j+=2){$g.DrawLine($layer.pen,[single]$v[$j],[single]$v[$j+1],[single]$v[$j+2],[single]$v[$j+3])}
   if($sideView){$g.DrawLine($layer.pen,[single]$v[4],[single]$v[5],[single]$v[6],[single]$v[7])}
   else{$g.DrawLine($layer.pen,[single]($v[4]-1.5),[single]$v[5],[single]($v[4]+1.5),[single]$v[5])}
  }
  $armLayers=if($direction -eq 'left'){@($layers[1],$layers[0])}elseif($direction -eq 'right'){@($layers[0],$layers[1])}else{@($layers | Sort-Object {$_.hand[1]})}
  foreach($layer in $armLayers){
   $h=$layer.hand;$sx=$layer.shoulder;$ex=($sx+$h[0])/2
   $ey=if($sideView){29}else{27+($h[1]-29)*0.3}
   $g.DrawLine($layer.pen,[single]$sx,25,[single]$ex,[single]$ey)
   $g.DrawLine($layer.pen,[single]$ex,[single]$ey,[single]$h[0],[single]$h[1])
   $g.FillRectangle($handBrush,[single]($h[0]-1.5),[single]($h[1]-1.5),3,3)
  }
  $diagram.Save((Join-Path $out ($direction+'-guide-'+$i+'.png')),[Drawing.Imaging.ImageFormat]::Png)
  $cx=($i%4)*256;$cy=[int]([Math]::Floor($i/4)*384)
  $og.DrawImage($diagram,[int]$cx,[int]$cy,256,384)
  $og.DrawString(($direction.ToUpper()+' '+$i.ToString()+' '+$phaseNames[$i]),$font,$labelBrush,[single]($cx+8),[single]($cy+7))
  $manifest+=@{direction=$direction;frame=$i;phase=$phaseNames[$i];leftLeg=$leftLeg;rightLeg=$rightLeg;leftHand=$leftHand;rightHand=$rightHand;pivot=@(16,46);head=@(10,7,12,13);limbWidth=3}
  $g.Dispose();$diagram.Dispose();$body.Dispose();$blue.Dispose();$dark.Dispose();$ground.Dispose();$handBrush.Dispose();$marker.Dispose()
 }
 $overview.Save((Join-Path $out ($direction+'-sequence.png')),[Drawing.Imaging.ImageFormat]::Png)
 $og.Dispose();$overview.Dispose();$font.Dispose();$labelBrush.Dispose()
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $out 'landmarks.json') -Encoding UTF8
Write-Output 'Prepared four aligned eight-phase storyboards and 32 individual pose guides.'
