import { useRef } from 'react'
import { useFrame, applyVis } from './frame.js'
import { win, ramp, smooth } from '../film/timeline.js'
import { LINKS } from '../config.js'

// The conclusion: the same two lines the film opened with, then the waitlist.

export default function Finale() {
  const cta = useRef(null)
  const foot = useRef(null)
  useFrame((t) => {
    const o = smooth(ramp(t, 78.5, 79.4))
    applyVis(cta.current, o, { rise: 18 })
    if (cta.current) cta.current.style.pointerEvents = o > 0.6 ? 'auto' : 'none'
    applyVis(foot.current, smooth(ramp(t, 79.4, 80.2)), { rise: 0 })
    if (foot.current) foot.current.style.pointerEvents = t > 79.6 ? 'auto' : 'none'
  })
  return (
    <>
      <section className="cta" ref={cta} id="access" aria-labelledby="cta-title">
        <p className="eyebrow">The next chapter is yours</p>
        <h2 id="cta-title">Get in early.</h2>
        <p className="cta-lede">
          We’re opening access gradually. Leave your number and tell us what you’d put E1O to work on.
        </p>
        <div className="cta-row">
          <a className="button" href={LINKS.waitlist}>
            Join the waitlist
          </a>
          <a className="link" href={LINKS.email}>
            Request early access by email
          </a>
        </div>
        <p className="fine">
          Access opens gradually. We haven’t announced a public launch date; joining doesn’t guarantee an invitation.
        </p>
      </section>
      <footer className="foot" ref={foot}>
        <span>E1O is short for E1 Optics.</span>
        <span>E1O is operated by Datost Inc.</span>
        <a href={LINKS.privacy}>Waitlist privacy</a>
        <a href={LINKS.terms}>Messaging terms</a>
      </footer>
    </>
  )
}
