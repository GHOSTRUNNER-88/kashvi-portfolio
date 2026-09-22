/** Pure geometry + easing behind the cursor-tracked head. No DOM, no React. */

export const TAU = Math.PI * 2

// How far the head closes the gap to the cursor each 60 Hz frame. 0.26 lands
// inside ~35 ms, which reads as "no lag" without the overshoot a spring gives.
export const RESPONSE = 0.26
// Cursor inside this fraction of min(w, h) around her face -> eye contact.
export const DEADZONE = 0.12
// Leave the deadzone later than you enter it, so a cursor resting on the edge
// cannot strobe between the neutral frame and a turned one.
export const HYSTERESIS = 1.3
// Below this width she centres and the copy stacks under her.
export const NARROW = 900
// Where she stands for a given panel. Moving her between sections gives the
// copy the whole opposite side to itself.
export const ANCHORS = { center: 0.5, right: 0.7, left: 0.3 }
// How fast she slides between those, per 60 Hz frame. Slower than the head,
// so the move reads as a considered shift rather than a snap.
export const SLIDE = 0.085
// How tall to draw the frame relative to the hero, and where on the stage her
// face should land. The frames are landscape with her dissolved into the wall
// well inside every border, so any gap left over is filled by stretching that
// border -- which is why these are free to place her wherever looks right.
// `cap` is the most of the viewport width she is ever allowed to take: on a
// squarish window, scaling by height alone would have her swallow the page.
export const WIDE_VIEW = { zoom: 1, x: 0.5, y: 0.5, cap: 0.42 }
export const NARROW_VIEW = { zoom: 1, x: 0.5, y: 0.34, cap: 0.95 }

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/** Shortest way round the circle from `a` to `b`, `t` of the way there. */
export function lerpAngle(a, b, t) {
  const d = ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI
  return a + d * t
}

/**
 * Per-frame easing factor, renormalised from 60 Hz to the real frame time, so
 * a 120 Hz display is not twice as twitchy as a 60 Hz one.
 */
export function factor(deltaMs, response) {
  return 1 - (1 - response) ** clamp(deltaMs / (1000 / 60), 0, 4)
}

export const stepFactor = (deltaMs) => factor(deltaMs, RESPONSE)

/**
 * Flipbook index for a screen-space angle. Index 0 is -90deg (looking up) and
 * runs clockwise, matching the order scripts/extract_frames.py writes.
 */
export function frameIndex(angle, count) {
  const k = Math.round(((angle + Math.PI / 2) / TAU) * count)
  return ((k % count) + count) % count
}

/**
 * Where to blit the frame: height-scaled but width-capped, placed by her face.
 * `anchorX` overrides the view's default x, which is how she slides between
 * sections. Narrow screens ignore it and keep her centred.
 */
export function layout(w, h, meta, anchorX) {
  const view = w < NARROW ? NARROW_VIEW : WIDE_VIEW
  const x = w < NARROW || anchorX == null ? view.x : anchorX
  const aspect = meta.width / meta.height
  const dh = Math.min(h * view.zoom, (view.cap * w) / (meta.portrait * aspect))
  const dw = dh * aspect
  const dx = x * w - meta.face.x * dw
  const dy = view.y * h - meta.face.y * dh
  // Her own box inside the frame, which is what the copy columns flank.
  const portrait = meta.portrait * dw
  return {
    dx, dy, dw, dh,
    faceX: x * w,
    faceY: view.y * h,
    portrait,
    portraitX: dx + ((1 - meta.portrait) / 2) * dw,
  }
}
