import { useRef } from 'react'
import { useFrame, applyVis } from './frame.js'
import { win, smooth, ramp } from '../film/timeline.js'
import { ASSETS } from '../config.js'

// Something of your own: the actual E1O companion app, held low in view while the chat sits in the glasses.

export default function Phone() {
  const el = useRef(null)
  const cap = useRef(null)
  useFrame((t) => {
    const o = win(t, 45.75, 47.95, 0.4, 0.3)
    const k = smooth(ramp(t, 45.75, 46.4))
    applyVis(el.current, o, { rise: 0 })
    if (o > 0 && el.current) el.current.style.setProperty('--lift', `${((1 - k) * 60).toFixed(1)}%`)
    applyVis(cap.current, win(t, 46.0, 47.95, 0.35, 0.3), { rise: 8 })
  })
  return (
    <>
      <figure className="held-phone" ref={el}>
        <img src={ASSETS.phone} alt="The actual E1O app showing recent Twitch Chat messages and its Open on E1 control" />
      </figure>
      <div className="phone-cap" ref={cap}>
        <p className="box">The E1O app connects the rest.</p>
        <p className="fine fine-pov">Catch up with chat on your phone. Open the app in your glasses. Actual companion app · Example channel.</p>
      </div>
    </>
  )
}
