#!/bin/zsh
# Editorial scenes (App Store set 2026-11-10b, fal.ai art/raw picks) -> /art as AVIF + WebP at 600/1200w.
# Usage: scripts/art/export-scenes.sh ~/Downloads/Lexfall-listenfix-sdk58/design/store/2026-11-10b/art/raw
set -e
O=${0:A:h}/../../art; mkdir -p $O
for f in $1/*.png(N); do n=${${f:t:r}%%__*}
  for w in 600 1200; do
    magick $f -strip -resize ${w}x -quality 50 $O/scene-$n-$w.avif
    magick $f -strip -resize ${w}x -quality 76 $O/scene-$n-$w.webp
  done
done
du -ch $O/scene-* | tail -1
