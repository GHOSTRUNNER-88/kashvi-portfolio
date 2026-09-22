import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createScope } from 'animejs'

import CharacterCanvas from './CharacterCanvas.jsx'
import {
  curtainProgress,
  enter,
  exit,
  hide,
  linkProgress,
  magnetic,
  moveMarker,
  raiseCurtain,
  splitHeadlines,
  trailingCursor,
} from './animations.js'

/** One screen of scroll each. She stays put; only this copy changes. */
const PANELS = [
  {
    id: 'intro',
    nav: 'Intro',
    side: 'center',
    eyebrow: 'Web developer from Kathmandu',
    head: ['Kashvi', 'Jain.'],
    lede: 'Aspiring software developer building responsive web applications with React, Node.js and Spring Boot and currently reading B.Tech CSE at KIIT University.',
    actions: true,
    aside: {
      label: 'At a glance',
      rows: [
        ['Based', 'New Road, Kathmandu'],
        ['Studying', 'B.Tech CSE · KIIT'],
        ['Stack', 'MERN · Spring Boot'],
        ['Since', '2024'],
      ],
    },
  },
  {
    id: 'about',
    nav: 'About',
    side: 'right',
    eyebrow: '01 About',
    head: ['Always', 'learning.'],
    lede: 'A strong interest in web development and modern technologies. Skilled in building responsive web applications using HTML, CSS, JavaScript and React, with backend experience in Node.js and Spring Boot.',
    note: 'Happiest making real-world projects, picking up new tools, and sharpening problem-solving along the way.',
  },
  {
    id: 'work',
    nav: 'Work',
    side: 'left',
    eyebrow: '02 Selected work',
    head: ['Two things', 'I built.'],
    items: [
      ['ResumeLab', 'MERN · AI', 'An AI-powered resume builder that turns a rough history into a structured, readable CV.'],
      ['Expozia', 'MERN · AI', 'An AI-powered plagiarism detection platform for checking written work at scale.'],
    ],
  },
  {
    id: 'experience',
    nav: 'Experience',
    side: 'right',
    eyebrow: '03 Experience',
    head: ['Independent', 'practice.'],
    items: [
      ['Independent project development', '2025', 'Full-stack development of ResumeLab and Expozia on the MERN stack, end to end.'],
      ['Software development & skill enhancement', '2026', 'DSA practice in C across coding platforms. React on the front end, Node.js and Spring Boot behind it, applying theory to real scenarios.'],
    ],
  },
  {
    id: 'education',
    nav: 'Education',
    side: 'left',
    eyebrow: '04 Education',
    head: ['KIIT', 'University.'],
    items: [
      ['KIIT University', '2024 — 2028', 'B.Tech in Engineering — Computer Science.'],
      ['DAV Sushil Kedia Vishwa Bharati', '2022 — 2024', 'Senior Secondary, Class XII — Science.'],
      ['DAV Sushil Kedia Vishwa Bharati', 'to 2022', 'Secondary, Class X.'],
    ],
  },
  {
    id: 'contact',
    nav: 'Contact',
    side: 'center',
    eyebrow: '05 Contact',
    head: ['Let’s build', 'something.'],
    contact: [
      ['Email', 'kashvijain2910@gmail.com', 'mailto:kashvijain2910@gmail.com'],
      ['Phone', '+91 90381 05437', 'tel:+919038105437'],
      ['Phone', '+977 986 290 5165', 'tel:+9779862905165'],
      ['Location', 'New Road, Kathmandu', null],
    ],
    aside: {
      label: 'Toolkit',
      tags: ['HTML / CSS / JS', 'React', 'Node.js', 'Express', 'MongoDB',
             'Spring Boot', 'C & DSA', 'Microsoft Office'],
    },
  },
]

