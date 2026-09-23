/**
 * Anime.js choreography for the page. Everything here is 2D — opacity, scale
 * and translate only — so nothing ever puts a 3D context over the character
 * canvas, whose own head-tracking loop is the one thing anime.js never drives.
 */
import {
  animate,
  createAnimatable,
  createTimeline,
  onScroll,
  splitText,
  stagger,
} from 'animejs'

const OUT = 'outExpo'
const ROWS = '.entries li, .tags li, .contact li, .aside dl div'

export const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * The timeline currently owning each panel. Scrolling fast enough to skip a
 * section would otherwise leave an old exit running, and its onComplete would
 * hide a panel that had already come back in.
 */
const owner = new WeakMap()

/**
 * The pieces of each panel, looked up once. A section change used to re-run
 * five querySelectorAll calls per panel while the wheel was still moving.
 */
const parts = new WeakMap()

function partsOf(panel) {
  let found = parts.get(panel)
  if (!found) {
    found = {
      rule: panel.querySelector('.eyebrow i'),
      eyebrow: panel.querySelector('.eyebrow'),
      numeral: panel.querySelector('.numeral'),
      heads: [...panel.querySelectorAll('.head b')],
      body: blocks(panel).filter((el) => !el.classList.contains('eyebrow')),
      rows: [...panel.querySelectorAll(ROWS)],
      // A panel's side never changes, so which edge its rows wipe from is
      // settled the first time it appears.
      fromRight: !!panel.closest('.is-left'),
    }
    parts.set(panel, found)
  }
  return found
}

/** Direct children of a panel that animate as one block. */
const blocks = (panel) =>
  [...panel.children].filter(
    (el) =>
      !el.classList.contains('head') &&
      !el.classList.contains('numeral') &&
      !el.matches('ul'),
  )

/**
 * Split every headline into characters once, up front. The `.head span` masks
 * in CSS do the clipping, so a character rising from 115% appears to lift out
 * of the line rather than fade in on top of it.
 *
 * Returns a revert function; splitText rewrites the DOM and must be undone.
 */
export function splitHeadlines(root) {
  const heads = [...root.querySelectorAll('.head b')]
  const splits = heads.map((b) => splitText(b, { chars: true, words: true }))
  const chars = new Map(heads.map((b, i) => [b, splits[i].chars]))
  return [chars, () => splits.forEach((s) => s.revert())]
}

/** Park a panel off-stage without animating it. */
export function hide(panel) {
  panel.style.visibility = 'hidden'
  panel.style.pointerEvents = 'none'
  panel.style.opacity = '0'
}

export function show(panel) {
  panel.style.visibility = 'visible'
  panel.style.pointerEvents = 'auto'
  panel.style.opacity = '1'
}

/**
 * Bring a panel in: the rule draws, the ghost numeral drifts up behind it, the
 * headline characters lift out of their mask, then the body and the list rows
 * wipe open underneath.
 */
export function enter(panel, chars) {
  owner.get(panel)?.cancel()
  show(panel)
  if (reducedMotion()) return null

  const tl = createTimeline({ defaults: { ease: OUT } })
  owner.set(panel, tl)
  const { rule, eyebrow, numeral, heads, body, rows, fromRight } = partsOf(panel)

  tl.set(panel, { opacity: 1, translateY: 0 })
  if (numeral)
    tl.add(
      numeral,
      { opacity: [0, 1], translateY: [48, 0], scale: [1.1, 1], duration: 820 },
      0,
    )
  if (rule) tl.add(rule, { scaleX: [0, 1], duration: 420 }, 30)
  if (eyebrow)
    tl.add(eyebrow, { opacity: [0, 1], translateY: [10, 0], duration: 380 }, 50)

  heads.forEach((b, i) => {
    const set = chars?.get(b)
    if (!set) return
    tl.add(
      set,
      {
        translateY: ['115%', '0%'],
        rotate: [2.5, 0],
        opacity: [0, 1],
        duration: 620,
        delay: stagger(11),
      },
      70 + i * 60,
    )
  })

  if (body.length)
    tl.add(
      body,
      { opacity: [0, 1], translateY: [22, 0], duration: 520, delay: stagger(52) },
      210,
    )

  if (rows.length) {
    // Rows wipe open from the edge their text is set against, so the reveal
    // runs with the reading direction on both sides of her.
    const shut = fromRight ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)'
    tl.add(
      rows,
      {
        opacity: [0, 1],
        translateY: [20, 0],
        clipPath: [shut, 'inset(0 0 0 0)'],
        duration: 520,
        delay: stagger(38),
      },
      260,
    )
  }

  return tl
}

/**
 * Take a panel out. The headline drops back through its mask character by
 * character while the rest lifts and fades, so the exit reads as the reverse
 * of the entrance instead of a plain dissolve.
 */
export function exit(panel, chars) {
  owner.get(panel)?.cancel()
  if (reducedMotion()) {
    hide(panel)
    return null
  }
  panel.style.pointerEvents = 'none'

  const tl = createTimeline({ defaults: { ease: 'inQuad' } })
  owner.set(panel, tl)
  partsOf(panel).heads.forEach((b) => {
    const set = chars?.get(b)
    if (set)
      tl.add(
        set,
        {
          translateY: ['0%', '-115%'],
          opacity: [1, 0],
          duration: 240,
          delay: stagger(6),
        },
        0,
      )
  })
  tl.add(
    panel,
    {
      opacity: [1, 0],
      translateY: [0, -18],
      duration: 260,
      onComplete: () => {
        if (owner.get(panel) !== tl) return // a newer entrance took over
        panel.style.visibility = 'hidden'
        panel.style.transform = ''
      },
    },
    40,
  )
  return tl
}

