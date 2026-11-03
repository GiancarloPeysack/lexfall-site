#!/bin/zsh
# Turns the PNG masters (web_scene.py output + cut-out spot art) into the site's /art files: AVIF + WebP.
# Usage: scripts/art/export.sh <masters dir>
set -e
M=$1; O=${0:A:h}/../../art; mkdir -p $O
q(){ magick "$1" -strip -resize "$2" -quality ${4:-62} "$3"; }
for w in 1280 1920 2880; do
  q $M/hero-landscape.png ${w}x $O/hero-$w.avif 50; q $M/hero-landscape.png ${w}x $O/hero-$w.webp 78
done
# phones: readers, flag and tree only
magick $M/hero-landscape.png -crop 1900x940+1000+0 +repage $M/hero-crop.png
for w in 800 1200; do q $M/hero-crop.png ${w}x $O/hero-m-$w.avif 50; q $M/hero-crop.png ${w}x $O/hero-m-$w.webp 78; done
for w in 1280 2880; do q $M/ridge.png ${w}x $O/ridge-$w.avif 50; q $M/ridge.png ${w}x $O/ridge-$w.webp 78; done
q $M/leaf.png 96x $O/leaf.webp 85
q $M/cloud-1.png 300x $O/cloud-1.webp 85; q $M/cloud-2.png 220x $O/cloud-2.webp 85
ls -la $O | awk '{s+=$5} END {print "total bytes", s}'
