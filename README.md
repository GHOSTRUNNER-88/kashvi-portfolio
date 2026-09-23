# Kashvi Jain — portfolio

A one-page portfolio for a web developer in Kathmandu. The character is sticky
for the whole scroll — she never moves, only the copy beside her changes — and
her head follows the cursor around a full 360°. Park the cursor on her face and
she looks straight at you.

```bash
npm install
npm run dev:all    # starts both Backend API (5000) & Vite Frontend (5173)
npm run server     # starts Backend API only (http://localhost:5000)
npm run dev        # starts Vite frontend only (http://localhost:5173)
npm test           # tracking math & unit tests
npm run frames     # re-bake flipbook from mp4 (python + opencv)
npm run build      # production build
```

## Admin Management Console (`/admin`)

Access the full portfolio admin dashboard at `http://localhost:5173/admin`:
- **Default Username**: `admin`
- **Default Password**: `admin123`

Features in Admin:
- **Profile & Bio**: Live update name, title, contact coords, lede, about statements, and at-a-glance rows.
- **Projects**: Full CRUD with auto slug generator, tech stack tag chips, cover uploader, body paragraphs, highlights, and links.
- **Experience**: Edit practice history, highlights, and timelines.
- **Education**: Add and reorder academic degrees and institutions.
- **Toolkit & Skills**: Reorder, add and remove skill chips.
- **Messages Inbox**: View visitor inquiries, filter unread, reply directly via email, and manage contacts.
- **Settings & Backup**: Change credentials, download complete JSON backup, restore data, or reset to defaults.


## Structure

`src/Portfolio.jsx` holds the whole page. `PANELS` at the top is the content —
intro, about, work, experience, education, toolkit & contact — one screen of
scroll each, all read off the CV. Edit that array and the nav, the index rail
and the scroll length all follow.

The shell is `PANELS.length * 100svh` tall with a single `position: sticky`
stage inside it, so the character and the page chrome hold still while the
panels cross-fade. A scroll listener rounds `scrollY / innerHeight` to the
active index; everything else is CSS transitions off that one class. No
scroll library, no observer.

She also moves between sections — centre, right, left — and the copy takes
whichever flank she left. Each panel declares a `side`; the renderer eases her
there and publishes her real box as `--lane-x` / `--lane`, which is what the
grid cuts its columns from, so the copy is never guessing where she is.

`src/CharacterCanvas.jsx` and `src/tracking.js` are the character.

## Motion

`src/animations.js` holds the choreography, all of it Anime.js v4:

- **Curtain** — covers the page while 129 frames decode, its hairline filling
  with real decode progress, then wipes up off a page that is already painted.
- **Headlines** — `splitText` splits every headline once on mount; characters
  lift out of the CSS line mask on a 17 ms stagger with a touch of rotation,
  and drop back through it on the way out. The exit is the entrance reversed,
  not a dissolve.
- **Panels** — a `createTimeline` per change: rule draws, ghost numeral drifts
  up, headline lifts, body blocks rise, list rows wipe open from the edge their
  text is set against.
- **Progress** — the bottom hairline is linked to scroll position with
  `onScroll({ sync: true })`, not driven by a timer.
- **Nav** — one underline that slides between items rather than each drawing
  its own.
- **Pointer** — a ring that trails the cursor and opens over anything
  clickable, and a magnetic call-to-action, both `createAnimatable`.
- **Her slide** — `animate()` on a plain object; the canvas draw loop reads it.

Everything is 2D — opacity, scale, translate — so nothing ever puts a 3D
context over the canvas. `reducedMotion()` short-circuits every one of them,
and `createScope` ties the split DOM, the scroll observer and the pointer
handlers to the component's lifetime.

## How the head turn works

The source clip (`public/character.mp4`) is a generated MP4 with a single
keyframe, so `video.currentTime` seeking stalls the browser and `play()` runs
uncontrolled. Nothing touches the video at runtime. Instead:

1. **`npm run frames`** (`scripts/extract_frames.py`, OpenCV) walks the clip and
   resolves the head-turn trajectory to 128 stills, 2.8° apart, plus
   `center.webp` for eye contact — into `public/frames/`, with a
   `manifest.json` carrying the count, the backdrop colour, and where her face
   sits in the frame.
2. **`src/CharacterCanvas.jsx`** preloads and decodes all 129, then runs a
   `requestAnimationFrame` loop: `atan2` from her face to the cursor, a
   shortest-path circular lerp toward it, nearest frame index, and **one
   opaque `drawImage`**. No alpha blending between poses, so no double face.

No CSS 3D anywhere: no `perspective`, no `rotateX`/`rotateY`. The page and her
body do not move — only the drawn head turns.

### Why the frames are landscape

The source is a 720×1280 portrait, and below row ~855 her sweater fills it edge
to edge. Reaching that border sideways at runtime to cover a wide hero smeared
two brown slabs across the page — there was no backdrop left in those rows to
reach with.

So the extractor builds each frame as a 2400×940 landscape plate instead. It
reads the red wall's colour along every row at each edge separately (a high
percentile, so a wisp of hair reaching in cannot drag it), extends it outward
with a gentle bounded vignette, and dissolves whatever approaches a side border
— widening as it goes down, which leaves her torso intact in the middle. The
last rows go entirely, so all four borders of every frame are flat wall. The
renderer stretches those borders to cover any strip the frame does not reach,
which is now exact.

The frame is sized so its own bottom lands on the bottom of the hero, putting
that dissolve in the last few percent where the scrim already darkens.

### Re-tuning after a new clip

`COMPASS` in `scripts/extract_frames.py` maps the eight screen directions to
source frame numbers, read off a contact sheet. Regenerate one with
`python scripts/extract_frames.py --sheet`, re-read the numbers, then re-run
the extractor.

Its last entry closes the circle. The clip sweeps UP → clockwise → UP-LEFT and
then eases back to neutral, so it never gets back to UP on its own, and cutting
UP-LEFT straight to UP popped visibly at the top of the circle. The entry
`(270, 272)` instead runs past the end of the clip and wraps into frames 0..32,
which is the clip's own uninterrupted path from UP-LEFT through neutral to UP —
she glances back at the camera as the cursor crosses straight overhead, with
nothing to jump.

Knobs, all in `src/tracking.js`:

- `RESPONSE` (0.26) — how hard the head chases the cursor each 60 Hz frame.
  The loop renormalises it for high-refresh displays.
- `DEADZONE` (0.12) — the eye-contact radius, as a fraction of the shorter
  viewport edge. `HYSTERESIS` widens the exit so a cursor on the boundary
  cannot strobe.
- `WIDE_VIEW` / `NARROW_VIEW` — how tall to draw the frame and where her face
  lands. `cap` limits how much of the viewport width she may take, so a
  squarish window does not let her swallow the page.

### Cost

129 WebP frames, 5.5 MB total, all preloaded before tracking starts;
`center.webp` paints first so the hero is never blank. Drop `FRAMES` to 64 in
the extractor to halve it, at the cost of 5.6° steps instead of 2.8°.
