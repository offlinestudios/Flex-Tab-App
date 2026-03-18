"""
Generates a stylised cardio/runner graphic as a PNG.
  - scripts/cardio_graphic.png  (for inspection)
  - scripts/cardio_graphic.b64  (data URI for embedding in satori)
"""
import base64, io
from PIL import Image, ImageDraw, ImageFilter

W, H = 920, 640
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# ── Ring (centered slightly right) ───────────────────────────────────────────
cx, cy = W // 2 + 70, H // 2 + 10
R_OUTER = 255
R_INNER = 210

# Faint background fill
d.ellipse([cx-R_OUTER, cy-R_OUTER, cx+R_OUTER, cy+R_OUTER], fill=(59,130,246,20))
d.ellipse([cx-R_INNER, cy-R_INNER, cx+R_INNER, cy+R_INNER], fill=(0,0,0,0))

# Thick progress arc — 270° (75% complete)
for r in range(R_INNER+4, R_OUTER-4, 3):
    d.arc([cx-r, cy-r, cx+r, cy+r], start=-90, end=180,
          fill=(59,130,246,185), width=3)

# ── Speed streaks ─────────────────────────────────────────────────────────────
sx = cx - R_OUTER - 5
for i, (y_off, length, alpha, lw) in enumerate([
    (-105, 270, 145, 6), (-58, 310, 165, 5), (-10, 330, 185, 5),
    (38,  300, 165, 4),  (85,  250, 135, 3), (128, 195, 105, 2),
]):
    d.line([sx, cy + y_off, sx - length, cy + y_off],
           fill=(59,130,246,alpha), width=lw)
    d.line([sx - length, cy + y_off, sx - length - 45, cy + y_off],
           fill=(59,130,246, alpha // 4), width=max(1, lw - 1))

# ── Runner — scaled to fit inside ring (R_INNER = 210px radius) ──────────────
# Hip anchor at ring center; scale so figure height ~360px fits in 420px diameter
S = 0.88   # scale factor applied to all offsets
rx, ry = cx, cy + 30   # hip center (slightly below ring center)

def pt(dx, dy):
    return (rx + int(dx * S), ry + int(dy * S))

def poly(*coords, alpha=220):
    d.polygon([pt(x, y) for x, y in coords], fill=(59,130,246,alpha))

def ell(x0, y0, x1, y1, alpha=225):
    p = [pt(x0,y0), pt(x1,y1)]
    d.ellipse([p[0][0], p[0][1], p[1][0], p[1][1]], fill=(59,130,246,alpha))

# Head
ell(-20, -215, 20, -167, alpha=235)
# Neck
poly((-5,-167),(5,-167),(4,-148),(-4,-148), alpha=225)
# Torso (slight forward lean)
poly((-14,-145),(10,-145),(18,-22),(-8,-22), alpha=225)

# Left arm — back, elbow bent
poly((-10,-125),(4,-112),(-48,-52),(-62,-65), alpha=215)   # upper arm
poly((-48,-52),(-62,-65),(-88,5),(-74,18), alpha=205)      # forearm

# Right arm — forward and high
poly((6,-125),(20,-112),(58,-178),(44,-191), alpha=215)     # upper arm
poly((58,-178),(44,-191),(72,-215),(86,-202), alpha=205)    # forearm

# Left leg — back, push-off
poly((-8,-22),(6,-22),(-22,90),(-36,90), alpha=225)        # thigh
poly((-22,90),(-36,90),(-68,178),(-54,178), alpha=215)     # shin
poly((-68,178),(-54,178),(-40,192),(-88,192), alpha=205)   # foot

# Right leg — knee drive, forward
poly((6,-22),(20,-22),(52,68),(38,68), alpha=225)           # thigh
poly((38,68),(52,68),(44,158),(30,158), alpha=215)          # shin
poly((30,158),(44,158),(64,172),(22,172), alpha=205)        # foot

# ── Ground shadow ─────────────────────────────────────────────────────────────
glow = Image.new("RGBA", (W, H), (0,0,0,0))
gd = ImageDraw.Draw(glow)
p0, p1 = pt(-105, 192), pt(80, 205)
gd.ellipse([p0[0], p0[1], p1[0], p1[1]], fill=(59,130,246,40))
glow = glow.filter(ImageFilter.GaussianBlur(15))
img = Image.alpha_composite(img, glow)

# ── Save ──────────────────────────────────────────────────────────────────────
buf = io.BytesIO()
img.save(buf, format="PNG")
b64 = base64.b64encode(buf.getvalue()).decode()
data_uri = "data:image/png;base64," + b64

with open("scripts/cardio_graphic.b64", "w") as f:
    f.write(data_uri)
img.save("scripts/cardio_graphic.png")
print(f"Done. Base64 size: {len(b64)} chars")
