#!/bin/zsh
# Spot art (transparent PNG objects) and app screens -> /art as AVIF + WebP at 1x/2x.
# Usage: scripts/art/export-spots.sh <objects dir> <screens dir>
set -e
O=${0:A:h}/../../art; mkdir -p $O
for f in $1/*.png(N); do n=${${f:t:r}#st-}
  for w in 240 480; do magick $f -strip -trim +repage -resize ${w}x -quality 55 $O/obj-$n-$w.avif; magick $f -strip -trim +repage -resize ${w}x -define webp:alpha-quality=90 -quality 80 $O/obj-$n-$w.webp; done
done
if [ -n "$2" ]; then for f in $2/*.png(N); do n=${f:t:r}
  for w in 390 780; do magick $f -strip -alpha off -resize ${w}x -quality 55 $O/screen-$n-$w.avif; magick $f -strip -alpha off -resize ${w}x -quality 80 $O/screen-$n-$w.webp; done
done; fi
du -sh $O
