import { useRef } from 'react'
import { useFrame, applyVis } from './frame.js'
import { USES, USES_T0, USE_LEN, useAt, win } from '../film/timeline.js'

// Two small side rails: the steps of the reply (request → done) and the index of "Find your use".

const STEPS = [
  ['Request', 38.5],
  ['Draft', 39.55],
  ['Review', 40.4],
  ['Approve', 41.05],
  ['Done', 41.8],
]

export function ReplyRail() {
  const rail = useRef(null)
  const items = useRef([])
  useFrame((t) => {
    applyVis(rail.current, win(t, 38.35, 42.85, 0.3, 0.3), { rise: 0 })
    let cur = -1
    STEPS.forEach(([, at], i) => {
      if (t >= at) cur = i
    })
    items.current.forEach((el, i) => {
      if (!el) return
      const s = i < cur ? 'past' : i === cur ? 'now' : 'next'
      if (el._s !== s) {
        el.dataset.s = s
        el._s = s
      }
    })
  })
  return (
    <ol className="rail reply-rail" ref={rail} aria-label="Reply steps">
      {STEPS.map(([name], i) => (
        <li key={name} ref={(el) => (items.current[i] = el)} data-s="next">
          <span>{name}</span>
        </li>
      ))}
    </ol>
  )
}

export function UsesRail() {
  const rail = useRef(null)
  const items = useRef([])
  const asks = useRef([])
  const notes = useRef([])
  const heads = useRef([])
  useFrame((t) => {
    applyVis(rail.current, win(t, 48.85, 57.0, 0.25, 0.3), { rise: 0 })
    const cur = useAt(t)
    USES.forEach((u, i) => {
      const a = USES_T0 + i * USE_LEN
      const el = items.current[i]
      const s = i < cur ? 'past' : i === cur ? 'now' : 'next'
      if (el && el._s !== s) {
        el.dataset.s = s
        el._s = s
      }
      applyVis(asks.current[i], win(t, a + 0.02, a + USE_LEN * 0.62, 0.1, 0.12), { rise: 8 })
      applyVis(notes.current[i], win(t, a + 0.16, a + USE_LEN - 0.02, 0.1, 0.08), { rise: 0 })
      applyVis(heads.current[i], win(t, a, a + USE_LEN, 0.06, 0.06), { rise: 6 })
    })
  })
  return (
    <>
      <ol className="rail uses-rail" ref={rail} aria-label="Find your use">
        {USES.map((u, i) => (
          <li key={u.id} ref={(el) => (items.current[i] = el)} data-s="next">
            <b>{String(i + 1).padStart(2, '0')}</b>
            <span>{u.name}</span>
          </li>
        ))}
      </ol>
      {USES.map((u, i) => (
        <div key={u.id}>
          <p className="use-head" ref={(el) => (heads.current[i] = el)}>
            <b>{String(i + 1).padStart(2, '0')}</b> {u.name}
          </p>
          <div className="you use-ask" ref={(el) => (asks.current[i] = el)}>
            <span className="tag">You</span>
            <p>{u.ask.replace(/[“”]/g, '')}</p>
          </div>
          <p className="fine fine-pov use-note" ref={(el) => (notes.current[i] = el)}>
            {u.note}
          </p>
        </div>
      ))}
    </>
  )
}
