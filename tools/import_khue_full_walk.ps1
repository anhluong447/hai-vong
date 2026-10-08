# Deterministic frame import and packing. Existing approved left cycle remains unchanged.
param([switch]$PreviewOnly)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$sourceRoot=Join-Path $taskRoot 'assets/pixel/khue-full-walk'
$destination=Join-Path $taskRoot 'assets/pixel/pilot-v4'
if(-not $PreviewOnly){foreach($direction in @('down','right','up')){for($i=0;$i -lt 8;$i++){
 if(-not (Test-Path -LiteralPath (Join-Path $sourceRoot ($direction+'-'+$i+'-source.png')))){throw "Missing source: $direction/$i"}
}}}
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$old=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v3/khue.png'))
$palette=@{}
for($y=0;$y -lt $old.Height;$y++){for($x=0;$x -lt $old.Width;$x++){$c=$old.GetPixel($x,$y);if($c.A -gt 0){$palette[$c.ToArgb()]=$c}}}
$colors=@($palette.Values)
$sheet=$old.Clone([System.Drawing.Rectangle]::new(0,0,256,384),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$metrics=@()
try{
 foreach($direction in @('down','right','up')){
  $row=@{down=0;right=2;up=3}[$direction];$masterRow=$row+4
  for($frame=0;$frame -lt 8;$frame++){
   $sourcePath=Join-Path $sourceRoot ($direction+'-'+$frame+'-source.png')
   if($PreviewOnly -and -not (Test-Path -LiteralPath $sourcePath)){continue}
   $src=[System.Drawing.Bitmap]::FromFile($sourcePath)
   try{
    if([Math]::Abs($src.Width/$src.Height-2/3) -gt 0.001){throw "Unexpected aspect ratio: $direction/$frame"}
    $native=New-Object System.Drawing.Bitmap 32,48
    $count=0;$top=48;$bottom=-1;$lowerMin=32;$lowerMax=-1
    for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
     $chosen=[System.Drawing.Color]::Transparent
     if($y -lt 24){$chosen=$old.GetPixel($x,$masterRow*48+$y)}else{
      $c=$src.GetPixel([int][Math]::Floor(($x+.5)*$src.Width/32),[int][Math]::Floor(($y+.5)*$src.Height/48))
      if($c.A -ge 160){$best=[double]::PositiveInfinity;foreach($color in $colors){$d=[Math]::Pow($c.R-$color.R,2)+[Math]::Pow($c.G-$color.G,2)+[Math]::Pow($c.B-$color.B,2);if($d -lt $best){$best=$d;$chosen=$color}}}
     }
     $native.SetPixel($x,$y,$chosen);$sheet.SetPixel($frame*32+$x,$row*48+$y,$chosen)
     if($chosen.A -gt 0){$count++;$top=[Math]::Min($top,$y);$bottom=[Math]::Max($bottom,$y);if($y -ge 37){$lowerMin=[Math]::Min($lowerMin,$x);$lowerMax=[Math]::Max($lowerMax,$x)}}
    }}
    $native.Save((Join-Path $sourceRoot ($direction+'-'+$frame+'-native.png')),[System.Drawing.Imaging.ImageFormat]::Png);$native.Dispose()
    if($count -lt 200 -or $top -le 0 -or $bottom -ge 47){throw "Frame $direction/$frame is empty or clips a cell edge"}
    $metrics+=@{direction=$direction;frame=$frame;occupiedPixels=$count;top=$top;bottom=$bottom;lowerRegionWidth=$lowerMax-$lowerMin+1}
   }finally{$src.Dispose()}
  }
 }
 $sheet.Save($(if($PreviewOnly){Join-Path $sourceRoot 'partial-preview.png'}else{Join-Path $destination 'khue.png'}),[System.Drawing.Imaging.ImageFormat]::Png)
 $metrics | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $sourceRoot $(if($PreviewOnly){'metrics-preview.json'}else{'metrics.json'})) -Encoding UTF8
 $metrics | ForEach-Object {[pscustomobject]$_} | Format-Table -AutoSize
}finally{$sheet.Dispose();$old.Dispose()}
