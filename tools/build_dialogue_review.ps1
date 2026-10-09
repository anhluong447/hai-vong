$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Split-Path $PSScriptRoot -Parent
$ids = @('khue','van','long','nhi','ngoc','an')
$expressions = @('neutral','happy','serious')
$canvas = [System.Drawing.Bitmap]::new(768,1116)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.Clear([System.Drawing.Color]::FromArgb(24,33,44))
$font = [System.Drawing.Font]::new('Arial',12)
for($row=0;$row -lt $ids.Count;$row++) {
 for($col=0;$col -lt $expressions.Count;$col++) {
  $key = "$($ids[$row])-$($expressions[$col])"
  $image = [System.Drawing.Bitmap]::new((Join-Path $root "assets/dialogue/v1/$key.png"))
  # Identical fixed crop for comparison only; game files are left untouched.
  $dest = [System.Drawing.Rectangle]::new($col*256,$row*186+24,256,162)
  $g.DrawImage($image,$dest,0,0,1024,650,[System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawString($key,$font,[System.Drawing.Brushes]::White,$col*256+8,$row*186+3)
  $image.Dispose()
 }
}
$g.Dispose();$font.Dispose()
$canvas.Save((Join-Path $PSScriptRoot '../archive/development/reviews/dialogue-expression-review.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$canvas.Dispose()