export default function Portfolio() {
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(0)
  const onReady = useCallback(() => setReady(true), [])
  const root = useRef(null)
  const curtain = useRef(null)
  const navList = useRef(null)
  const chars = useRef(null)
  const shown = useRef(-1)
  const onProgress = useCallback((v) => {
    const bar = curtain.current?.querySelector('.curtain__bar i')
    if (bar) curtainProgress(bar, v)
  }, [])

  // One screen of scroll per panel. Rounding switches at the halfway point,
  // so a panel is fully in place while its screen is the one you are on.
  useEffect(() => {
    // Coalesced into one read per frame: scroll fires far more often than the
    // browser paints, and each one would otherwise measure layout.
    let queued = 0
    const read = () => {
      queued = 0
      setActive(
        Math.min(
          PANELS.length - 1,
          Math.max(0, Math.round(window.scrollY / window.innerHeight)),
        ),
      )
    }
    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(queued)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // Anime.js owns every panel transition. createScope keeps the split DOM, the
  // scroll observer and the pointer handlers tied to this component's lifetime.
  useEffect(() => {
    const scope = createScope({ root }).add(() => {
      const el = root.current
      const [map, undoSplit] = splitHeadlines(el)
      chars.current = map
      el.querySelectorAll('.panel, .aside').forEach(hide)

      const bar = el.querySelector('.progress i')
      if (bar) linkProgress(bar, el)
      const offs = [...el.querySelectorAll('.cta')].map((b) => magnetic(b))
      offs.push(trailingCursor(el.querySelector('.cursor')))

      return () => {
        offs.forEach((off) => off())
        undoSplit()
      }
    })
    return () => scope.revert()
  }, [])

  // Nothing animates until the frames land, so no copy flashes over a blank
  // canvas; after that every change of panel is a handoff.
  useEffect(() => {
    if (!ready || !root.current) return
    if (shown.current === active) return
    const scope = root.current
    if (shown.current < 0 && curtain.current) raiseCurtain(curtain.current, scope)
    // Panels and asides are paired by section: both hand off together.
    const going = scope.querySelector(`.panel[data-i="${shown.current}"]`)
    const coming = scope.querySelector(`.panel[data-i="${active}"]`)
    const goingAside = scope.querySelector(`.aside[data-i="${shown.current}"]`)
    const comingAside = scope.querySelector(`.aside[data-i="${active}"]`)
    for (const el of [going, goingAside]) {
      if (!el) continue
      el.setAttribute('aria-hidden', 'true')
      exit(el, chars.current)
    }
    for (const el of [coming, comingAside]) {
      if (!el) continue
      el.setAttribute('aria-hidden', 'false')
      enter(el, chars.current)
    }
    shown.current = active
  }, [ready, active])

  // Nav item geometry, measured only when the layout can actually change.
  const navBoxes = useRef([])
  useEffect(() => {
    const ul = navList.current
    if (!ul) return
    const measure = () => {
      navBoxes.current = [...ul.querySelectorAll('li')].map((li) => ({
        left: li.offsetLeft,
        width: li.offsetWidth,
      }))
      moveMarker(ul.querySelector('.marker'), navBoxes.current[active - 1])
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const ul = navList.current
    if (ul) moveMarker(ul.querySelector('.marker'), navBoxes.current[active - 1])
  }, [active])

  const goTo = (i) => (e) => {
    e.preventDefault()
    window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' })
  }

  /**
   * Built once. Nothing in a panel depends on which section is current -- the
   * handoff is done imperatively by anime.js and by `aria-hidden` below -- so
   * scrolling never reconciles six sections' worth of DOM.
   */
  const panels = useMemo(
    () =>
      PANELS.map((p, i) => (
        <article key={p.id} id={p.id} className="panel" data-i={i} aria-hidden="true">
          <span className="numeral" aria-hidden="true">
            {String(i).padStart(2, '0')}
          </span>

          <p className="eyebrow">
            <i /> {p.eyebrow}
          </p>

          {i === 0 ? (
            <h1 className="head">
              <span>
                <b>{p.head[0]}</b>
              </span>
              <span>
                <b>
                  <em>{p.head[1]}</em>
                </b>
              </span>
            </h1>
          ) : (
            <h2 className="head">
              <span>
                <b>{p.head[0]}</b>
              </span>
              <span>
                <b>
                  <em>{p.head[1]}</em>
                </b>
              </span>
            </h2>
          )}

          {p.lede && <p className="lede">{p.lede}</p>}
          {p.note && <p className="note">{p.note}</p>}

          {p.items && (
            <ul className="entries">
              {p.items.map(([title, meta, body]) => (
                <li key={title + meta}>
                  <h3>
                    {title}
                    <span>{meta}</span>
                  </h3>
                  <p>{body}</p>
                </li>
              ))}
            </ul>
          )}

          {p.contact && (
            <ul className="contact">
              {p.contact.map(([label, value, href]) => (
                <li key={label + value}>
                  <span>{label}</span>
                  {href ? <a href={href}>{value}</a> : <em>{value}</em>}
                </li>
              ))}
            </ul>
          )}

          {p.actions && (
            <div className="actions">
              <a className="cta" href="#work" onClick={goTo(2)}>
                View selected work
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </a>
              <a className="ghost" href="mailto:kashvijain2910@gmail.com">
                Get in touch
              </a>
            </div>
          )}
        </article>
      )),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /* Whatever flank she is not standing on. Only the centred sections leave
     one, and each fills it with its own facts. */
  const asides = useMemo(
    () =>
      PANELS.map((p, i) =>
        p.aside ? (
          <aside key={p.id} className="aside" data-i={i} aria-hidden="true">
            <p className="label">{p.aside.label}</p>
            {p.aside.rows && (
              <dl>
                {p.aside.rows.map(([term, detail]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{detail}</dd>
                  </div>
                ))}
              </dl>
            )}
            {p.aside.tags && (
              <ul className="tags">
                {p.aside.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </aside>
        ) : null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <main
      ref={root}
      className={`shell${ready ? ' is-ready' : ''}`}
      style={{ '--panels': PANELS.length }}
    >
      {/* Covers the page while 129 frames decode, then wipes up off it. */}
      <div className="curtain" ref={curtain}>
        <p className="curtain__mark">Kashvi Jain</p>
        <p className="curtain__role">Web developer — Kathmandu</p>
        <p className="curtain__bar">
          <i />
        </p>
      </div>

      <div className="cursor" aria-hidden="true" />

      {/* One snap point per section, so a wheel gesture settles on a panel
          instead of leaving the copy stranded halfway through a handoff. */}
      <div className="snaps" aria-hidden="true">
        {PANELS.map((p) => (
          <div key={p.id} />
        ))}
      </div>

      {/* Sticky for the whole scroll: she never moves, the copy does. */}
      <div className="stage">
        <CharacterCanvas
          onReady={onReady}
          onProgress={onProgress}
          side={PANELS[active].side}
        />
        <div className="scrim" />
        <div className="grain" />

        <div className="frame">
          <nav className="top">
            <a className="wordmark" href="#intro" onClick={goTo(0)}>
              Kashvi<span>®</span>
            </a>
            <ul ref={navList}>
              <i className="marker" aria-hidden="true" />
              {PANELS.slice(1).map((p, i) => (
                <li key={p.id}>
                  <a
                    href={`#${p.id}`}
                    onClick={goTo(i + 1)}
                    className={active === i + 1 ? 'is-on' : undefined}
                  >
                    {p.nav}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={`columns is-${PANELS[active].side}`}>
            <div className="panels">{panels}</div>
            <div className="lane" aria-hidden="true" />
            <div className="asides">{asides}</div>
          </div>

          <footer className="bottom">
            <p className="status">
              <i /> Open to internships &amp; freelance
            </p>
           
            <p className="place">kashvijain2910@mail.com</p>
          </footer>

          <div className="progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </main>
  )
}
