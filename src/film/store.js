import Lenis from 'lenis'
import { T_END, clamp } from './timeline.js'
import { device, prefersReducedMotion } from '../config.js'

// Scroll is the playhead. `target` is where the scrollbar says we are (in beats); `t` follows it on a critically
// damped spring so scrubbing feels filmed. With reduced motion there is no smoothing.

const listeners = new Set()
export const film = {
  t: 0,
  v: 0,
  target: 0,
  reduced: prefersReducedMotion(),
  pxPerBeat: 800,
  started: false,
  clock: 0, // seconds since start (idle life in the world)
  lenis: null,
}

export function beatPx() {
  const h = window.innerHeight
  return Math.round(h * (device.mobile ? 0.72 : 0.82))
}

export function scrollLength() {
  return Math.round(T_END * film.pxPerBeat + window.innerHeight)
}

export function onFrame(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function readScroll() {
  const y = film.lenis ? film.lenis.scroll : window.scrollY
  film.target = clamp(y / film.pxPerBeat, 0, T_END)
}

export function scrollToBeat(beat, immediate = false) {
  const y = beat * film.pxPerBeat
  if (film.lenis) film.lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 2.2 })
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' })
}

let last = 0
let raf = 0
function tick(now) {
  raf = requestAnimationFrame(tick)
  const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60)
  last = now
  film.clock += dt
  if (film.lenis) film.lenis.raf(now)
  readScroll()
  if (film.hold != null) film.target = film.hold
  if (film.reduced) {
    film.t = film.target
    film.v = 0
  } else {
    // Critically damped spring toward the scroll target.
    const w = device.touch ? 7.5 : 9
    const x = film.t - film.target
    const a = -w * w * x - 2 * w * film.v
    film.v += a * dt
    film.t += film.v * dt
    if (Math.abs(film.t - film.target) < 1e-4 && Math.abs(film.v) < 1e-4) {
      film.t = film.target
      film.v = 0
    }
  }
  for (const fn of listeners) fn(film.t, dt, now)
}

export function startFilm() {
  if (film.started) return
  film.started = true
  film.pxPerBeat = beatPx()
  if (!device.touch && !film.reduced) {
    film.lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false })
  }
  const mqr = window.matchMedia('(prefers-reduced-motion: reduce)')
  mqr.addEventListener?.('change', (e) => (film.reduced = e.matches))

  // QA: #t12.4 jumps to a moment.
  const m = location.hash.match(/#t(\d+(?:\.\d+)?)/)
  if (m) {
    const b = parseFloat(m[1])
    requestAnimationFrame(() => {
      scrollToBeat(b, true)
      readScroll()
      film.t = film.target
    })
  }
  raf = requestAnimationFrame(tick)
  // QA handle: __e1o.go(24.5) jumps to a moment.
  window.__e1o = {
    film,
    go: (b) => ((film.hold = null), scrollToBeat(b, true), (film.t = b), (film.v = 0)),
    // draw one frame at beat b right now (works even when the tab is in the background)
    at: (b) => {
      film.hold = b
      film.target = film.t = b
      film.v = 0
      for (const fn of listeners) fn(b, 1 / 60, performance.now())
      return b
    },
  }
  return () => cancelAnimationFrame(raf)
}

let lastSize = [0, 0]
export function relayout() {
  // Phones resize constantly as the toolbars come and go. Only re-measure on real changes (width, or a big jump
  // in height) so the playhead never slips under the thumb.
  const w = window.innerWidth
  const h = window.innerHeight
  const real = w !== lastSize[0] || Math.abs(h - lastSize[1]) > lastSize[1] * 0.2
  if (!real) return
  lastSize = [w, h]
  const beat = film.target
  film.pxPerBeat = beatPx()
  document.documentElement.style.setProperty('--scroll-length', `${scrollLength()}px`)
  scrollToBeat(beat, true)
}
