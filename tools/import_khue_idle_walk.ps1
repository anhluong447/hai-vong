# Fixed-grid sprite import. No scaling; register entire source rows to idle.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$root=Join-Path $taskRoot 'assets/pixel/pilot-v6'
$old=[Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v5/khue.png'))
$bank=$old.Clone([Drawing.Rectangle]::new(0,0,256,384),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$palette=@{};for($y=0;$y -lt 384;$y++){for($x=0;$x -lt 256;$x++){$c=$old.GetPixel($x,$y);if($c.A){$palette[$c.ToArgb()]=$c}}};$colors=@($palette.Values)
function Bounds($bitmap,$x0,$y0,$height){
 $l=32;$r=-1;$t=48;$b=-1;$count=0
 for($y=0;$y -lt $height;$y++){for($x=0;$x -lt 32;$x++){if($bitmap.GetPixel($x0+$x,$y0+$y).A){$l=[Math]::Min($l,$x);$r=[Math]::Max($r,$x);$t=[Math]::Min($t,$y);$b=[Math]::Max($b,$y);$count++}}}
 return @{left=$l;right=$r;top=$t;bottom=$b;width=$r-$l+1;height=$b-$t+1;count=$count;centerX=($l+$r)/2}
}
$records=@();$failures=@()
try{
 foreach($direction in @('up','down')){
  $src=[Drawing.Bitmap]::FromFile((Join-Path $root ($direction+'-source.png')))
  $row=@{up=3;down=0}[$direction];$idleRow=$row+4
  $idle=Bounds $old 0 ($idleRow*48) 24
  $strip=[Drawing.Bitmap]::new(256,48)
  try{
   $cw=$src.Width/4;$ch=$src.Height/2
   $rowOffsets=@()
   for($sourceRow=0;$sourceRow -lt 2;$sourceRow++){
    $top=48
    for($column=0;$column -lt 4;$column++){for($y=0;$y -lt 24;$y++){for($x=0;$x -lt 32;$x++){
     $sx=[int][Math]::Floor($column*$cw+($x+.5)*$cw/32);$sy=[int][Math]::Floor($sourceRow*$ch+($y+.5)*$ch/48)
     if($src.GetPixel($sx,$sy).A -ge 160){$top=[Math]::Min($top,$y)}
    }}}
    $rowOffsets+=($idle.top-$top)
   }
   for($frame=0;$frame -lt 8;$frame++){
    for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
     $sx=[int][Math]::Floor(($frame%4)*$cw+($x+.5)*$cw/32)
     $sourceRow=[int][Math]::Floor($frame/4);$ly=$y+.5-$rowOffsets[$sourceRow]
     $c=[Drawing.Color]::Transparent;$chosen=[Drawing.Color]::Transparent
     if($ly -ge 0 -and $ly -lt 48){$sy=[int][Math]::Floor($sourceRow*$ch+$ly*$ch/48);$c=$src.GetPixel($sx,$sy)}
     if($c.A -ge 160){$best=[double]::PositiveInfinity;foreach($color in $colors){$d=($c.R-$color.R)*($c.R-$color.R)+($c.G-$color.G)*($c.G-$color.G)+($c.B-$color.B)*($c.B-$color.B);if($d -lt $best){$best=$d;$chosen=$color}}}
     $bank.SetPixel($frame*32+$x,$row*48+$y,$chosen);$strip.SetPixel($frame*32+$x,$y,$chosen)
    }}
    $full=Bounds $strip ($frame*32) 0 48;$upper=Bounds $strip ($frame*32) 0 24
    $pass=$full.count -gt 200 -and $full.top -gt 0 -and $full.bottom -lt 47 -and [Math]::Abs($upper.width-$idle.width) -le 1 -and [Math]::Abs($upper.height-$idle.height) -le 1 -and [Math]::Abs($upper.top-$idle.top) -le 1 -and [Math]::Abs($upper.centerX-$idle.centerX) -le 1
    $records+=@{direction=$direction;frame=$frame;idleUpper=$idle;walkUpper=$upper;full=$full;sourceRowOffset=$rowOffsets[$sourceRow];passesGeometryGate=$pass}
    if(-not $pass){$failures+=($direction+'/'+$frame)}
   }
   $strip.Save((Join-Path $root ($direction+'-walk.png')),[Drawing.Imaging.ImageFormat]::Png)
  }finally{$src.Dispose();$strip.Dispose()}
 }
 $bank.Save((Join-Path $root 'khue.png'),[Drawing.Imaging.ImageFormat]::Png)
 $records | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $root 'metrics.json') -Encoding UTF8
 $records | ForEach-Object {[pscustomobject]@{direction=$_.direction;frame=$_.frame;idleUpper=($_.idleUpper.width.ToString()+'x'+$_.idleUpper.height);walkUpper=($_.walkUpper.width.ToString()+'x'+$_.walkUpper.height);top=$_.walkUpper.top;fullHeight=$_.full.height;pass=$_.passesGeometryGate}} | Format-Table -AutoSize
 if($failures.Count){throw ('Proportion gate failed: '+($failures -join ', '))}
}finally{$bank.Dispose();$old.Dispose()}
