# Import the generated Khuê/Vân pilot with one shared scale and a fixed row pivot.
# Only grid slicing, nearest-neighbor sampling and palette indexing; no drawing.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$destination=Join-Path $root 'assets/pixel/pilot-v2'
$palette=@('202634','303c51','465c78','687d98','3b292d','624438','91624e','ba8a62','7f5142','bb805e','e5ae7c','f6cf9e','ffe2b7','74888d','a8bab5','d6ddd0','f6f1dc','163e43','245d5c','38817a','73b2a0','1d343e','334956','576a70','301e25','65442c','a47a46','d9b473','f3d46f','738359','acb489','b9515c') | ForEach-Object {[System.Drawing.ColorTranslator]::FromHtml("#$_")}
$sources=@{}
try {
 foreach($id in @('khue','van')){
  $image=[System.Drawing.Bitmap]::FromFile((Join-Path $destination "$id-source.png"))
  $rowEdges=@(0)
  for($edge=1;$edge -lt 8;$edge++){
   $nominal=[int][Math]::Round($edge*$image.Height/8);$best=$nominal;$bestCount=[int]::MaxValue;$bestDistance=[int]::MaxValue
   for($y=[Math]::Max(0,$nominal-48);$y -le [Math]::Min($image.Height-1,$nominal+48);$y++){
    $count=0;for($x=0;$x -lt $image.Width;$x++){if($image.GetPixel($x,$y).A -ge 160){$count++}}
    $distance=[Math]::Abs($y-$nominal)
    if($count -lt $bestCount -or ($count -eq $bestCount -and $distance -lt $bestDistance)){$best=$y;$bestCount=$count;$bestDistance=$distance}
   }
   $rowEdges+=$best
  }
  $rowEdges+=$image.Height
  $rows=@();$maxHeight=0
  for($row=0;$row -lt 8;$row++){
   $top=$rowEdges[$row+0];$bottom=$rowEdges[$row+1];$minY=$bottom;$maxY=$top
   for($y=$top;$y -lt $bottom;$y++){for($x=0;$x -lt $image.Width;$x++){if($image.GetPixel($x,$y).A -ge 160){$minY=[Math]::Min($minY,$y);$maxY=[Math]::Max($maxY,$y)}}}
   $rows+=@{top=$top;bottom=$bottom;min=$minY;max=$maxY}
   $maxHeight=[Math]::Max($maxHeight,$maxY-$minY+1)
  }
  # Register the whole column grid once from the first/last front-facing head.
  # This corrects generator-wide margin drift; individual frames are not moved.
  $centers=@()
  foreach($column in @(0,7)){
   $left=[int][Math]::Floor($column*$image.Width/8);$right=[int][Math]::Floor(($column+1)*$image.Width/8)
   $minX=$right;$maxX=$left
   for($y=$rows[0].min;$y -lt $rows[0].min+45;$y++){for($x=$left;$x -lt $right;$x++){if($image.GetPixel($x,$y).A -ge 160){$minX=[Math]::Min($minX,$x);$maxX=[Math]::Max($maxX,$x)}}}
   $centers+=($minX+$maxX)/2
  }
  $sources[$id]=@{image=$image;rows=$rows;height=$maxHeight;firstCenter=$centers[0];spacing=($centers[1]-$centers[0])/7}
 }
 # A single scale for both characters and every direction/pose. Hair width
 # never enters this calculation, so Vân cannot shrink because of long hair.
 $height=($sources.Values | ForEach-Object {$_.height} | Measure-Object -Maximum).Maximum
 $scale=42/$height
 foreach($id in @('khue','van')){
  $source=$sources[$id];$image=$source.image
  $output=New-Object System.Drawing.Bitmap(256,384,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $cache=@{}
  try{
   for($row=0;$row -lt 8;$row++){
    $rowInfo=$source.rows[$row]
    for($column=0;$column -lt 8;$column++){
     $center=$source.firstCenter+$column*$source.spacing
     for($py=0;$py -lt 48;$py++){for($px=0;$px -lt 32;$px++){
      $sx=[int][Math]::Floor($center+($px-15.5)/$scale)
      $sy=[int][Math]::Floor($rowInfo.max+($py-45)/$scale)
      if($sx -lt [Math]::Max(0,$center-$source.spacing/2) -or $sx -ge [Math]::Min($image.Width,$center+$source.spacing/2) -or $sy -lt $rowInfo.top -or $sy -ge $rowInfo.bottom){continue}
      $color=$image.GetPixel($sx,$sy);if($color.A -lt 160){continue}
      $key=$color.ToArgb()
      if(!$cache.ContainsKey($key)){
       $best=$palette[0];$score=[double]::PositiveInfinity
       foreach($candidate in $palette){$delta=($color.R-$candidate.R)*($color.R-$candidate.R)*.3+($color.G-$candidate.G)*($color.G-$candidate.G)*.59+($color.B-$candidate.B)*($color.B-$candidate.B)*.11;if($delta -lt $score){$score=$delta;$best=$candidate}}
       $cache[$key]=$best
      }
      $output.SetPixel($column*32+$px,$row*48+$py,$cache[$key])
     }}
    }
   }
   $output.Save((Join-Path $destination "$id.png"),[System.Drawing.Imaging.ImageFormat]::Png)
   Write-Output "$id : 64 frames, shared scale $scale, source row edges $($source.rows.top -join ',')"
  }finally{$output.Dispose()}
 }
}finally{foreach($source in $sources.Values){$source.image.Dispose()}}
