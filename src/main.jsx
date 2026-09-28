import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter-tight'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles.css'
import App from './App.jsx'
import { ASSETS } from './config.js'

// E1O's own brand faces: E1Display (headlines) and the Patrick Hand lettering used in the official comic.
for (const [family, url, desc] of [
  ['E1Display', ASSETS.displayFont, { weight: '700' }],
  ['PatrickHand', ASSETS.handFont, { weight: '400' }],
]) {
  try {
    const f = new FontFace(family, `url(${url})`, { display: 'swap', ...desc })
    document.fonts.add(f)
    f.load().catch(() => {})
  } catch {}
}

// No StrictMode: the film owns a single WebGL context for the lifetime of the page.
createRoot(document.getElementById('root')).render(<App />)
