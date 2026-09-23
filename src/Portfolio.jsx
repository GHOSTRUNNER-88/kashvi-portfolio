import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { createScope } from 'animejs'

import CharacterCanvas from './CharacterCanvas.jsx'
import ContactModal from './components/ContactModal.jsx'
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
  tintTo,
  trailingCursor,
} from './animations.js'
import { usePortfolioData } from './context/DataContext.jsx'

export default function Portfolio() {
  const { profile, projects, experience, education, skills } = usePortfolioData()
  const [ready, setReady] = useState(false)
  const [active, setActive] = useState(0)
  const [contactModalOpen, setContactModalOpen] = useState(false)
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

  // Construct dynamic PANELS from live data context
  const PANELS = useMemo(() => {
    const nameParts = (profile.name || 'Kashvi Jain').trim().split(' ')
    const firstName = nameParts[0] || 'Kashvi'
    const lastName = nameParts.slice(1).join(' ') || 'Jain'

    return [
      {
        id: 'intro',
        nav: 'Intro',
        side: 'center',
        tint: '58 10 6',
        gold: '#e9c393',
        eyebrow: `${profile.role || 'Web developer'} from ${profile.city?.split(',')[0] || 'Kathmandu'}`,
        head: [firstName, `${lastName}.`],
        lede: profile.intro,
        actions: true,
        aside: { label: 'At a glance', rows: profile.glance || [] },
      },
      {
        id: 'about',
        nav: 'About',
        side: 'right',
        tint: '44 14 48',
        gold: '#e6b6d2',
        eyebrow: '01 About',
        head: ['Always', 'learning.'],
        lede: profile.about,
        note: profile.aboutNote,
      },
      {
        id: 'work',
        nav: 'Work',
        side: 'left',
        tint: '10 42 46',
        gold: '#9ee0dc',
        eyebrow: '02 Selected work',
        head: [projects.length > 0 ? `${projects.length} things` : 'Things', 'I built.'],
        items: projects,
        to: '/work',
      },
      {
        id: 'experience',
        nav: 'Experience',
        side: 'right',
        tint: '54 30 8',
        gold: '#f0c98a',
        eyebrow: '03 Experience',
        head: ['Independent', 'practice.'],
        items: experience,
        to: '/experience',
      },
      {
        id: 'education',
        nav: 'Education',
        side: 'left',
        tint: '14 30 56',
        gold: '#a9c8f0',
        eyebrow: '04 Education',
        head: [education[0]?.title?.split(' ')[0] || 'KIIT', (education[0]?.title?.split(' ').slice(1).join(' ') || 'University') + '.'],
        items: education,
      },
      {
        id: 'contact',
        nav: 'Contact',
        side: 'center',
        tint: '52 10 22',
        gold: '#f0aeb4',
        eyebrow: '05 Contact',
        head: ['Let’s build', 'something.'],
        contact: [
          ['Email', profile.email, `mailto:${profile.email}`],
          ...(profile.phones || []).map((n) => ['Phone', n, `tel:${n.replace(/\s/g, '')}`]),
          ['Location', profile.city, null],
        ],
        aside: { label: 'Toolkit', tags: skills },
      },
    ]
  }, [profile, projects, experience, education, skills])

  // One screen of scroll per panel.
  useEffect(() => {
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
  }, [PANELS.length])

  // Anime.js setup
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
  }, [PANELS])

  // Panel transition handoffs
  useEffect(() => {
    if (!ready || !root.current) return
    if (shown.current === active) return
    const scope = root.current
    if (shown.current < 0 && curtain.current) raiseCurtain(curtain.current, scope)
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

  // Nav item geometry
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
  }, [active])

  useEffect(() => {
    const ul = navList.current
    if (ul) moveMarker(ul.querySelector('.marker'), navBoxes.current[active - 1])
  }, [active])

  // Background tint per section
  useEffect(() => {
    const currentSection = PANELS[active] || PANELS[0]
    if (currentSection) {
      tintTo(document.documentElement, currentSection.tint, currentSection.gold)
    }
  }, [active, PANELS])

  const goTo = (i) => (e) => {
    e.preventDefault()
    window.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' })
  }

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
            <ul className={`entries${p.to ? ' entries--links' : ''}`}>
              {p.items.map((item) => {
                const row = (
                  <>
                    <h3>
                      {item.title}
                      <span>{item.meta || item.year}</span>
                    </h3>
                    <p>{item.summary}</p>
                  </>
                )
                return (
                  <li key={item.slug ?? item.title + (item.meta || '')}>
                    {p.to && item.slug ? (
                      <Link to={`${p.to}/${item.slug}`}>
                        {row}
                        <i className="entries__go" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M4 12h15M13 6l6 6-6 6" />
                          </svg>
                        </i>
                      </Link>
                    ) : (
                      row
                    )}
                  </li>
                )
              })}
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
              <button
                type="button"
                className="ghost"
                onClick={() => setContactModalOpen(true)}
                style={{
                  background: 'none',
                  border: '1px solid var(--edge)',
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                }}
              >
                Send a message
              </button>
            </div>
          )}

          {p.id === 'contact' && (
            <div style={{ marginTop: '24px' }}>
              <button
                type="button"
                className="cta"
                onClick={() => setContactModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  font: 'inherit',
                }}
              >
                ✉️ Send direct message
              </button>
            </div>
          )}
        </article>
      )),
    [PANELS],
  )

  const asides = useMemo(
    () =>
      PANELS.map((p, i) =>
        p.aside ? (
          <aside key={p.id} className="aside" data-i={i} aria-hidden="true">
            <p className="label">{p.aside.label}</p>
            {p.aside.rows && (
              <dl>
                {p.aside.rows.map(([term, detail], rIdx) => (
                  <div key={term + rIdx}>
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
    [PANELS],
  )

  const activeSide = PANELS[active]?.side || 'center'

  return (
    <main
      ref={root}
      className={`shell${ready ? ' is-ready' : ''}`}
      style={{ '--panels': PANELS.length }}
    >
      {/* Contact Form Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      {/* Covers the page while 129 frames decode, then wipes up off it. */}
      <div className="curtain" ref={curtain}>
        <p className="curtain__mark">{profile.name || 'Kashvi Jain'}</p>
        <p className="curtain__role">
          {profile.role || 'Web developer'} — {profile.city?.split(', ').pop() || 'Kathmandu'}
        </p>
        <p className="curtain__bar">
          <i />
        </p>
      </div>

      <div className="cursor" aria-hidden="true" />

      {/* One snap point per section */}
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
          side={activeSide}
        />
        <div className="wash" />
        <div className="scrim" />
        <div className="grain" />

        <div className="frame">
          <nav className="top">
            <a className="wordmark" href="#intro" onClick={goTo(0)}>
              {profile.name?.split(' ')[0] || 'Kashvi'}<span>®</span>
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

          <div className={`columns is-${activeSide}`}>
            <div className="panels">{panels}</div>
            <div className="lane" aria-hidden="true" />
            <div className="asides">{asides}</div>
          </div>

          <footer className="bottom">
            <p className="status">
              <i /> {profile.status}
            </p>
            <p className={`hint${active === 0 ? '' : ' is-gone'}`}>
              Move your cursor — she follows
            </p>
            <p className="place">
              <Link
                to="/admin"
                style={{
                  color: 'inherit',
                  textDecoration: 'none',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                  marginRight: '12px',
                }}
                title="Admin Control Center"
              >
                ⚙️
              </Link>
              {profile.coords}
            </p>
          </footer>

          <div className="progress" aria-hidden="true">
            <i />
          </div>
        </div>
      </div>
    </main>
  )
}
