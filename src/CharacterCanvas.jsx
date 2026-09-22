import { useEffect, useRef, useState } from 'react'

import { animate } from 'animejs'

import {
  ANCHORS,
  DEADZONE,
  HYSTERESIS,
  frameIndex,
  lerpAngle,
  layout,
  stepFactor,
} from './tracking.js'

// Never build a backing store finer than the frames themselves. The source is
// 940px tall and the hero draws it at roughly 1.25x that, so at devicePixelRatio
// 2 we were asking the GPU for 5.8 megapixels of detail the image cannot
// supply — three times the fill rate for no visible difference.
const OVERSAMPLE = 1.35

function loadImage(src) {
  const img = new Image()
  img.src = src
  return (img.decode ? img.decode() : Promise.resolve()).then(() => img)
}

/**
 * Cursor-tracked head turn, drawn as a flipbook.
 *
 * Every pose is a pre-baked landscape still (see scripts/extract_frames.py):
 * no video seeking, no CSS 3D, and exactly one opaque drawImage of the
 * character per paint, so there is never a second face blended underneath.
 */
export default function CharacterCanvas({
  onReady,
  onProgress,
  side = 'center',
}) {
  const canvasRef = useRef(null)
  // Anime.js eases this between sections; the draw loop just reads it.
  const slide = useRef({ x: ANCHORS[side] ?? ANCHORS.center, to: side })
  const [meta, setMeta] = useState(null)

  useEffect(() => {
    const s = slide.current
    if (s.to === side) return
    s.to = side
    animate(s, { x: ANCHORS[side] ?? ANCHORS.center, duration: 700, ease: 'outExpo' })
  }, [side])

  useEffect(() => {
    let cancelled = false
    fetch('/frames/manifest.json')
      .then((r) => r.json())
      .then((m) => {
        if (cancelled) return
        document.documentElement.style.setProperty('--backdrop', m.background)
        setMeta(m)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!meta) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })

    let frames = null
    let center = null
    let raf = 0
    let cancelled = false

    const pointer = { x: 0, y: 0, seen: false }
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let angle = -Math.PI / 2 // index 0 of the flipbook: looking up
    let centered = true
    let prev = 0
    let lastKey = ''
    let pixelSize = ''
    let lane = ''

    const onMove = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.seen = true
    }
    // Cursor left the window (or a touch ended): go back to eye contact.
    const onLeave = () => {
      pointer.seen = false
    }

    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      const rect = canvas.getBoundingClientRect()
      const { width: w, height: h } = rect
      if (!w || !h) return

      // Where she is headed. The copy columns are laid out against this, not
      // against the eased position, so the grid settles once per section
      // instead of reflowing on every frame of the slide.
      const mark = layout(w, h, meta, ANCHORS[slide.current.to] ?? ANCHORS.center)

      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.max(1, (meta.height * OVERSAMPLE) / mark.dh),
      )
      const size = `${Math.round(w * dpr)}x${Math.round(h * dpr)}`
      if (size !== pixelSize) {
        pixelSize = size
        ;[canvas.width, canvas.height] = size.split('x').map(Number)
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // resizing wipes ctx state
        // 'high' buys nothing once the backing store is close to the source
        // resolution, and costs real milliseconds on a full-bleed blit.
        ctx.imageSmoothingQuality = 'medium'
        lastKey = ''
      }
      const key = `${Math.round(mark.portraitX)}|${Math.round(mark.portrait)}`
      if (lane !== key) {
        lane = key
        const style = canvas.parentElement.style
        style.setProperty('--lane-x', `${mark.portraitX}px`)
        style.setProperty('--lane', `${mark.portrait}px`)
      }

      const { dx, dy, dw, dh, faceX, faceY } = layout(w, h, meta, slide.current.x)

      if (frames && pointer.seen && !still) {
        const px = pointer.x - rect.left - faceX
        const py = pointer.y - rect.top - faceY
        const radius = DEADZONE * Math.min(w, h)
        centered = Math.hypot(px, py) < radius * (centered ? HYSTERESIS : 1)
        const target = Math.atan2(py, px)
        // First sample snaps; after that it eases. Never swing in from nowhere.
        angle = prev ? lerpAngle(angle, target, stepFactor(now - prev)) : target
      } else {
        centered = true
      }
      prev = now

      const image = centered ? center : frames[frameIndex(angle, meta.count)]
      if (!image) return

      const paint = `${image.src}|${size}|${Math.round(dx)}|${Math.round(dy)}`
      if (paint === lastKey) return // same pixels as last paint; skip the blit
      lastKey = paint

      // Every border of a baked frame is flat wall -- she is dissolved into it
      // well inside the edge -- so any strip of hero the frame does not reach
      // is filled by stretching that border out. Exact, and no second copy of
      // her. Then one opaque draw of the frame. Nothing is alpha-blended.
      const { width: iw, height: ih } = meta
      const right = dx + dw
      const bottom = dy + dh
      ctx.globalAlpha = 1
      ctx.fillStyle = meta.background
      ctx.fillRect(0, 0, w, h) // corners, and a floor under everything
      if (dx > 0) ctx.drawImage(image, 0, 0, 2, ih, 0, dy, dx + 1, dh)
      if (right < w) ctx.drawImage(image, iw - 2, 0, 2, ih, right - 1, dy, w - right + 1, dh)
      if (dy > 0) ctx.drawImage(image, 0, 0, iw, 2, dx, 0, dw, dy + 1)
      if (bottom < h) ctx.drawImage(image, 0, ih - 2, iw, 2, dx, bottom - 1, dw, h - bottom + 1)
      ctx.drawImage(image, dx, dy, dw, dh)
    }

    // Eye contact paints as soon as it lands; the circle arrives behind it.
    // The curtain stays up until every frame has decoded, so the first pointer
    // move can never land on a half-loaded flipbook.
    const total = meta.count + 1
    let done = 0
    const tick = (img) => {
      onProgress?.(++done / total)
      return img
    }
    loadImage('/frames/center.webp')
      .then((img) => {
        if (cancelled) return null
        center = tick(img)
        return Promise.all(
          Array.from({ length: meta.count }, (_, i) =>
            loadImage(`/frames/${String(i).padStart(3, '0')}.webp`).then(tick),
          ),
        )
      })
      .catch(() => null) // a missing frame must not strand the curtain
      .then((all) => {
        if (cancelled) return
        if (all) frames = all
        onReady?.()
      })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [meta, onReady, onProgress])

  return <canvas ref={canvasRef} className="character" aria-hidden="true" />
}
