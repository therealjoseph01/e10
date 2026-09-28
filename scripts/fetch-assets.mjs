// Mirror E1O's official assets from e1o.com into public/e1o, keeping their original paths.
// Run with `npm run assets` whenever the live site updates its model, firmware previews or brand files.
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ORIGIN = 'https://e1o.com'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'e1o')
const FW = 'firmware/previews-a73dd5659814'

const FILES = [
  'assets/glasses-r35-meshopt.glb',
  'assets/geometry-area-shadow.png',
  'assets/product-three-quarter.png',
  'assets/product-temple.png',
  'assets/hero-glasses-cutout.webp',
  'assets/hero-glasses-ground.webp',
  'assets/phone-twitch-496-8cb9a9b05bae.webp',
  'assets/wordmark.svg',
  'assets/display.woff',
  'assets/e1o-share.png',
  'assets/lettering/PatrickHand-Regular.woff2',
  'favicon.svg',
  'favicon-32.png',
  'apple-touch-icon.png',
  ...['dashboard', 'translation', 'twitch', 'teleprompter', 'coding', 'conversate', 'hero-translation', 'agent', 'navigation', 'workout', 'workout-logged'].map((k) => `${FW}/${k}.png`),
]

let bytes = 0
for (const f of FILES) {
  const res = await fetch(`${ORIGIN}/${f}`)
  if (!res.ok) {
    console.warn(`skip ${f} (${res.status})`)
    continue
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const dest = join(OUT, f)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  bytes += buf.length
  console.log(`${(buf.length / 1024).toFixed(0).padStart(6)} KB  ${f}`)
}
console.log(`\n${FILES.length} files, ${(bytes / 1048576).toFixed(2)} MB → public/e1o`)
