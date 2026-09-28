import { Story } from './Transcript.jsx'
import { ASSETS } from './config.js'

// Without WebGL2 (or if the model cannot load) the same story is told as a still page.
export default function Fallback() {
  return (
    <main className="fallback" id="top">
      <span className="fb-mark" style={{ WebkitMaskImage: `url(${ASSETS.wordmark})`, maskImage: `url(${ASSETS.wordmark})` }} aria-label="E1O" role="img" />
      <Story visual />
    </main>
  )
}
