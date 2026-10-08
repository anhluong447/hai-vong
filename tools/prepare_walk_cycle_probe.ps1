# Technical pose guides only. Character artwork is generated with imagegen.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/walk-cycle-probe'
New-Item -ItemType Directory -Force -Path $out | Out-Null
Copy-Item -LiteralPath (Join-Path $taskRoot 'assets/pixel/walk-probe/khue-left-master.png') -Destination (Join-Path $out 'master.png')
$front=@(17,32,12,39,9,45,6,45)
$back=@(17,32,21,38,24,44,21,44)
$closingSupport=@(17,32,14,39,12,45,9,45)
$closingSwing=@(17,32,19,37,21,41,18,41)
$passingSupport=@(17,32,17,39,16,45,13,45)
$passingSwing=@(17,32,12,37,19,41,16,41)
$openingSupport=@(17,32,20,38,22,44,19,44)
$openingSwing=@(17,32,12,37,11,43,8,43)
$poses=@(
 @{near=$front;far=$back;nearHand=@(22,33);farHand=@(10,31);phase='wide A'},
 @{near=$closingSupport;far=$closingSwing;nearHand=@(20,33);farHand=@(12,32);phase='closing A'},
 @{near=$passingSupport;far=$passingSwing;nearHand=@(17,34);farHand=@(15,33);phase='narrow A'},
 @{near=$openingSupport;far=$openingSwing;nearHand=@(12,32);farHand=@(20,32);phase='opening A'},
 @{near=$back;far=$front;nearHand=@(10,31);farHand=@(22,33);phase='wide B'},
 @{near=$closingSwing;far=$closingSupport;nearHand=@(12,32);farHand=@(20,33);phase='closing B'},
 @{near=$passingSwing;far=$passingSupport;nearHand=@(15,33);farHand=@(17,34);phase='narrow B'},
 @{near=$openingSwing;far=$openingSupport;nearHand=@(20,32);farHand=@(12,32);phase='opening B'}
)
$overview=New-Object System.Drawing.Bitmap 1024,768
$og=[System.Drawing.Graphics]::FromImage($overview)
$og.Clear([System.Drawing.Color]::FromArgb(255,246,246,240))
$manifest=@()
for($index=0;$index -lt 8;$index++){
 $pose=$poses[$index];$diagram=New-Object System.Drawing.Bitmap 512,768
 $g=[System.Drawing.Graphics]::FromImage($diagram);$g.Clear([System.Drawing.Color]::FromArgb(255,246,246,240));$g.ScaleTransform(16,16)
 $body=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(125,132,137),3)
 $near=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80,112,148),2.5)
 $far=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(32,46,65),2.5)
 $line=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(185,185,180),0.15)
 $g.DrawLine($line,1,46,31,46)
 $g.DrawEllipse($body,10,7,12,13);$g.DrawLine($body,16,21,16,25);$g.DrawLine($body,16,25,17,32)
 foreach($layer in @(@{pen=$far;leg=$pose.far;hand=$pose.farHand},@{pen=$near;leg=$pose.near;hand=$pose.nearHand})){
  $v=$layer.leg
  for($i=0;$i -lt 6;$i+=2){$g.DrawLine($layer.pen,[single]$v[$i],[single]$v[$i+1],[single]$v[$i+2],[single]$v[$i+3])}
  $hand=$layer.hand;$elbowX=(16+$hand[0])/2;$elbowY=29
  $g.DrawLine($layer.pen,16,25,[single]$elbowX,[single]$elbowY)
  $g.DrawLine($layer.pen,[single]$elbowX,[single]$elbowY,[single]$hand[0],[single]$hand[1])
 }
 $diagram.Save((Join-Path $out ('guide-'+$index+'.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $og.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $og.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $og.DrawImage($diagram,[int](($index%4)*256),[int]([Math]::Floor($index/4)*384),256,384)
 $manifest+=@{frame=$index;phase=$pose.phase;nearLeg=$pose.near;farLeg=$pose.far;nearHand=$pose.nearHand;farHand=$pose.farHand}
 $g.Dispose();$diagram.Dispose();$body.Dispose();$near.Dispose();$far.Dispose();$line.Dispose()
}
$overview.Save((Join-Path $out 'sequence-guide.png'),[System.Drawing.Imaging.ImageFormat]::Png);$og.Dispose();$overview.Dispose()
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $out 'guide-landmarks.json') -Encoding UTF8
Write-Output 'Prepared eight contraction/expansion and arm guides.'
