# Mechanical atlas import only: crop the generated grid, align feet, pack frames.
# Character artwork is generated with imagegen; this script does not draw it.
param([string]$Source = 'assets/pixel/characters-anime-source.png')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$inputImage = [System.Drawing.Bitmap]::FromFile((Join-Path $root $Source))
$outputImage = New-Object System.Drawing.Bitmap(288,252,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($outputImage)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
try {
 # The generator may space rows unevenly. Split at the least occupied scanline
 # near each nominal boundary so shoes from one row never leak into the next.
 $rowEdges=@(0)
 for ($edge=1; $edge -lt 7; $edge++) {
  $nominal=[int][Math]::Round($edge*$inputImage.Height/7);$best=$nominal;$bestCount=[int]::MaxValue;$bestDistance=[int]::MaxValue
  for ($y=$nominal-14; $y -le $nominal+14; $y++) {
   $count=0;for ($x=0;$x -lt $inputImage.Width;$x++){if($inputImage.GetPixel($x,$y).A -ge 160){$count++}}
   $distance=[Math]::Abs($y-$nominal)
   if ($count -lt $bestCount -or ($count -eq $bestCount -and $distance -lt $bestDistance)) {$best=$y;$bestCount=$count;$bestDistance=$distance}
  }
  $rowEdges += $best
 }
 $rowEdges += $inputImage.Height
 Write-Output "Source row boundaries: $($rowEdges -join ', ')"
 for ($row=0; $row -lt 7; $row++) {
  $top=$rowEdges[$row]
  $bottom=$rowEdges[$row+1]
  $colEdges=@(0)
  for ($edge=1; $edge -lt 12; $edge++) {
   $nominal=[int][Math]::Round($edge*$inputImage.Width/12);$best=$nominal;$bestCount=[int]::MaxValue;$bestDistance=[int]::MaxValue
   for ($x=[Math]::Max(0,$nominal-25); $x -le [Math]::Min($inputImage.Width-1,$nominal+25); $x++) {
    $count=0;for ($y=$top;$y -lt $bottom;$y++){if($inputImage.GetPixel($x,$y).A -ge 160){$count++}}
    $distance=[Math]::Abs($x-$nominal)
    if ($count -lt $bestCount -or ($count -eq $bestCount -and $distance -lt $bestDistance)) {$best=$x;$bestCount=$count;$bestDistance=$distance}
   }
   $colEdges += $best
  }
  $colEdges += $inputImage.Width

  $cells = @()
  for ($column=0; $column -lt 12; $column++) {
   $left=$colEdges[$column]
   $right=$colEdges[$column+1]
   $minX=$right; $minY=$bottom; $maxX=$left; $maxY=$top
   for ($y=$top; $y -lt $bottom; $y++) {for ($x=$left; $x -lt $right; $x++) {
    if ($inputImage.GetPixel($x,$y).A -ge 160) {
     $minX=[Math]::Min($minX,$x); $maxX=[Math]::Max($maxX,$x)
     $minY=[Math]::Min($minY,$y); $maxY=[Math]::Max($maxY,$y)
    }
   }}
   if ($maxX -le $minX -or $maxY -le $minY) {throw "Empty frame $row,$column"}
   $cells += [System.Drawing.Rectangle]::new($minX,$minY,$maxX-$minX+1,$maxY-$minY+1)
  }
  $maxWidth=($cells | Measure-Object Width -Maximum).Maximum
  $maxHeight=($cells | Measure-Object Height -Maximum).Maximum
  $scale=[Math]::Min(22/$maxWidth,34/$maxHeight)
  for ($column=0; $column -lt 12; $column++) {
   $cell=$cells[$column]; $width=[int][Math]::Round($cell.Width*$scale); $height=[int][Math]::Round($cell.Height*$scale)
   $target=[System.Drawing.Rectangle]::new($column*24+[int][Math]::Floor((24-$width)/2),$row*36+35-$height,$width,$height)
   $graphics.DrawImage($inputImage,$target,$cell,[System.Drawing.GraphicsUnit]::Pixel)
  }
 }
 # Sprites use binary alpha, avoiding soft fringes against grass/night backgrounds.
 for ($y=0; $y -lt $outputImage.Height; $y++) {for ($x=0; $x -lt $outputImage.Width; $x++) {
  $color=$outputImage.GetPixel($x,$y)
  if ($color.A -lt 160) {$outputImage.SetPixel($x,$y,[System.Drawing.Color]::Transparent)}
  else {$outputImage.SetPixel($x,$y,[System.Drawing.Color]::FromArgb(255,$color.R,$color.G,$color.B))}
 }}
 $outputImage.Save((Join-Path $root 'assets/pixel/characters-anime.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 Write-Output 'Imported 84 transparent anime frames: 288x252, cells 24x36.'
} finally {$graphics.Dispose();$outputImage.Dispose();$inputImage.Dispose()}
