# Mechanical reference extraction and a technical pose diagram; no character art generation.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$out=Join-Path $taskRoot 'assets/pixel/walk-probe'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$sheet=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v2/khue.png'))
$master=New-Object System.Drawing.Bitmap 512,768
$graphics=[System.Drawing.Graphics]::FromImage($master)
$graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.DrawImage($sheet,[System.Drawing.Rectangle]::new(0,0,512,768),0,240,32,48,[System.Drawing.GraphicsUnit]::Pixel)
$master.Save((Join-Path $out 'khue-left-master.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$master.Dispose();$sheet.Dispose()
$poses=@(
 @{id='contact-left';red=@(17,32,12,39,9,45,6,45);blue=@(17,32,21,38,24,45,21,45)},
 @{id='passing-right';red=@(17,32,16,39,14,45,11,45);blue=@(17,32,12,37,19,41,16,41)},
 @{id='contact-right';red=@(17,32,21,38,24,45,21,45);blue=@(17,32,12,39,9,45,6,45)}
)
foreach($pose in $poses){
 $diagram=New-Object System.Drawing.Bitmap 512,768
 $g=[System.Drawing.Graphics]::FromImage($diagram)
 $g.Clear([System.Drawing.Color]::FromArgb(255,246,246,240))
 $g.ScaleTransform(16,16)
 $grey=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(100,110,120),2)
 $red=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(210,55,70),2)
 $blue=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(40,100,210),2)
 $ground=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(185,185,180),0.15)
 $g.DrawLine($ground,1,46,31,46)
 $g.DrawEllipse($grey,10,7,12,13)
 $g.DrawLine($grey,16,20,16,25)
 $g.DrawLine($grey,16,25,17,32)
 $g.DrawLine($grey,12,24,20,24)
 # Technical body guide is identical across poses. Red = anatomical left, blue = right.
 foreach($item in @(@{pen=$blue;points=$pose.blue},@{pen=$red;points=$pose.red})){
  $v=$item.points
  for($i=0;$i -lt 6;$i+=2){$g.DrawLine($item.pen,[single]$v[$i],[single]$v[$i+1],[single]$v[$i+2],[single]$v[$i+3])}
 }
 $diagram.Save((Join-Path $out ($pose.id+'-guide.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 $grey.Dispose();$red.Dispose();$blue.Dispose();$ground.Dispose();$g.Dispose();$diagram.Dispose()
}
Write-Output 'Prepared one fixed-canvas master and three pose diagrams in assets/pixel/walk-probe.'
