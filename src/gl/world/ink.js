import * as THREE from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

// The world seen through the glasses is drawn in the language of E1O's official comic: paper, ink, hard window
// light and a halftone screen for shade. One set of uniforms is shared by every ink material, so a lighting
// preset changes the whole world at once.

export const INK = {
  uCell: { value: 3.4 },
  uPaper: { value: new THREE.Color(0xf4f2ed) },
  uInk: { value: new THREE.Color(0x121212) },
  uLift: { value: 0.0 }, // brightens the world (fog of daylight)
  uDim: { value: 1.0 }, // global exposure of the world (dips to black at cuts)
  uSky: { value: 1.0 }, // brightness of the sky behind windows
  uLo: { value: 0.2 }, // tone curve: below this is solid ink
  uHi: { value: 0.84 }, // above this is clean paper
}

const HALFTONE = /* glsl */ `
  {
    vec3 lin = gl_FragColor.rgb;
    float y = dot(lin, vec3(0.2126, 0.7152, 0.0722));
    y = pow(clamp(y, 0.0, 1.0), 0.4545);
    y = smoothstep(uLo, uHi, y);
    y = clamp(y + uLift, 0.0, 1.0);
    float ink = 1.0 - y;
    vec2 p = gl_FragCoord.xy / uCell;
    p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * p;
    vec2 f = fract(p) - 0.5;
    float d = length(f);
    float r = sqrt(ink) * 0.66;
    float aa = max(fwidth(d), 0.02);
    float dotv = 1.0 - smoothstep(r - aa, r + aa, d);
    dotv = max(dotv, smoothstep(0.86, 0.96, ink));
    dotv *= smoothstep(0.05, 0.13, ink);
    gl_FragColor.rgb = mix(uPaper, uInk, dotv) * uDim;
  }
`

function inject(shader) {
  Object.assign(shader.uniforms, INK)
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nuniform float uCell;\nuniform vec3 uPaper;\nuniform vec3 uInk;\nuniform float uLift;\nuniform float uDim;\nuniform float uLo;\nuniform float uHi;',
    )
    .replace('#include <tonemapping_fragment>', HALFTONE)
}

const cache = new Map()

// tone: albedo 0 (ink) … 1 (paper). emissive: 0…1 self light (screens, lamps).
export function inkMaterial(tone = 0.9, { emissive = 0, side = THREE.FrontSide, flat = false, sky = false } = {}) {
  const key = `${tone.toFixed(3)}|${emissive.toFixed(3)}|${side}|${flat}|${sky}`
  if (cache.has(key)) return cache.get(key)
  const c = new THREE.Color().setRGB(tone, tone, tone, THREE.SRGBColorSpace)
  let m
  if (flat || sky) {
    // Unlit paper (the sky behind windows, light panels). Sky follows the time of day.
    m = new THREE.MeshBasicMaterial({ color: c, side, toneMapped: false, fog: !sky })
    m.onBeforeCompile = (s) => {
      Object.assign(s.uniforms, { uDim: INK.uDim, uPaper: INK.uPaper, uSky: INK.uSky })
      s.fragmentShader = s.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uDim;\nuniform float uSky;\nuniform vec3 uPaper;')
        .replace('#include <tonemapping_fragment>', `gl_FragColor.rgb = gl_FragColor.rgb * uPaper * uDim${sky ? ' * uSky' : ''};`)
    }
    m.customProgramCacheKey = () => (sky ? 'inksky' : 'inkflat')
    cache.set(key, m)
    return m
  } else {
    m = new THREE.MeshLambertMaterial({ color: c, side, toneMapped: false })
    if (emissive > 0) m.emissive = new THREE.Color().setRGB(emissive, emissive, emissive, THREE.SRGBColorSpace)
    m.onBeforeCompile = inject
  }
  m.customProgramCacheKey = () => 'ink'
  cache.set(key, m)
  return m
}

// A textured ink surface (the laptop screen, framed drawings). The texture is multiplied into the albedo.
export function inkTextured(map, { emissive = 0 } = {}) {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff, map, toneMapped: false })
  if (emissive > 0) {
    m.emissive = new THREE.Color(1, 1, 1)
    m.emissiveMap = map
    m.emissiveIntensity = emissive
  }
  m.onBeforeCompile = inject
  m.customProgramCacheKey = () => 'inktex'
  return m
}

// Outline for smooth shapes (people, mugs, lamp shades): the inverted hull.
const OUTLINES = new Map()
export function outlineMaterial(width = 0.006) {
  const key = width.toFixed(4)
  if (OUTLINES.has(key)) return OUTLINES.get(key)
  const m = new THREE.MeshBasicMaterial({ color: 0x0c0c0c, side: THREE.BackSide, toneMapped: false })
  m.onBeforeCompile = (s) => {
    s.uniforms.uDim = INK.uDim
    s.vertexShader = s.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>\n transformed += normalize(normal) * ${width.toFixed(4)};`,
    )
    Object.assign(s.uniforms, { uPaper: INK.uPaper, uLift: INK.uLift })
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uDim;\nuniform float uLift;\nuniform vec3 uPaper;')
      .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uPaper, clamp(uLift * 1.4, 0.0, 1.0)) * uDim;')
  }
  m.customProgramCacheKey = () => `outline${key}`
  OUTLINES.set(key, m)
  return m
}

export const LINE = new LineMaterial({
  color: 0x111111,
  linewidth: 1.25,
  worldUnits: false,
  transparent: false,
  toneMapped: false,
})
LINE.onBeforeCompile = (s) => {
  Object.assign(s.uniforms, { uDim: INK.uDim, uPaper: INK.uPaper, uLift: INK.uLift })
  s.fragmentShader = s.fragmentShader
    .replace('uniform float linewidth;', 'uniform float linewidth;\nuniform float uDim;\nuniform float uLift;\nuniform vec3 uPaper;')
    .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb, uPaper, clamp(uLift * 1.4, 0.0, 1.0)) * uDim;')
}

export function setLineResolution(w, h) {
  LINE.resolution.set(w, h)
}
