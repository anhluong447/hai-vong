$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path $PSScriptRoot -Parent
$target=Join-Path $root 'assets/dialogue/v2/design-refs'
New-Item -ItemType Directory -Force $target | Out-Null
$source=[System.Drawing.Bitmap]::new((Join-Path $root 'assets/pixel/characters-anime-source.png'))
$ids=@('khue','van','long','nhi','ngoc','an','source')
for($row=0;$row -lt 7;$row++){
 $top=[int][Math]::Floor($row*$source.Height/7)
 $bottom=[int][Math]::Floor(($row+1)*$source.Height/7)
 $rect=[System.Drawing.Rectangle]::new(0,$top,384,$bottom-$top)
 $copy=$source.Clone($rect,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $copy.Save((Join-Path $target "$($ids[$row]).png"),[System.Drawing.Imaging.ImageFormat]::Png)
 $copy.Dispose()
}
$source.Dispose()
