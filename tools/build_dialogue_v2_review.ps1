$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$registry=Get-Content -Encoding UTF8 (Join-Path $root 'assets/dialogue/manifest.json') -Raw | ConvertFrom-Json
$ids=@('khue','van','long','nhi','ngoc','an','groundskeeper','teacher','harbor-source')
$canvas=[System.Drawing.Bitmap]::new(828,1320)
$g=[System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::FromArgb(24,33,44))
$font=[System.Drawing.Font]::new('Arial',14)
for($i=0;$i -lt $ids.Count;$i++){
 $x=($i%3)*276;$y=[Math]::Floor($i/3)*440
 $file=$registry.characters.($ids[$i]).expressions.neutral
 $image=[System.Drawing.Bitmap]::new((Join-Path $root "assets/dialogue/$file"))
 $g.DrawString($ids[$i],$font,[System.Drawing.Brushes]::White,$x+8,$y+3)
 $g.DrawImage($image,[System.Drawing.Rectangle]::new($x,$y+26,276,414))
 $image.Dispose()
}
$g.Dispose();$font.Dispose()
$canvas.Save((Join-Path $PSScriptRoot 'dialogue-v2-pose-review.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
# The expression sheet uses the same full-width, y0..650 crop for every cell.
# These are inspection artifacts; no game asset is edited or recentered.
$canvas=[System.Drawing.Bitmap]::new(768,1302)
$g=[System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::FromArgb(24,33,44))
$font=[System.Drawing.Font]::new('Arial',12)
$expressions=@('neutral','happy','serious')
for($row=0;$row -lt 7;$row++){for($col=0;$col -lt 3;$col++){
 $id=if($row -eq 6){'khue'}else{$ids[$row]}
 $expression=if($row -eq 6){@('investigate','lead_found','questioning')[$col]}else{$expressions[$col]}
 $key="$id-$expression"
 $file=$registry.characters.($id).expressions.($expression)
 $path=Join-Path $root "assets/dialogue/$file"
 if(-not(Test-Path -LiteralPath $path)){continue}
 $image=[System.Drawing.Bitmap]::new($path)
 $g.DrawString($key,$font,[System.Drawing.Brushes]::White,$col*256+8,$row*186+3)
 $g.DrawImage($image,[System.Drawing.Rectangle]::new($col*256,$row*186+24,256,162),0,0,1024,650,[System.Drawing.GraphicsUnit]::Pixel)
 $image.Dispose()
}}
$g.Dispose();$font.Dispose()
$canvas.Save((Join-Path $PSScriptRoot 'dialogue-v2-expression-review.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
