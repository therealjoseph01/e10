import { useRef } from 'react'
import { useFrame, applyVis } from './frame.js'
import { win, ramp, smooth, clamp, lerp } from '../film/timeline.js'
import { ASSETS } from '../config.js'

// What runs where (e1o.com FAQ), drawn around the live glasses:
// glasses ↔ E1O phone app ↔ your services, and phone ↔ your Mac, where Claude Code and Codex actually run.

const T0 = 64.0
const T1 = 69.0

export default function HowItWorks() {
  const root = useRef(null)
  const svg = useRef(null)
  const lines = useRef([])
  const pulses = useRef([])
  const nodes = useRef({})
  const texts = useRef([])
  const path = useRef([])

  useFrame((t, view) => {
    const o = win(t, T0 + 0.2, T1, 0.4, 0.5)
    applyVis(root.current, o, { rise: 0 })
    if (o <= 0) return
    const { w, h } = view
    const portrait = w / h < 0.9
    const g = view.glasses || { x: w / 2, y: h * 0.3, r: 100 }
    const cx = w / 2
    const gy = g.y
    const ph = portrait ? h * 0.2 : h * 0.3
    const phone = portrait ? { x: cx, y: clamp(gy + g.r * 0.5 + ph * 0.5 + 60, h * 0.4, h * 0.56) } : { x: cx, y: h * 0.66 }
    const lowY = portrait ? phone.y + ph / 2 + h * 0.1 : h * 0.66
    const svc = portrait ? { x: w * 0.25, y: lowY } : { x: cx - Math.min(w * 0.27, 420), y: h * 0.66 }
    const mac = portrait ? { x: w * 0.75, y: lowY } : { x: cx + Math.min(w * 0.27, 420), y: h * 0.66 }
    const pw = ph * 0.46

    const at = {
      glasses: [cx, gy + Math.max(34, g.r * 0.34)],
      phone: [phone.x, phone.y],
      svc: [svc.x, svc.y],
      mac: [mac.x, mac.y],
    }

    const segs = portrait
      ? [
          [[cx, gy + Math.max(56, g.r * 0.34 + 22)], [cx, phone.y - ph / 2 - 10]],
          [[phone.x - pw / 2 - 10, phone.y + ph * 0.3], [svc.x, svc.y - 34]],
          [[phone.x + pw / 2 + 10, phone.y + ph * 0.3], [mac.x, mac.y - 40]],
        ]
      : [
          [[cx, gy + Math.max(56, g.r * 0.34 + 22)], [cx, phone.y - ph / 2 - 12]],
          [[phone.x - pw / 2 - 14, phone.y], [svc.x + 92, svc.y]],
          [[phone.x + pw / 2 + 14, phone.y], [mac.x - 96, mac.y]],
        ]
    const starts = [T0 + 0.55, T0 + 1.35, T0 + 2.15]
    segs.forEach(([a, b], i) => {
      const ln = lines.current[i]
      if (!ln) return
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      ln.setAttribute('d', `M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`)
      const k = smooth(ramp(t, starts[i], starts[i] + 0.55))
      ln.style.strokeDasharray = `${len} ${len}`
      ln.style.strokeDashoffset = `${(1 - k) * len}`
      // a pulse travelling both ways (information going to the glasses, your answer going back)
      const pu = pulses.current[i]
      if (pu) {
        const s = (t * 1.3 + i * 0.37) % 1
        const q = i === 0 ? 1 - s : s
        pu.setAttribute('cx', lerp(a[0], b[0], q).toFixed(1))
        pu.setAttribute('cy', lerp(a[1], b[1], q).toFixed(1))
        pu.style.opacity = String(k * 0.9)
      }
    })
    // on phones the three lines take turns in one place
    texts.current.forEach((el, i) => applyVis(el, portrait ? win(t, starts[i], i < 2 ? starts[i + 1] : T1, 0.3, 0.25) : win(t, starts[i], T1, 0.35, 0.4), { rise: 10 }))
    const show = (k, a) => applyVis(nodes.current[k], win(t, a, T1, 0.35, 0.4), { rise: 0, x: at[k][0], y: at[k][1] })
    show('glasses', T0 + 0.35)
    show('phone', T0 + 0.5)
    show('svc', T0 + 1.35)
    show('mac', T0 + 2.15)
    // the coding path, step by step
    const pathK = ramp(t, T0 + 2.9, T0 + 4.1)
    path.current.forEach((el, i) => {
      if (!el) return
      const on = pathK * 4 > i
      if (el._on !== on) {
        el.classList.toggle('on', on)
        el._on = on
      }
    })
    applyVis(path.current.wrap, win(t, T0 + 2.8, T1, 0.3, 0.4), { rise: 8 })
  })

  return (
    <section className="how" ref={root} aria-label="What runs where">
      <p className="eyebrow how-eyebrow">What runs where</p>
      <svg ref={svg} className="how-lines" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path ref={(el) => (lines.current[i] = el)} />
            <circle r="3" ref={(el) => (pulses.current[i] = el)} />
          </g>
        ))}
      </svg>
      <div className="how-node how-glasses" ref={(el) => (nodes.current.glasses = el)}>
        <b>E1O glasses</b>
      </div>
      <div className="how-node how-phone" ref={(el) => (nodes.current.phone = el)}>
        <img src={ASSETS.phone} alt="The actual E1O companion app, showing recent Twitch Chat messages and its Open on E1 control" />
        <b>E1O phone app</b>
      </div>
      <div className="how-node how-svc" ref={(el) => (nodes.current.svc = el)}>
        <ul>
          <li>Email</li>
          <li>Calendar</li>
          <li>Reminders</li>
          <li>Your notes</li>
        </ul>
        <b>Your services</b>
      </div>
      <div className="how-node how-mac" ref={(el) => (nodes.current.mac = el)}>
        <svg viewBox="0 0 120 80" aria-hidden="true">
          <rect x="18" y="6" width="84" height="54" rx="4" />
          <path d="M6 66 H114 L108 74 H12 Z" />
          <text x="26" y="24">❯ run the tests</text>
          <text x="26" y="36">✓ 12 / 12</text>
        </svg>
        <b>Your Mac</b>
        <small>Claude Code · Codex</small>
      </div>
      <div className="how-copy">
        <p ref={(el) => (texts.current[0] = el)}>The glasses put information in view.</p>
        <p ref={(el) => (texts.current[1] = el)}>The E1O phone app connects your services and manages the experience.</p>
        <p ref={(el) => (texts.current[2] = el)}>Coding agents run on your Mac, which needs to stay awake and connected. The glasses let you follow supported sessions and respond.</p>
      </div>
      <ol className="how-path" ref={(el) => (path.current.wrap = el)} aria-label="For coding">
        {['Glasses', 'E1O phone app', 'Connected Mac', 'Claude Code / Codex'].map((s, i) => (
          <li key={s} ref={(el) => (path.current[i] = el)}>
            {s}
          </li>
        ))}
      </ol>
    </section>
  )
}
