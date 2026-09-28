import { useRef } from 'react'
import { APPEARANCES, ALT } from './displays.js'
import { FIRMWARE } from '../config.js'
import { useFrame, applyVis } from './frame.js'
import { clamp, smooth, win } from '../film/timeline.js'

// The private display, as the wearer sees it: one small plate, one thing at a time.
// Contents are E1O's actual firmware renders; we only decide when each piece arrives.

const W = 540
const H = 440
const inset = ([x, y, w, h], grow = 1) =>
  `inset(${((y / H) * 100).toFixed(3)}% ${(((W - x - w) / W) * 100).toFixed(3)}% ${(((H - y - h * grow) / H) * 100).toFixed(3)}% ${((x / W) * 100).toFixed(3)}%)`

export default function Display() {
  const plate = useRef(null)
  const note = useRef(null)
  const apps = useRef([])
  const parts = useRef([])
  const swipe = useRef(null)
  const dot = useRef(null)

  useFrame((t) => {
    let any = 0
    APPEARANCES.forEach((a, i) => {
      const el = apps.current[i]
      const len = a.t1 - a.t0
      const fo = a.quick ? 0.06 : 0.28
      const env = t < a.t0 || t > a.t1 ? 0 : a.noIn ? smooth(clamp((a.t1 - t) / fo)) : win(t, a.t0, a.t1, a.quick ? 0.04 : 0.12, fo)
      any = Math.max(any, a.noIn ? (t >= a.t0 && t <= a.t1 ? 1 : 0) : win(t, a.t0 - 0.08, a.t1, 0.12, fo))
      const u = (t - a.t0) / len
      let ex = 0
      if (a.exit) ex = smooth(clamp((u - a.exit.at) / a.exit.dur))
      applyVis(el, env * (1 - ex * 0.9), { rise: 0, x: ex * 120, y: 0 })
      if (env <= 0) return
      a.parts.forEach((p, j) => {
        const img = parts.current[i]?.[j]
        if (!img) return
        const k = smooth(clamp((u - p.at) / p.dur))
        if (p.mode === 'wipe') {
          img.style.clipPath = inset(p.r, Math.max(0.0001, k))
          img.style.opacity = String(Math.min(1, k * 4))
        } else if (p.mode === 'slide') {
          img.style.opacity = k.toFixed(3)
          img.style.transform = `translate3d(0, ${((1 - k) * 3).toFixed(2)}%, 0)`
        } else {
          img.style.opacity = k.toFixed(3)
        }
      })
    })
    applyVis(plate.current, any, { rise: 10 })
    applyVis(note.current, any, { rise: 0 })
    // the swipe that approves the reply
    const sw = win(t, 40.95, 41.7, 0.12, 0.18)
    applyVis(swipe.current, sw, { rise: 6 })
    if (sw > 0 && dot.current) dot.current.style.left = `${(smooth(clamp((t - 41.05) / 0.45)) * 100).toFixed(1)}%`
  })

  return (
    <div className="display-layer" aria-hidden="false">
      <div className="lens-display" ref={plate} role="img" aria-label="In E1O">
        {APPEARANCES.map((a, i) => (
          <div className="fw" key={i} ref={(el) => (apps.current[i] = el)}>
            {a.parts.map((p, j) => (
              <img
                key={j}
                src={FIRMWARE(a.fw)}
                alt=""
                draggable="false"
                ref={(el) => {
                  parts.current[i] = parts.current[i] || []
                  parts.current[i][j] = el
                }}
                style={{ clipPath: inset(p.r), opacity: 0 }}
              />
            ))}
            <span className="sr-only">{ALT[a.fw]}</span>
          </div>
        ))}
      </div>
      <p className="fw-note" ref={note}>
        In E1O · Actual firmware layout, example content. Brightness and field of view are not simulated.
      </p>
      <div className="swipe" ref={swipe} aria-hidden="true">
        <span className="swipe-track">
          <span className="swipe-dot" ref={dot} />
        </span>
        <span className="swipe-label">Swipe &gt; approve</span>
      </div>
    </div>
  )
}
