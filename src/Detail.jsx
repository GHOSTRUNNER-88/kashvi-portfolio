import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createScope, stagger } from 'animejs'
import { animate } from 'animejs'

import { bySlug, sections } from './content.js'
import { magnetic, reducedMotion, splitHeadlines, trailingCursor } from './animations.js'
import { usePortfolioData } from './context/DataContext.jsx'

/**
 * A case study for one project or one stretch of experience. No sticky
 * character here: the detail pages are for reading, so the stage gives way to
 * the writing and the section's own colour carries the identity.
 */
export default function Detail({ type, list, kind, back }) {
  const { slug } = useParams()
  const { projects, experience, profile } = usePortfolioData()

  // Use dynamic projects or experience from live data context
  const activeList = type === 'work' ? projects : type === 'experience' ? experience : list || []
  const item = bySlug(activeList, slug)
  const root = useRef(null)

  // The route's section supplies the colour, so a project page and its panel
  // on the home page are unmistakably the same place.
  const tone =
    type === 'work'
      ? sections.find((s) => s.id === 'work')
      : type === 'experience'
      ? sections.find((s) => s.id === 'experience')
      : sections.find((s) => s.items === list)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  // Match the page behind the article too, so overscroll does not flash red.
  useEffect(() => {
    if (!tone) return
    const rootEl = document.documentElement
    rootEl.style.setProperty('--tint-rgb', tone.tint)
    rootEl.style.setProperty('--gold', tone.gold)
  }, [tone])

  useEffect(() => {
    if (!item) return
    const scope = createScope({ root }).add(() => {
      const el = root.current
      const [chars, undoSplit] = splitHeadlines(el)
      const offs = [...el.querySelectorAll('.cta')].map((b) => magnetic(b))
      offs.push(trailingCursor(el.querySelector('.cursor')))

      if (!reducedMotion()) {
        const heads = [...el.querySelectorAll('.head b')]
        heads.forEach((b, i) => {
          const set = chars.get(b)
          if (set)
            animate(set, {
              translateY: ['115%', '0%'],
              opacity: [0, 1],
              duration: 620,
              delay: stagger(11, { start: 80 + i * 60 }),
              ease: 'outExpo',
            })
        })
        animate(el.querySelectorAll('.detail__rise'), {
          opacity: [0, 1],
          translateY: [22, 0],
          duration: 560,
          delay: stagger(60, { start: 200 }),
          ease: 'outExpo',
        })
      }

      return () => {
        offs.forEach((off) => off())
        undoSplit()
      }
    })
    return () => scope.revert()
  }, [item, slug])

  if (!item) {
    return (
      <main className="detail detail--empty">
        <p className="eyebrow">
          <i /> Not found
        </p>
        <h1 className="head">
          <span>
            <b>Nothing</b>
          </span>
          <span>
            <b>
              <em>here.</em>
            </b>
          </span>
        </h1>
        <Link className="cta" to="/">
          Back to the portfolio
        </Link>
      </main>
    )
  }

  return (
    <main
      className="detail"
      ref={root}
      style={{ '--tint-rgb': tone?.tint ?? '58 10 6', '--gold': tone?.gold ?? '#e9c393' }}
    >
      <div className="cursor" aria-hidden="true" />
      <div className="grain" />

      <div className="detail__inner">
        <nav className="detail__top detail__rise">
          <Link className="wordmark" to="/">
            {profile?.name?.split(' ')[0] || 'Kashvi'}<span>®</span>
          </Link>
          <Link className="detail__back" to={back}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12H5M11 18l-6-6 6-6" />
            </svg>
            {kind}
          </Link>
        </nav>

        <header className="detail__head">
          <p className="eyebrow detail__rise">
            <i /> {kind} — {item.meta || item.year}
          </p>
          <h1 className="head">
            <span>
              <b>{item.title}</b>
            </span>
          </h1>
          <p className="lede detail__rise">{item.summary}</p>
        </header>

        <div className="detail__body">
          <article className="detail__prose detail__rise">
            {item.body?.map((para, pIdx) => (
              <p key={para.slice(0, 32) + pIdx}>{para}</p>
            ))}
          </article>

          <aside className="detail__meta detail__rise">
            {item.stack && item.stack.length > 0 && (
              <>
                <p className="label">Built with</p>
                <ul className="tags">
                  {item.stack.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </>
            )}

            {item.highlights && item.highlights.length > 0 && (
              <>
                <p className="label">Notes</p>
                <dl>
                  {item.highlights.map(([term, detail], hIdx) => (
                    <div key={(term || '') + hIdx}>
                      <dt>{term}</dt>
                      <dd>{detail}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}

            {item.links && item.links.length > 0 && (
              <>
                <p className="label" style={{ marginTop: '24px' }}>Links</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  {item.links.map(
                    (l, lIdx) =>
                      l.url && (
                        <a
                          key={lIdx}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="adm-btn adm-btn-secondary adm-btn-sm"
                          style={{
                            color: 'var(--gold)',
                            borderColor: 'var(--edge)',
                            padding: '6px 14px',
                            fontSize: '12px',
                          }}
                        >
                          {l.label || 'Visit link'} ↗
                        </a>
                      ),
                  )}
                </div>
              </>
            )}
          </aside>
        </div>

        {item.cover && (
          <figure className="detail__shot detail__rise">
            <img src={item.cover} alt={`${item.title} preview`} loading="lazy" />
          </figure>
        )}

        <footer className="detail__foot detail__rise">
          <Link className="cta" to={back}>
            All {kind.toLowerCase()}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a className="ghost" href={`mailto:${profile?.email || 'kashvijain2910@gmail.com'}`}>
            Get in touch
          </a>
        </footer>
      </div>
    </main>
  )
}
