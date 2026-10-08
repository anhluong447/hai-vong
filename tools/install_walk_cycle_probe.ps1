# Pack already-generated frames into a sibling sheet, preserving the approved head.
# No pose drawing, mirroring, scaling or runtime changes.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$taskRoot=Split-Path $PSScriptRoot -Parent
$destination=Join-Path $taskRoot 'assets/pixel/pilot-v3'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
$original=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/pilot-v2/khue.png'))
$cycle=[System.Drawing.Bitmap]::FromFile((Join-Path $taskRoot 'assets/pixel/walk-cycle-probe/khue-left-walk-native.png'))
if($original.Width -ne 256 -or $original.Height -ne 384 -or $cycle.Width -ne 256 -or $cycle.Height -ne 48){throw 'Unexpected sheet dimensions'}
$sheet=$original.Clone([System.Drawing.Rectangle]::new(0,0,256,384),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
try{
 for($frame=0;$frame -lt 8;$frame++){
  for($y=0;$y -lt 48;$y++){for($x=0;$x -lt 32;$x++){
   $color=if($y -lt 24){$original.GetPixel($x,240+$y)}else{$cycle.GetPixel($frame*32+$x,$y)}
   $sheet.SetPixel($frame*32+$x,48+$y,$color)
  }}
 }
 $sheet.Save((Join-Path $destination 'khue.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 Write-Output 'Packed pilot-v3/khue.png: new left walk, approved master head, other rows preserved.'
}finally{$sheet.Dispose();$cycle.Dispose();$original.Dispose()}
