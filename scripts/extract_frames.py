"""Bake public/character.mp4 into a circular head-turn flipbook.

Generated MP4s carry a single keyframe, so `video.currentTime` seeking stalls
hard in the browser. We resolve the whole 360 deg circle to still WebPs here,
once, and the runtime just blits one of them.

Each output frame is LANDSCAPE: the source is a 720x1280 portrait whose lower
third is filled edge to edge by her sweater, so there is no backdrop left to
extend sideways at runtime -- stretching that edge is what smeared two brown
slabs across the hero. Instead we do it properly here: measure the red wall
along each row, extend it outward with its own damped gradient, and dissolve
her torso into it before it reaches the frame edge. The result tiles the whole
viewport with real pixels and needs no runtime fill.

    python scripts/extract_frames.py            # extract
    python scripts/extract_frames.py --sheet    # contact sheet, to re-verify
                                                # COMPASS against the video

Outputs public/frames/{000..127}.webp, center.webp and manifest.json.
"""

import json
import pathlib
import sys

import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
VIDEO = ROOT / "public" / "character.mp4"
OUT = ROOT / "public" / "frames"

FRAMES = 128                # 360 / 128 == 2.8 deg per step
QUALITY = 88
NEUTRAL = slice(0, 8)       # the clip opens on the eye-contact pose

# Landscape canvas and where the portrait sits in it.
# The frame is sized so its own bottom lands on the bottom of the hero: all
# 940 kept rows are on screen, nothing of her is wasted, and the dissolve that
# has to happen sits in the last few percent where the scrim already darkens.
OUT_W, OUT_H = 2400, 940
KEEP = 940                  # source rows composited (below that is all sweater)
SOFT_FROM = 790             # from here down, whatever nears a side border is
EDGE_MAX = 300              # softened away over up to this many px
FADE = 865                  # and from here down she goes entirely
FEATHER = 20                # baseline feather at the portrait's own edges
MARGIN = 28                 # width of the strip each row's wall is read from
VIGNETTE = 15               # how much the extended wall darkens outward, 0-255
VIG_SPAN = 420.0            # px over which that darkening reaches its full

# Screen-space gaze angle (atan2(dy, dx), y down: -90 is up, 0 is right) ->
# position in the clip, in source frames. Read off a contact sheet; regenerate
# one with --sheet if the video is ever re-rendered.
#
# The clip sweeps UP -> clockwise -> UP-LEFT and then eases back to neutral, so
# it never closes the circle on its own. Cutting UP-LEFT straight back to UP
# put a visible jump at the top of the circle. Instead the last arc runs on
# past frame 239 and wraps into frames 0..32, which is the clip's own
# uninterrupted path from UP-LEFT through neutral to UP: she glances back at
# the camera as the cursor crosses straight overhead, with nothing to pop.
COMPASS = [
    (-90, 32),    # UP
    (-45, 69),    # UP-RIGHT
    (0, 101),     # RIGHT
    (45, 146),    # DOWN-RIGHT
    (90, 170),    # DOWN
    (135, 185),   # DOWN-LEFT
    (180, 206),   # LEFT
    (225, 223),   # UP-LEFT
    (270, 272),   # UP again (272 == frame 32 of the next lap)
]

NAMES = ["UP", "UP_RIGHT", "RIGHT", "DOWN_RIGHT", "DOWN",
         "DOWN_LEFT", "LEFT", "UP_LEFT"]


def read_video(path):
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(f)
    cap.release()
    if not frames:
        sys.exit(f"could not decode {path}")
    return frames, fps


def smooth(a, sigma=11):
    """Gaussian blur down a column of per-row colours."""
    k = cv2.getGaussianKernel(int(sigma * 4) | 1, sigma).ravel()
    pad = len(k) // 2
    return np.stack(
        [np.convolve(np.pad(a[:, c], (pad, pad), "edge"), k, "valid")
         for c in range(a.shape[1])], axis=1)


