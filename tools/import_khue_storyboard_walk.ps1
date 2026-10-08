# Mechanical fixed-grid import of three coherent 4x2 imagegen sheets.
# Shared 0.95 scale and one registration offset per source row (four frames).
# No head splicing, individual frame cropping, body repair or pose synthesis.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$root=Join-Path $taskRoot 'assets/pixel/pilot-v5'
$old=[Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v3/khue.png'))
$palette=@{}
for($y=0;$y -lt $old.Height;$y++){for($x=0;$x -lt $old.Width;$x++){$c=$old.GetPixel($x,$y);if($c.A -gt 0){$palette[$c.ToArgb()]=$c}}}
$colors=@($palette.Values)
$bank=$old.Clone([Drawing.Rectangle]::new(0,0,256,384),[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$metrics=@()
try{
 foreach($direction in @('right','up','down')){
  $src=[Drawing.Bitmap]::FromFile((Join-Path $root ($direction+'-source.png')))
  $strip=[Drawing.Bitmap]::new(256,48)
  $row=@{down=0;right=2;up=3}[$direction]
  try{
   $cellW=$src.Width/4;$cellH=$src.Height/2
   $scale=0.95;$rowOffsets=@()
   # Generated sheet rows have different transparent top margins. Register each
   # complete four-frame row together, preserving relative pose positions.
   for($sourceRow=0;$sourceRow -lt 2;$sourceRow++){
    $rowTop=48
    for($column=0;$column -lt 4;$column++){for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
     $sx=[int][Math]::Floor($column*$cellW+($x+.5)*$cellW/32)
     $sy=[int][Math]::Floor($sourceRow*$cellH+($y+.5)*$cellH/48)
     if($src.GetPixel($sx,$sy).A -ge 160){$rowTop=[Math]::Min($rowTop,$y)}
    }}}
    $rowOffsets+=[int][Math]::Round(7-(24+($rowTop-24)*$scale))
   }
   for($frame=0;$frame -lt 8;$frame++){
    $count=0;$top=48;$bottom=-1;$left=32;$right=-1
    for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
     $sourceRow=[int][Math]::Floor($frame/4)
     $lx=16+($x+.5-16)/$scale;$ly=24+($y+.5-24-$rowOffsets[$sourceRow])/$scale
     $chosen=[Drawing.Color]::Transparent;$c=[Drawing.Color]::Transparent
     if($lx -ge 0 -and $lx -lt 32 -and $ly -ge 0 -and $ly -lt 48){
      $sx=[int][Math]::Floor(($frame%4)*$cellW+$lx*$cellW/32)
      $sy=[int][Math]::Floor($sourceRow*$cellH+$ly*$cellH/48)
      $c=$src.GetPixel($sx,$sy)
     }
     if($c.A -ge 160){
      $best=[double]::PositiveInfinity
      foreach($color in $colors){$d=($c.R-$color.R)*($c.R-$color.R)+($c.G-$color.G)*($c.G-$color.G)+($c.B-$color.B)*($c.B-$color.B);if($d -lt $best){$best=$d;$chosen=$color}}
      $count++;$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);$left=[Math]::Min($left,$x);$right=[Math]::Max($right,$x)
     }
     $strip.SetPixel($frame*32+$x,$y,$chosen);$bank.SetPixel($frame*32+$x,$row*48+$y,$chosen)
    }}
    if($count -lt 200 -or $top -le 0 -or $bottom -ge 47 -or $left -le 0 -or $right -ge 31){throw "Clipped or empty frame: $direction/$frame bounds $left,$top..$right,$bottom"}
    $metrics+=@{direction=$direction;frame=$frame;occupiedPixels=$count;left=$left;top=$top;right=$right;bottom=$bottom;sourceWidth=$src.Width;sourceHeight=$src.Height;sharedScale=$scale;sourceRowOffset=$rowOffsets[$sourceRow]}
   }
   $strip.Save((Join-Path $root ($direction+'-walk.png')),[Drawing.Imaging.ImageFormat]::Png)
  }finally{$strip.Dispose();$src.Dispose()}
 }
 $bank.Save((Join-Path $root 'khue.png'),[Drawing.Imaging.ImageFormat]::Png)
 $metrics | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $root 'metrics.json') -Encoding UTF8
 $metrics | ForEach-Object {[pscustomobject]$_} | Format-Table direction,frame,occupiedPixels,left,top,right,bottom -AutoSize
}finally{$bank.Dispose();$old.Dispose()}
