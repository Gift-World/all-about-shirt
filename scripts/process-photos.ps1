# Resizes the Instagram photos into web sizes and makes two real crops per product photo:
#   <code>.jpg (1100px)  <code>-sm.jpg (520px)
#   <code>-d.jpg  detail crop (900px)   <code>-d-sm.jpg
#   <code>-f.jpg  fabric close up (700px) <code>-f-sm.jpg
# Also samples the main colour of the centre of each photo into scripts/ig/colours.json.
# usage: powershell -File scripts/process-photos.ps1 <rawDir>
param([string]$Raw)
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$plan = Get-Content (Join-Path $root 'scripts/ig/plan.json') -Raw | ConvertFrom-Json
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }

function Save([System.Drawing.Image]$src, [System.Drawing.RectangleF]$crop, [int]$maxW, [string]$out, [long]$q) {
  $w = [Math]::Min($maxW, [int]$crop.Width)
  $h = [int]([double]$crop.Height * $w / $crop.Width)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $dest = New-Object System.Drawing.RectangleF 0, 0, $w, $h
  $g.DrawImage($src, $dest, $crop, [System.Drawing.GraphicsUnit]::Pixel)
  $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $q
  $bmp.Save($out, $codec, $ep)
  $g.Dispose(); $bmp.Dispose()
}

$colours = @{}
$n = 0
foreach ($it in $plan) {
  $src = Join-Path $Raw "$($it.house)/$($it.code).jpg"
  if (-not (Test-Path $src)) { continue }
  $dir = Join-Path $root "public/p/$($it.house)"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $img = [System.Drawing.Image]::FromFile($src)
  $W = $img.Width; $H = $img.Height
  $full = New-Object System.Drawing.RectangleF 0, 0, $W, $H
  $base = Join-Path $dir $it.code
  Save $img $full 1100 "$base.jpg" 80
  Save $img $full 520 "$base-sm.jpg" 74
  if ($it.crops) {
    # detail: 58% of the frame, a little above centre where collars and waistbands sit
    $cw = $W * 0.58; $ch = $cw * 4 / 3
    if ($ch -gt $H) { $ch = $H; $cw = $ch * 3 / 4 }
    $d = New-Object System.Drawing.RectangleF (($W - $cw) / 2), ([Math]::Max(0, [Math]::Min($H - $ch, $H * 0.42 - $ch / 2))), $cw, $ch
    Save $img $d 900 "$base-d.jpg" 80
    Save $img $d 520 "$base-d-sm.jpg" 74
    # fabric: a tight 26% square from the middle shows the weave
    $fw = $W * 0.26
    $f = New-Object System.Drawing.RectangleF (($W - $fw) / 2), (($H - $fw * 0.75) / 2), $fw, ($fw * 0.75)
    Save $img $f 700 "$base-f.jpg" 82
    Save $img $f 400 "$base-f-sm.jpg" 76
  }
  # average colour of the centre 30%
  $s = New-Object System.Drawing.Bitmap 12, 12
  $g = [System.Drawing.Graphics]::FromImage($s)
  $g.DrawImage($img, (New-Object System.Drawing.RectangleF 0, 0, 12, 12), (New-Object System.Drawing.RectangleF ($W * 0.35), ($H * 0.35), ($W * 0.3), ($H * 0.3)), [System.Drawing.GraphicsUnit]::Pixel)
  $r = 0; $gg = 0; $b = 0
  for ($x = 0; $x -lt 12; $x++) { for ($y = 0; $y -lt 12; $y++) { $p = $s.GetPixel($x, $y); $r += $p.R; $gg += $p.G; $b += $p.B } }
  $colours[$it.code] = @([int]($r / 144), [int]($gg / 144), [int]($b / 144))
  $g.Dispose(); $s.Dispose(); $img.Dispose()
  $n++
}
$colours | ConvertTo-Json -Compress | Set-Content -Encoding utf8 (Join-Path $root 'scripts/ig/colours.json')
"processed $n photos"
