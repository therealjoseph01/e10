import { useEffect, useRef } from 'react'

// Overlay updaters run once per frame, right after the canvas has drawn, and write straight to the DOM.
// Nothing here re-renders React while scrolling.
const updaters = new Set()

export function runOverlays(t, view) {
  for (const fn of updaters) fn(t, view)
}

export function useFrame(fn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const f = (t, v) => ref.current(t, v)
    updaters.add(f)
    return () => updaters.delete(f)
  }, [])
}

// Show/hide an element with a visibility window. Hidden elements leave the accessibility tree and stop painting.
export function applyVis(el, o, { rise = 14, scale = 0, x = null, y = null } = {}) {
  if (!el) return
  const st = el._vis ?? -1
  if (o <= 0.001) {
    if (st !== 0) {
      el.style.visibility = 'hidden'
      el.style.opacity = '0'
      el._vis = 0
    }
    return
  }
  if (st !== 1) {
    el.style.visibility = 'visible'
    el._vis = 1
  }
  el.style.opacity = o.toFixed(3)
  const ty = (1 - o) * rise
  const sc = scale ? 1 + (1 - o) * scale : 1
  const tx = x != null ? `translate3d(${x.toFixed(1)}px, ${((y ?? 0) + ty).toFixed(1)}px, 0)` : `translate3d(0, ${ty.toFixed(1)}px, 0)`
  el.style.transform = sc !== 1 ? `${tx} scale(${sc.toFixed(3)})` : tx
}
