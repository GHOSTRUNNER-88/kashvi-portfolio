/** node scripts/tracking.test.mjs -- guards the cursor-tracking math. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  DEADZONE, HYSTERESIS, NARROW, NARROW_VIEW, TAU, WIDE_VIEW,
  frameIndex, layout, lerpAngle, stepFactor,
} from '../src/tracking.js'

const meta = JSON.parse(readFileSync(new URL('../public/frames/manifest.json', import.meta.url)))
const N = meta.count
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !== ${b}`)

// --- the flipbook is a full circle, in the order the extractor wrote it ----
assert.equal(N, 128)
for (const [deg, expected] of [[-90, 0], [-45, 16], [0, 32], [45, 48],
                               [90, 64], [135, 80], [180, 96], [225, 112]]) {
  assert.equal(frameIndex((deg * Math.PI) / 180, N), expected, `${deg}deg`)
}
// Wrapping must land back on 0, not on 64 or -1.
assert.equal(frameIndex(-Math.PI / 2 + TAU, N), 0)
assert.equal(frameIndex(-Math.PI / 2 - 0.0001, N), 0)
assert.equal(frameIndex(-Math.PI / 2 - TAU / N, N), N - 1)
for (let i = 0; i < 2000; i++) {
  const idx = frameIndex((i / 2000) * 8 * TAU - 4 * TAU, N)
  assert.ok(Number.isInteger(idx) && idx >= 0 && idx < N)
}

// --- lerpAngle takes the short way round -----------------------------------
near(lerpAngle(0, Math.PI / 2, 0), 0)
near(lerpAngle(0, Math.PI / 2, 1), Math.PI / 2)
// 170deg -> -170deg is 20deg clockwise through the wrap, not 340deg back.
const wrapped = lerpAngle((170 * Math.PI) / 180, (-170 * Math.PI) / 180, 0.5)
near((wrapped * 180) / Math.PI, 180)
// Never takes the long way: one step can never exceed half a turn.
for (let i = 0; i < 360; i++) {
  const a = (i * Math.PI) / 180
  for (let j = 0; j < 360; j += 7) {
    const b = (j * Math.PI) / 180
    assert.ok(Math.abs(lerpAngle(a, b, 1) - a) <= Math.PI + 1e-9)
  }
}

// --- response speed, and independence from refresh rate --------------------
const settle = (ms) => {
  let gap = 1
  for (let t = 0; t < ms; t += 1000 / 60) gap *= 1 - stepFactor(1000 / 60)
  return gap
}
// RESPONSE 0.26 halves the gap every ~38ms and is all but closed by 120ms.
assert.ok(settle(40) < 0.5, `40ms should halve the gap, left ${settle(40)}`)
assert.ok(settle(120) < 0.12, `120ms should be near-closed, left ${settle(120)}`)
assert.ok(settle(16) > 0.6, 'a single frame must ease, not snap')
const at60 = (1 - stepFactor(1000 / 60)) ** 2 // two 60Hz frames
const at120 = (1 - stepFactor(1000 / 120)) ** 4 // same wall time at 120Hz
assert.ok(Math.abs(at60 - at120) < 1e-9, 'refresh rate must not change speed')
assert.ok(stepFactor(5000) <= 1, 'a long tab stall must not overshoot')

// --- layout: her face lands where asked, at a sane size ------------------
for (const [w, h] of [[1920, 1080], [1440, 900], [3440, 1440], [1280, 1024],
                      [900, 1200], [390, 844], [768, 1024], [1000, 620]]) {
  const { dx, dy, dw, dh, faceX, faceY } = layout(w, h, meta)
  const view = w < NARROW ? NARROW_VIEW : WIDE_VIEW
  near(faceX, view.x * w, 1e-9)
  near(faceY, view.y * h, 1e-9)
  assert.ok(dh <= h * view.zoom + 1e-9, `zoom exceeded at ${w}x${h}`)
  near(dw / dh, meta.width / meta.height, 1e-9)
  // Her face must land inside the hero, or the cursor angle is meaningless.
  assert.ok(faceX > 0 && faceX < w && faceY > 0 && faceY < h, `face off-stage at ${w}x${h}`)
  // The portrait inside the frame, at screen scale. Big enough to read as the
  // subject, never so big it swallows the copy beside it.
  const { portrait } = layout(w, h, meta)
  assert.ok(portrait > w * 0.2, `portrait too small at ${w}x${h}: ${portrait}`)
  assert.ok(portrait <= w * view.cap + 1e-6, `portrait too big at ${w}x${h}: ${portrait}`)
  // Any strip the frame misses gets filled by stretching its own flat border,
  // so gaps are allowed. What must not happen is the maths collapsing: the
  // frame always spans the hero horizontally, and stays a sane share of it
  // vertically however odd the window shape.
  assert.ok(dw >= w - 1e-6, `frame narrower than the hero at ${w}x${h}`)
  assert.ok(dh > h * 0.25 && dh < h * 2, `frame height off at ${w}x${h}: ${dh}`)
  assert.ok(dx < w && dy < h && dx + dw > 0 && dy + dh > 0, `frame off-stage at ${w}x${h}`)
}

// --- deadzone hysteresis cannot strobe -------------------------------------
const radius = DEADZONE * Math.min(1920, 1080)
const centered = (was, dist) => dist < radius * (was ? HYSTERESIS : 1)
assert.equal(centered(false, radius * 1.1), false, 'must not enter early')
assert.equal(centered(true, radius * 1.1), true, 'must not leave early')
// Sitting exactly on the entry edge holds whatever state it already had.
assert.equal(centered(true, radius * 0.999), true)
assert.equal(centered(false, radius * 0.999), true)

console.log('tracking: all checks passed')
