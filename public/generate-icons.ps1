# Script para generar iconos PWA en múltiples tamaños
Add-Type -AssemblyName System.Drawing

# Cargar la imagen original
$originalImage = [System.Drawing.Image]::FromFile("sourcingup-logo.jpg")

# Función para redimensionar imagen
function Resize-Image {
    param($image, $width, $height, $outputPath)
    
    $newBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.DrawImage($image, 0, 0, $width, $height)
    
    $newBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $newBitmap.Dispose()
}

# Crear iconos PWA
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    $outputPath = "icons/icon-${size}x${size}.png"
    Resize-Image $originalImage $size $size $outputPath
    Write-Host "Icono generado: $outputPath"
}

# Limpiar
$originalImage.Dispose()

Write-Host "Todos los iconos PWA generados exitosamente!"