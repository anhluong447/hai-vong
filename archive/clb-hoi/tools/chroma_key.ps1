# Chroma Key Green-Screen Remover for Portraits
# Converts green-screen character images to transparent PNGs with despill & anti-aliased edges.
param(
    [string]$InputPath,
    [string]$OutputPath,
    [float]$LowThreshold = 20.0,
    [float]$HighThreshold = 55.0
)

$csharpCode = @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class GreenScreenRemover {
    public static void Process(string inputPath, string outputPath, float lowThreshold, float highThreshold) {
        using (var src = new Bitmap(inputPath)) {
            var rect = new Rectangle(0, 0, src.Width, src.Height);
            using (var dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb)) {
                var srcData = src.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
                var dstData = dst.LockBits(rect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int bytes = Math.Abs(srcData.Stride) * src.Height;
                byte[] srcBuffer = new byte[bytes];
                byte[] dstBuffer = new byte[bytes];
                Marshal.Copy(srcData.Scan0, srcBuffer, 0, bytes);

                for (int i = 0; i < bytes; i += 4) {
                    byte b = srcBuffer[i];
                    byte g = srcBuffer[i + 1];
                    byte r = srcBuffer[i + 2];

                    // Chroma key: compare green against max(red, blue)
                    float maxRB = Math.Max(r, b);
                    float diff = g - maxRB;

                    float alpha = 1.0f;
                    if (diff > highThreshold) {
                        alpha = 0.0f;
                    } else if (diff > lowThreshold) {
                        alpha = 1.0f - ((diff - lowThreshold) / (highThreshold - lowThreshold));
                    }

                    // Despill green fringe around hair/edges
                    byte newG = g;
                    if (g > maxRB) {
                        newG = (byte)maxRB;
                    }

                    dstBuffer[i] = b;
                    dstBuffer[i + 1] = (byte)(newG * alpha + g * (1.0f - alpha));
                    dstBuffer[i + 2] = r;
                    dstBuffer[i + 3] = (byte)(alpha * 255.0f);
                }

                Marshal.Copy(dstBuffer, 0, dstData.Scan0, bytes);
                src.UnlockBits(srcData);
                dst.UnlockBits(dstData);

                dst.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
'@

if (-not ([System.Management.Automation.PSTypeName]'GreenScreenRemover').Type) {
    Add-Type -TypeDefinition $csharpCode -ReferencedAssemblies System.Drawing
}

if ($InputPath -and $OutputPath) {
    [GreenScreenRemover]::Process($InputPath, $OutputPath, $LowThreshold, $HighThreshold)
    Write-Host "Processed $InputPath -> $OutputPath"
}