def wall_edges(frame):
    """Per-row colour of the red wall at the left and right frame edges.

    Read separately per side: the two edges differ by a couple of units, and
    averaging them together is what printed a faint rectangle around the
    portrait. A high percentile rather than a mean, because the wall is the
    brightest thing in the margin -- a wisp of hair reaching in drags a mean
    down and streaks the whole extended row. Once her shoulder fills the margin
    for good there is no wall left to read, so the last clean row is held from
    there down; by then she is dissolving into it anyway.
    """
    img = frame.astype(np.float32)
    sides = []
    for sl in (slice(0, MARGIN), slice(-MARGIN, None)):
        strip = np.percentile(img[:, sl], 80, axis=1)
        # The clean upper rows define what this wall looks like; a row that has
        # lost either its brightness or its saturation has her in it. Hair
        # catching the light lifts green without touching red, so test both.
        ref_r = np.median(strip[100:700, 2])
        ref_sat = np.median(strip[100:700, 2] - strip[100:700, 1])
        bad = (strip[:, 2] < ref_r - 6) | (strip[:, 2] - strip[:, 1] < ref_sat - 12)
        run = np.convolve(bad[400:], np.ones(6), "valid")
        hit = np.flatnonzero(run >= 6)
        cut = 400 + hit[0] - 24 if len(hit) else len(strip)   # back off, be safe
        rows = np.flatnonzero(~bad[:cut])
        for c in range(3):                      # patch any isolated gaps
            strip[:, c] = np.interp(np.arange(len(strip)), rows, strip[rows, c])
        sides.append(smooth(strip))
    return sides


def landscape(frame):
    """Composite one source frame onto the wide canvas."""
    img = frame.astype(np.float32)
    h, w = img.shape[:2]
    left, right = wall_edges(frame)
    x0 = (OUT_W - w) // 2
    canvas = np.empty((OUT_H, OUT_W, 3), np.float32)

    # One vignette for the whole canvas, measured outward from the portrait:
    # zero at its edges, so nothing can step there. The lit wall really is
    # brightest behind her, so this continues the falloff rather than stopping
    # it dead and leaving her in a faintly lighter box.
    x = np.arange(OUT_W, dtype=np.float32)
    out = np.maximum(np.maximum(x0 - x, x - (x0 + w - 1)), 0)
    vig = (VIGNETTE * (1 - np.exp(-out / VIG_SPAN)))[None, :, None]

    # Left and right of the portrait each reach out with their own row colour;
    # the wall varies under 3% across the frame, so that is exact at the join.
    t = np.linspace(0, 1, OUT_W, dtype=np.float32)[None, :, None]
    wall_rows = np.clip(np.arange(OUT_H), 0, KEEP - 1)
    canvas[:] = left[wall_rows][:, None, :] * (1 - t) + right[wall_rows][:, None, :] * t
    canvas[:, :x0] = left[wall_rows][:, None, :]
    canvas[:, x0 + w:] = right[wall_rows][:, None, :]
    canvas -= vig

    # Drop the portrait in. Her sweater fills the source frame edge to edge
    # below row ~855, and a border pixel that is her rather than wall is what
    # smeared brown slabs across the hero, so anything approaching a side
    # border gets dissolved -- widening as it goes down, which leaves her
    # torso intact in the middle -- and the last rows go entirely, so the
    # frame's own bottom edge is wall for the renderer to stretch from.
    ys = np.arange(KEEP, dtype=np.float32)
    xs = np.arange(w, dtype=np.float32)
    step = lambda v: v * v * (3 - 2 * np.clip(v, 0, 1))
    grow = step(np.clip((ys - SOFT_FROM) / (KEEP - SOFT_FROM), 0, 1))
    soft = FEATHER + (EDGE_MAX - FEATHER) * grow
    ax = step(np.clip(np.minimum(xs, w - 1 - xs)[None, :] / soft[:, None], 0, 1))
    ay = step(np.clip((KEEP - ys) / (KEEP - FADE), 0, 1))
    alpha = (ax * ay[:, None])[:, :, None]
    band = (slice(0, KEEP), slice(x0, x0 + w))
    canvas[band] = img[:KEEP] * alpha + canvas[band] * (1 - alpha)

    return np.clip(canvas, 0, 255).astype(np.uint8)


