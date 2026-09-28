import { useRef, useState } from 'react'
import { useFrame } from './frame.js'
import { SCENES, sceneAt, T_END } from '../film/timeline.js'
import { scrollToBeat } from '../film/store.js'
import { ASSETS, LINKS } from '../config.js'

// Minimal chrome: the wordmark, one way to early access, a quiet chapter index. No navigation bar.

export default function Chrome() {
  const veil = useRef(null)
  const hush = useRef(null)
  const label = useRef(null)
  const bar = useRef(null)
  const top = useRef(null)
  const [open, setOpen] = useState(false)

  useFrame((t, view) => {
    if (veil.current) veil.current.style.opacity = (view.veil || 0).toFixed(3)
    if (hush.current) hush.current.style.opacity = ((view.hush || 0) * 0.55).toFixed(3)
    const s = sceneAt(t)
    const i = SCENES.indexOf(s)
    if (label.current && label.current._i !== i) {
      label.current.textContent = `${String(i + 1).padStart(2, '0')} / ${SCENES.length} · ${s.label}`
      label.current._i = i
    }
    if (bar.current) bar.current.style.transform = `scaleX(${(t / T_END).toFixed(4)})`
    // the chrome steps back while the display or speech is up in the wearer's view
    if (top.current) top.current.style.opacity = t > 0.4 && t < 1.2 ? '0.5' : '1'
  })

  const jump = (s) => {
    setOpen(false)
    scrollToBeat(s.t0 + (s.id === 'dark' ? 0 : 0.35))
  }

  return (
    <>
      <div className="veil" ref={veil} aria-hidden="true" />
      <div className="hush" ref={hush} aria-hidden="true" />
      <a className="skip" href="#access" onClick={(e) => (e.preventDefault(), scrollToBeat(78.8))}>
        Skip to early access
      </a>
      <header className="chrome" ref={top}>
        <a className="wordmark" href="#top" onClick={(e) => (e.preventDefault(), scrollToBeat(0))} aria-label="E1O, back to the start">
          <span style={{ WebkitMaskImage: `url(${ASSETS.wordmark})`, maskImage: `url(${ASSETS.wordmark})` }} />
        </a>
        <a className="early" href={LINKS.waitlist}>
          Early access <span aria-hidden="true">↗</span>
        </a>
      </header>
      <nav className={`chapters ${open ? 'open' : ''}`} aria-label="Moments">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span ref={label}>01 / 15 · Something in the dark</span>
          <i aria-hidden="true">{open ? '×' : '+'}</i>
        </button>
        {open && (
          <ol>
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => jump(s)}>
                  <b>{String(i + 1).padStart(2, '0')}</b> {s.label}
                </button>
              </li>
            ))}
          </ol>
        )}
        <span className="progress" aria-hidden="true">
          <i ref={bar} />
        </span>
      </nav>
    </>
  )
}
