# Technical pose guides and fixed-canvas references; character art comes from imagegen.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/khue-full-walk'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$original=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v2/khue.png'))
$side=Get-Content (Join-Path $taskRoot 'assets/pixel/walk-cycle-probe/guide-landmarks.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$frontLeg=@(
 @{left=@(19,32,20,39,20,45);right=@(13,32,12,36,12,40);lh=@(24,29);rh=@(8,34)},
 @{left=@(19,32,19,39,19,44);right=@(13,32,14,36,13,39);lh=@(23,31);rh=@(9,33)},
 @{left=@(19,32,18,38,18,43);right=@(13,32,15,36,15,40);lh=@(22,33);rh=@(10,33)},
 @{left=@(19,32,19,36,19,41);right=@(13,32,12,38,12,44);lh=@(24,34);rh=@(8,30)},
 @{left=@(19,32,20,36,20,40);right=@(13,32,12,39,12,45);lh=@(24,34);rh=@(8,29)},
 @{left=@(19,32,18,36,19,39);right=@(13,32,13,39,13,44);lh=@(23,33);rh=@(9,31)},
 @{left=@(19,32,17,36,17,40);right=@(13,32,14,38,14,43);lh=@(22,33);rh=@(10,33)},
 @{left=@(19,32,20,38,20,44);right=@(13,32,13,36,13,41);lh=@(24,30);rh=@(8,34)}
)
$backLeg=@(
 @{left=@(13,32,12,36,12,40);right=@(19,32,20,39,20,45);lh=@(8,34);rh=@(24,29)},
 @{left=@(13,32,13,37,13,41);right=@(19,32,18,37,19,41);lh=@(9,33);rh=@(23,31)},
 @{left=@(13,32,14,38,14,43);right=@(19,32,17,36,17,40);lh=@(10,33);rh=@(22,33)},
 @{left=@(13,32,13,39,13,44);right=@(19,32,20,36,20,41);lh=@(8,30);rh=@(24,34)},
 @{left=@(13,32,12,39,12,45);right=@(19,32,20,36,20,40);lh=@(8,29);rh=@(24,34)},
 @{left=@(13,32,14,37,13,41);right=@(19,32,19,37,19,41);lh=@(9,31);rh=@(23,33)},
 @{left=@(13,32,15,36,15,40);right=@(19,32,18,38,18,43);lh=@(10,33);rh=@(22,33)},
 @{left=@(13,32,12,36,12,41);right=@(19,32,19,39,19,44);lh=@(8,34);rh=@(24,30)}
)
$manifest=@()
foreach($direction in @('down','right','up')){
 $row=@{down=4;right=6;up=7}[$direction]
 $master=New-Object System.Drawing.Bitmap 512,768
 $g=[System.Drawing.Graphics]::FromImage($master);$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $g.DrawImage($original,[System.Drawing.Rectangle]::new(0,0,512,768),0,$row*48,32,48,[System.Drawing.GraphicsUnit]::Pixel)
 $master.Save((Join-Path $out ($direction+'-master.png')),[System.Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$master.Dispose()
 $overview=New-Object System.Drawing.Bitmap 1024,768
 $og=[System.Drawing.Graphics]::FromImage($overview);$og.Clear([System.Drawing.Color]::FromArgb(255,246,246,240))
 for($i=0;$i -lt 8;$i++){
  $diagram=New-Object System.Drawing.Bitmap 512,768
  $g=[System.Drawing.Graphics]::FromImage($diagram);$g.Clear([System.Drawing.Color]::FromArgb(255,246,246,240));$g.ScaleTransform(16,16)
  $body=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(125,132,137),4)
  $light=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80,112,148),3)
  $dark=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(32,46,65),3)
  $handBrush=[System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(189,151,111))
  $ground=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(185,185,180),0.15)
  $g.DrawLine($ground,1,46,31,46);$g.DrawEllipse($body,10,7,12,13)
  $g.DrawLine($body,16,22,16,25);$g.DrawLine($body,16,25,16,32)
  if($direction -eq 'right'){
   # Mirror the technical mannequin, not the finished character. Swap near/far half-cycle
   # so frame 0 remains the same anatomical contact across direction changes.
   $pose=$side[($i+4)%8];$layers=@(@{pen=$dark;leg=$pose.farLeg;hand=$pose.farHand},@{pen=$light;leg=$pose.nearLeg;hand=$pose.nearHand})
   foreach($layer in $layers){
    $v=$layer.leg
    for($j=0;$j -lt 6;$j+=2){$g.DrawLine($layer.pen,[single](32-$v[$j]),[single]$v[$j+1],[single](32-$v[$j+2]),[single]$v[$j+3])}
    $hx=32-$layer.hand[0];$hy=$layer.hand[1];$ex=(16+$hx)/2
    $g.DrawLine($layer.pen,16,25,[single]$ex,29);$g.DrawLine($layer.pen,[single]$ex,29,[single]$hx,[single]$hy)
    $g.FillRectangle($handBrush,[single]($hx-1.5),[single]($hy-1),3,3)
   }
  }else{
   $pose=if($direction -eq 'up'){$backLeg[$i]}else{$frontLeg[$i]}
   $isUp=$direction -eq 'up'
   # Facing away swaps the screen side of each anatomical leg.
   $lv=$pose.left;$rv=$pose.right;$lh=$pose.lh;$rh=$pose.rh
   $layers=@(@{v=$lv;hand=$lh;shoulder=$(if($isUp){11}else{21})},@{v=$rv;hand=$rh;shoulder=$(if($isUp){21}else{11})}) | Sort-Object {$_.v[5]}
   foreach($layer in $layers){
    $v=$layer.v;$pen=if($v[5] -ge 43){$light}else{$dark}
    for($j=0;$j -lt 4;$j+=2){$g.DrawLine($pen,[single]$v[$j],[single]$v[$j+1],[single]$v[$j+2],[single]$v[$j+3])}
    $g.DrawLine($pen,[single]($v[4]-1.5),[single]$v[5],[single]($v[4]+1.5),[single]$v[5])
    $hand=$layer.hand;$sx=$layer.shoulder
    $arm=if($hand[1] -ge 32){$light}else{$dark}
    $g.DrawLine($arm,[single]$sx,25,[single]$hand[0],[single]$hand[1]);$g.FillRectangle($handBrush,[single]($hand[0]-1.5),[single]($hand[1]-1),3,3)
   }
  }
  $diagram.Save((Join-Path $out ($direction+'-guide-'+$i+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
  $og.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$og.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $og.DrawImage($diagram,[int](($i%4)*256),[int]([Math]::Floor($i/4)*384),256,384)
  $manifest+=@{direction=$direction;frame=$i;phase=@('wide A','closing A','passing A','opening A','wide B','closing B','passing B','opening B')[$i]}
  $g.Dispose();$diagram.Dispose();$body.Dispose();$light.Dispose();$dark.Dispose();$handBrush.Dispose();$ground.Dispose()
 }
 $overview.Save((Join-Path $out ($direction+'-sequence.png')),[System.Drawing.Imaging.ImageFormat]::Png);$og.Dispose();$overview.Dispose()
}
$original.Dispose()
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $out 'manifest.json') -Encoding UTF8
Write-Output 'Prepared direction masters and 24 thick-limb technical poses.'