/**
 * The loading curtain lifting, then the page chrome arriving behind it. The
 * page is already painted underneath, so this is a wipe rather than a fade.
 */
export function raiseCurtain(curtain, root) {
  const bits = root.querySelectorAll('.top, .bottom')
  const done = () => {
    curtain.style.display = 'none'
  }
  if (reducedMotion()) {
    done()
    bits.forEach((el) => {
      el.style.opacity = '1'
    })
    return null
  }

  return createTimeline()
    .add(curtain.children, {
      opacity: [1, 0],
      translateY: [0, -16],
      duration: 320,
      ease: 'inQuad',
      delay: stagger(40),
    })
    .add(
      curtain,
      {
        clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'],
        duration: 620,
        ease: 'inOutQuart',
        onComplete: done,
      },
      '-=120',
    )
    .add(
      bits,
      {
        opacity: [0, 1],
        translateY: [18, 0],
        duration: 620,
        ease: OUT,
        delay: stagger(70),
      },
      '-=400',
    )
}

/**
 * Grades the page to a section's colour.
 *
 * The red wall is photographed into the frames and cannot be keyed out — her
 * lips and warm skin sit too close to it — so the section colour lands on the
 * scrim over the flanks, on the accents, and as a light wash over the whole
 * stage, rather than replacing the backdrop she stands against.
 */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))

// Flat numbers, not arrays: anime.js tweens numeric properties, and handing it
// an array is what made it throw `str.match is not a function`.
const grade = { r: 58, g: 10, b: 6, gr: 233, gg: 195, gb: 147 }

export function tintTo(el, tint, gold) {
  const [r, g, b] = tint.split(' ').map(Number)
  const [gr, gg, gb] = hex(gold)
  const to = { r, g, b, gr, gg, gb }
  const write = () => {
    const n = (v) => Math.round(v)
    el.style.setProperty('--tint-rgb', `${n(grade.r)} ${n(grade.g)} ${n(grade.b)}`)
    el.style.setProperty('--gold', `rgb(${n(grade.gr)} ${n(grade.gg)} ${n(grade.gb)})`)
  }
  if (reducedMotion()) {
    Object.assign(grade, to)
    write()
    return null
  }
  return animate(grade, { ...to, duration: 620, ease: 'outQuad', onUpdate: write })
}

/** Fills the curtain's hairline as the frames decode. */
export function curtainProgress(bar, value) {
  animate(bar, { scaleX: value, duration: 420, ease: 'outQuad' })
}

/** Scroll-linked progress hairline: driven by scroll position, not a timer. */
export function linkProgress(bar, shell) {
  return animate(bar, {
    scaleX: [0, 1],
    ease: 'linear',
    autoplay: onScroll({
      target: shell,
      enter: 'top top',
      leave: 'bottom bottom',
      sync: true,
    }),
  })
}

/**
 * Slides the nav underline to whichever item is current. Takes measurements
 * rather than elements: reading offsetLeft here would force a layout in the
 * middle of a wheel gesture.
 */
export function moveMarker(marker, box) {
  if (!marker || !box) return
  const to = { translateX: box.left, width: box.width, opacity: 1 }
  if (reducedMotion()) {
    Object.assign(marker.style, {
      transform: `translateX(${to.translateX}px)`,
      width: `${to.width}px`,
      opacity: '1',
    })
    return
  }
  animate(marker, { ...to, duration: 380, ease: 'outExpo' })
}

/** A button that leans toward the cursor and springs back when it leaves. */
export function magnetic(el, pull = 0.28) {
  if (reducedMotion()) return () => {}
  const box = createAnimatable(el, { x: 420, y: 420, ease: 'outQuad' })
  const move = (e) => {
    const r = el.getBoundingClientRect()
    box.x((e.clientX - r.left - r.width / 2) * pull)
    box.y((e.clientY - r.top - r.height / 2) * pull)
  }
  const reset = () => {
    box.x(0)
    box.y(0)
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', reset)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', reset)
    box.revert()
  }
}

/**
 * A ring that trails the pointer and opens up over anything clickable. Skipped
 * on touch, where there is no pointer to trail.
 */
export function trailingCursor(ring) {
  if (reducedMotion() || !matchMedia('(hover: hover)').matches) return () => {}
  const dot = createAnimatable(ring, { x: 110, y: 110, scale: 320, ease: 'outQuad' })
  const move = (e) => {
    ring.style.opacity = '1'
    dot.x(e.clientX)
    dot.y(e.clientY)
  }
  const over = (e) => dot.scale(e.target.closest('a, button') ? 2.1 : 1)
  const leave = () => {
    ring.style.opacity = '0'
  }
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('pointerover', over, { passive: true })
  document.addEventListener('pointerleave', leave)
  return () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerover', over)
    document.removeEventListener('pointerleave', leave)
    dot.revert()
  }
}
