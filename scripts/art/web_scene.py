"""Web art for lexfall.app, rendered from the App Store creative scene kit (Editorial Flat).
Reuses ~/Downloads/Lexfall/app/design/store/2026-10-29-creative/scene.py so the site and the store
header share one drawing. Sky is transparent, so the page colour (light or dark) shows through.
Run: python3.14 scripts/art/web_scene.py <out dir>   (writes PNG masters; scripts/art/export.sh makes webp/avif)"""
import math, os, sys
from PIL import Image
KIT = os.path.expanduser('~/Downloads/Lexfall/app/design/store/2026-10-29-creative')
sys.path.insert(0, KIT)
import scene as S

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
W, H = 3840, 1646
K = 1.0
u = lambda v: v * K
OW = u(7)

# ---- hero landscape: hills, pines, path, flag, tree, readers on the book stack (header.py layout) ----
front = S.Pen(W, H)
far = S.draw_hill(front, u(1170), [(u(60), u(1500), 0.4), (u(28), u(610), 1.3)], S.TAN_L, OW)
mid = S.draw_hill(front, u(1290), [(u(60), u(1900), 2.6), (u(24), u(700), 0.2)], S.SLATE, OW)
for x, h in ((300, 150), (380, 110), (700, 130), (1760, 120), (1830, 165), (3260, 140), (3340, 110), (3620, 170)):
    S.draw_pine(front, u(x), mid(u(x)) + u(6), u(h), OW)
near = S.draw_hill(front, u(1460), [(u(45), u(2300), 3.6), (u(16), u(800), 1.0)], S.GREEN, OW)
FLX = u(2020)
path = S.catmull([(u(1820), u(1700)), (u(1990), u(1600)), (u(1850), u(1530)), (u(2000), u(1470)), (FLX + u(10), mid(FLX) + u(16))])
S.draw_path(front, path, u(84), u(22), OW)
for x, h in ((160, 230), (860, 190), (3100, 180), (3700, 240)):
    S.draw_pine(front, u(x), near(u(x)) + u(8), u(h), OW)
TX, TY = u(2470), u(1010)
S.draw_trunk(front, TX, near(TX) + u(10), TY + u(120), OW, u(52), u(30))
front = front.done()

c = Image.new('RGBA', (W, H), (0, 0, 0, 0))
c.alpha_composite(front)
canopy, spawn = S.tree_canopy(u(330), OW)
S.paste_rot(c, canopy, TX, TY, 0)
READERS = S.Readers(os.path.join(KIT, 'art', 'cut', 'organic.png'), u(720))
SX = u(1450) - READERS.size[0] / 2; SY = near(u(1450)) + u(70) - READERS.size[1]
READERS.draw(c, SX, SY, 0.0, u(9))
fx, fy = FLX, mid(FLX) + u(14)
fl = Image.new('RGBA', (round(u(200)), round(u(260))), (0, 0, 0, 0)); fp = S.Pen(fl.width, fl.height, 3)
fp.line([(u(14), fl.height - u(4)), (u(14), u(20))], u(9))
fp.poly(S.flag_points(u(18), u(26), u(130), u(80), 0.0), S.BRICK, OW * 0.8)
c.alpha_composite(fp.done(), (round(fx - u(14)), round(fy - fl.height + u(4))))
# a few leaves resting on the tree (static); falling ones are CSS
SMALL = S.leaf_sprite(u(80), OW * 0.7)
top = min(y for y in range(H) if c.getchannel('A').crop((0, y, W, y + 1)).getbbox())
hero = c.crop((0, top - 20, W, H))
hero.save(os.path.join(OUT, 'hero-landscape.png'))
print('hero', hero.size, 'top', top, 'tree centre y in crop', TY - (top - 20), 'readers x', SX, 'tree x', TX)

# ---- footer ridge: low hills, pines, the path and flag on the right, no figures ----
FW, FH = 3840, 520
p = S.Pen(FW, FH)
a = S.draw_hill(p, 210, [(40, 1500, 1.1), (18, 610, 0.3)], S.TAN_L, OW)
b = S.draw_hill(p, 300, [(46, 1900, 0.2), (20, 700, 2.0)], S.SLATE, OW)
for x, h in ((240, 120), (330, 90), (1500, 110), (2900, 130), (3000, 95)):
    S.draw_pine(p, x, b(x) + 6, h, OW)
nn = S.draw_hill(p, 420, [(34, 2300, 1.4), (14, 800, 2.2)], S.GREEN, OW)
for x, h in ((120, 170), (1150, 150), (3560, 190)):
    S.draw_pine(p, x, nn(x) + 8, h, OW)
FX = 3200
pp = S.catmull([(3020, 560), (3150, 500), (3060, 440), (3170, 380), (FX + 8, b(FX) + 14)])
S.draw_path(p, pp, 70, 18, OW)
ridge = p.done()
fl = Image.new('RGBA', (200, 260), (0, 0, 0, 0)); fp = S.Pen(200, 260, 3)
fp.line([(14, 256), (14, 20)], 9)
fp.poly(S.flag_points(18, 26, 130, 80, 0.0), S.BRICK, OW * 0.8)
ridge.alpha_composite(fp.done(), (FX - 14, round(b(FX) + 14 - 260 + 4)))
rt = min(y for y in range(FH) if ridge.getchannel('A').crop((0, y, FW, y + 1)).getbbox())
ridge = ridge.crop((0, max(0, rt - 10), FW, FH))
ridge.save(os.path.join(OUT, 'ridge.png')); print('ridge', ridge.size)

# ---- sprites: leaf (full stop + falling), clouds ----
S.leaf_sprite(160, 6).save(os.path.join(OUT, 'leaf.png'))
for i, w in enumerate((300, 220)):
    S.cloud_sprite(w, 6).save(os.path.join(OUT, f'cloud-{i + 1}.png'))
print('sprites ok')
