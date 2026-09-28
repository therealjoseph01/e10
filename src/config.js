// Where the official E1O assets live. They are mirrored from e1o.com into /public/e1o with their original paths
// (run `npm run assets` to refresh them). A page can override the base with window.__E1O_ASSET_BASE.
const envBase = import.meta.env.VITE_E1O_ASSETS
// Opened straight from disk (the single-file preview), the browser can't fetch local files, so the assets come
// from e1o.com itself, which serves them with open CORS headers.
const fromDisk = typeof location !== 'undefined' && location.protocol === 'file:'
const fallbackBase = fromDisk ? 'https://e1o.com' : `${import.meta.env.BASE_URL}e1o`
export const ASSET_BASE = String(
  (typeof window !== 'undefined' && window.__E1O_ASSET_BASE != null ? window.__E1O_ASSET_BASE : envBase) ?? fallbackBase,
).replace(/\/$/, '')

export const asset = (p) => `${ASSET_BASE}/${p.replace(/^\//, '')}`

export const FIRMWARE = (name) => asset(`firmware/previews-a73dd5659814/${name}.png`)

export const ASSETS = {
  model: asset('assets/glasses-r35-meshopt.glb'),
  shadow: asset('assets/geometry-area-shadow.png'),
  poster: asset('assets/product-three-quarter.png'),
  posterTemple: asset('assets/product-temple.png'),
  cutout: asset('assets/hero-glasses-cutout.webp'),
  phone: asset('assets/phone-twitch-496-8cb9a9b05bae.webp'),
  wordmark: asset('assets/wordmark.svg'),
  displayFont: asset('assets/display.woff'),
  handFont: asset('assets/lettering/PatrickHand-Regular.woff2'),
}

export const LINKS = {
  waitlist: 'https://e1o.com/waitlist',
  email: 'mailto:maceo@datost.com?subject=E1O%20early%20access',
  privacy: 'https://e1o.com/privacy',
  terms: 'https://e1o.com/terms',
  inspect: 'https://e1o.com/glasses.html',
}

const mq = (q) => typeof window !== 'undefined' && window.matchMedia && window.matchMedia(q).matches

export const device = (() => {
  if (typeof window === 'undefined') return { mobile: false, touch: false, tier: 2 }
  const touch = mq('(pointer: coarse)')
  const small = Math.min(window.innerWidth, window.innerHeight) < 700
  const mobile = touch && small
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 8
  // tier 2: desktop class. tier 1: phones and small laptops. tier 0: very weak devices.
  const tier = mobile ? (cores <= 4 || mem <= 3 ? 0 : 1) : cores <= 2 ? 1 : 2
  return { mobile, touch, tier }
})()

export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)')

export const DEBUG = typeof location !== 'undefined' && /~d\b/.test(location.hash)