def contact_sheet(frames, cell=176):
    """One labelled thumbnail per source frame, for eyeballing COMPASS."""
    cols, ch = 10, round(cell * 750 / 720)
    rows = -(-len(frames) // cols)
    sheet = np.full((rows * ch, cols * cell, 3), 30, np.uint8)
    for i, f in enumerate(frames):
        t = cv2.resize(f[80:830], (cell, ch), interpolation=cv2.INTER_AREA)
        cv2.putText(t, str(i), (3, 16), cv2.FONT_HERSHEY_SIMPLEX, .5, (255,) * 3, 2)
        r, c = divmod(i, cols)
        sheet[r * ch:(r + 1) * ch, c * cell:(c + 1) * cell] = t
    path = OUT.parent / "contact-sheet.jpg"
    cv2.imwrite(str(path), sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"contact sheet -> {path}")


def main():
    frames, fps = read_video(VIDEO)
    h, w = frames[0].shape[:2]
    print(f"{VIDEO.name}: {len(frames)} frames, {fps:g} fps, "
          f"{len(frames) / fps:.2f}s, {w}x{h}")

    OUT.mkdir(parents=True, exist_ok=True)
    if "--sheet" in sys.argv:
        contact_sheet(frames)
        return

    degrees, sources = zip(*COMPASS)
    if list(sources) != sorted(sources):
        sys.exit("COMPASS source frames must increase with angle")
    wanted = np.linspace(-90, 270, FRAMES, endpoint=False)
    # The last arc runs past the end of the clip and wraps into its own start.
    picks = np.interp(wanted, degrees, sources).round().astype(int) % len(frames)

    for old in OUT.glob("*.webp"):
        old.unlink()
    enc = [cv2.IMWRITE_WEBP_QUALITY, QUALITY]
    for i, src in enumerate(picks):
        cv2.imwrite(str(OUT / f"{i:03d}.webp"), landscape(frames[src]), enc)
    # Median of the opening frames: same pose, less encoder noise.
    neutral = np.median(np.array(frames[NEUTRAL]), axis=0).astype(np.uint8)
    cv2.imwrite(str(OUT / "center.webp"), landscape(neutral), enc)

    size = sum(p.stat().st_size for p in OUT.glob("*.webp")) / 1e6
    print(f"\n{FRAMES} frames + center -> {OUT}  "
          f"({OUT_W}x{OUT_H}, {size:.2f} MB)")
    print("\n  dir           deg  idx  src")
    for k in range(0, FRAMES, FRAMES // 8):
        print(f"  {NAMES[k // (FRAMES // 8)]:<12}{wanted[k]:5.0f}  {k:3d} {picks[k]:4d}")

    b, g, r = np.median(landscape(neutral)[:4].reshape(-1, 3), axis=0).astype(int)
    manifest = {
        "count": FRAMES,
        "width": OUT_W,
        "height": OUT_H,
        "background": "#%02x%02x%02x" % (r, g, b),
        # Pivot cursor angles on her eyes, not the image centre. Normalised.
        "face": {"x": round(((OUT_W - w) // 2 + 0.497 * w) / OUT_W, 4),
                 "y": round(0.368 * h / OUT_H, 4)},
        # Fraction of the frame's width that is actually her, so the renderer
        # can size her against the viewport instead of against the wall.
        "portrait": round(w / OUT_W, 4),
        "sources": picks.tolist(),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"\nbackground {manifest['background']}  face {manifest['face']}"
          f"\n-> {OUT / 'manifest.json'}")


if __name__ == "__main__":
    main()
