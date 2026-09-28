import { useEffect, useRef, useState } from 'react'
import { Stage, view } from './gl/Stage.js'
import { film, onFrame, startFilm, relayout, scrollLength } from './film/store.js'
import { runOverlays } from './overlay/frame.js'
import Lines from './overlay/Lines.jsx'
import Display from './overlay/Display.jsx'
import { ReplyRail, UsesRail } from './overlay/Rails.jsx'
import Phone from './overlay/Phone.jsx'
import HowItWorks from './overlay/HowItWorks.jsx'
import Finale from './overlay/Finale.jsx'
import Chrome from './overlay/Chrome.jsx'
import Fallback from './Fallback.jsx'
import Transcript from './Transcript.jsx'
import { ASSETS, FIRMWARE, DEBUG } from './config.js'

function hasWebGL2() {
  try {
    const c = document.createElement('canvas')
    return !!c.getContext('webgl2')
  } catch {
    return false
  }
}

function preload(urls) {
  return Promise.all(
    urls.map(
      (u) =>
        new Promise((res) => {
          const i = new Image()
          // onload only: decode() can wait for a visible page, and a background tab should still finish loading
          i.onload = i.onerror = () => res()
          i.src = u
          setTimeout(res, 8000)
        }),
    ),
  )
}

export default function App() {
  const canvas = useRef(null)
  const [state, setState] = useState(() => (hasWebGL2() && !/~fallback/.test(location.hash) ? 'loading' : 'fallback'))
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!hasWebGL2() || /~fallback/.test(location.hash)) return
    let stage
    let stop = () => {}
    let cancelled = false
    document.documentElement.style.setProperty('--scroll-length', `${scrollLength()}px`)
    try {
      stage = new Stage(canvas.current)
    } catch (e) {
      console.error(e)
      setState('fallback')
      return
    }
    const fw = ['dashboard', 'coding', 'conversate', 'hero-translation', 'agent', 'twitch', 'navigation', 'teleprompter', 'workout', 'workout-logged', 'translation'].map(FIRMWARE)
    const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 4000))])
    Promise.all([stage.load((p) => setProgress(p)), preload([...fw, ASSETS.phone]), fonts])
      .then(() => {
        if (cancelled) return
        startFilm()
        relayout()
        if (window.__e1o) window.__e1o.stage = stage
        // draw only when something changes: the story moved, or the scene has idle life (at 30 fps)
        let lastT = -1
        let skip = 0
        stop = onFrame((t, dt) => {
          const moved = Math.abs(t - lastT) > 1e-5 || stage.dirty
          stage.dirty = false
          if (!moved) {
            if (!stage.idle) return
            if ((skip = (skip + 1) % 2)) return
          }
          lastT = t
          stage.frame(t, moved ? dt : dt * 2, film.clock, film.reduced)
          runOverlays(t, view)
          if (DEBUG) document.title = `t ${t.toFixed(2)} · ${view.mode}`
        })
        setState('ready')
      })
      .catch((e) => {
        console.error(e)
        if (!cancelled) setState('fallback')
      })
    const onResize = () => relayout()
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      stop()
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (state === 'fallback') return <Fallback />

  return (
    <>
      <canvas ref={canvas} className="stage" aria-hidden="true" />
      <div className={`overlay ${state === 'ready' ? 'on' : ''}`}>
        <Lines />
        <Display />
        <ReplyRail />
        <UsesRail />
        <Phone />
        <HowItWorks />
        <Finale />
      </div>
      {/* Outside the overlay on purpose: its difference blend has to see the canvas to stay legible on light and dark scenes. */}
      <Chrome />

      <div className={`loader ${state === 'ready' ? 'done' : ''}`} role="status" aria-live="polite">
        <span className="loader-mark" style={{ WebkitMaskImage: `url(${ASSETS.wordmark})`, maskImage: `url(${ASSETS.wordmark})` }} />
        <span className="loader-bar">
          <i style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
        </span>
        <span className="loader-note">Camera-free personal AI glasses</span>
      </div>
      <div className="scroller" aria-hidden="true" />
      <Transcript />
    </>
  )
}
