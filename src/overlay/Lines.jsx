import { useRef } from 'react'
import { COPY } from './copy.js'
import { useFrame, applyVis } from './frame.js'
import { win, ramp, clamp } from '../film/timeline.js'

// All timed copy. Positions for labels and speech come from the stage (projected 3D points).

function Item({ c, register }) {
  const cls = [c.kind, c.place, c.small && 'small', c.ink && 'ink', c.strong && 'strong', c.sweep && 'sweep'].filter(Boolean).join(' ')
  const ref = (el) => register(el)
  switch (c.kind) {
    case 'hero':
      return <h2 ref={ref} className={cls} data-text={c.text}>{c.text}</h2>
    case 'statement':
      return <p ref={ref} className={cls} dangerouslySetInnerHTML={{ __html: c.html }} />
    case 'you':
      return (
        <div ref={ref} className={cls}>
          <span className="tag">You</span>
          <p>{c.text}</p>
        </div>
      )
    case 'say':
      return (
        <div ref={ref} className={cls}>
          <p>{c.text}</p>
        </div>
      )
    case 'label':
      return (
        <div ref={ref} className={cls} aria-hidden="true">
          <i className="pt" />
          <i className="leader" />
          <span>{c.text}</span>
        </div>
      )
    default:
      return <p ref={ref} className={cls}>{c.text}</p>
  }
}

export default function Lines() {
  const els = useRef([])
  useFrame((t, view) => {
    COPY.forEach((c, i) => {
      const el = els.current[i]
      if (!el) return
      let o = win(t, c.t0, c.t1, c.fi ?? 0.3, c.fo ?? 0.3)
      if (c.kind === 'label') {
        const a = view.anchors?.[c.pin]
        if (!a || !a.on || view.mode !== 'product') o = 0
        if (o > 0) {
          const flip = a.x > view.w * 0.6
          if (el._flip !== flip) {
            el.classList.toggle('flip', flip)
            el._flip = flip
          }
          applyVis(el, o, { rise: 0, x: a.x, y: a.y })
          return
        }
      }
      if (c.kind === 'say') {
        const h = view.heads?.[c.pin]
        if (!h || !h.on) o = 0
        if (o > 0) {
          const bw = el.offsetWidth || 280
          const bh = el.offsetHeight || 60
          const right = h.x < view.w * 0.55
          let x = right ? h.x + 34 : h.x - bw - 34
          let y = h.y - bh - 46
          x = clamp(x, 16, view.w - bw - 16)
          y = clamp(y, 70, view.h - bh - 180)
          if (el._right !== right) {
            el.classList.toggle('left', !right)
            el._right = right
          }
          applyVis(el, o, { rise: 8, x, y })
          return
        }
      }
      if (c.sweep || c.kind === 'hero') {
        const k = ramp(t, c.t0, c.t0 + 1.6)
        el.style.setProperty('--sweep', `${(k * 160 - 30).toFixed(1)}%`)
      }
      applyVis(el, o, { rise: c.kind === 'hero' ? 22 : 12 })
    })
  })
  return (
    <div className="lines" aria-live="off">
      {COPY.map((c, i) => (
        <Item key={i} c={c} register={(el) => (els.current[i] = el)} />
      ))}
    </div>
  )
}
