import * as THREE from 'three'
import { SetBuilder, canvasTexture } from './kit.js'
import { makeFigure } from './figure.js'
import { inkMaterial, outlineMaterial } from './ink.js'

// Every place the day passes through. Units are metres, y is up, and yaw 0 looks toward -Z.
// Layout (top view): the office at the origin, a hallway running east, Garden Lane outside, the meeting pavilion
// at x≈50, a street crossing beyond it. The restaurant, the blank page, the stage and the gym are elsewhere.

// ----------------------------------------------------------------------------------------------------------------
// Shared bits

function mullionWall(s, { axis = 'z', at, from, to, y0 = 0, y1 = 3, step = 0.9, rails = [], thick = 0.06, depth = 0.1, tone = 0.08, skip = [] }) {
  // A wall of glass: only the frame is solid.
  const n = Math.max(1, Math.round((to - from) / step))
  for (let i = 0; i <= n; i++) {
    const p = from + ((to - from) * i) / n
    if (skip.some(([a, b]) => p > a && p < b)) continue
    if (axis === 'z') s.box(thick, y1 - y0, depth, p, (y0 + y1) / 2, at, { tone })
    else s.box(depth, y1 - y0, thick, at, (y0 + y1) / 2, p, { tone })
  }
  for (const y of [y0, y1, ...rails]) {
    const segs = skip.length && y < 2.3 && y > y0 + 0.01 ? splitSpan(from, to, skip) : [[from, to]]
    for (const [a, b] of segs) {
      if (axis === 'z') s.box(b - a, thick, depth, (a + b) / 2, y, at, { tone })
      else s.box(depth, thick, b - a, at, y, (a + b) / 2, { tone })
    }
  }
}
function splitSpan(a, b, skip) {
  const out = []
  let cur = a
  for (const [s0, s1] of skip.slice().sort((x, y) => x[0] - y[0])) {
    if (s0 > cur) out.push([cur, s0])
    cur = Math.max(cur, s1)
  }
  if (cur < b) out.push([cur, b])
  return out
}

function tree(s, x, z, h = 2.3, r = 1.05, tone = 0.58) {
  s.cyl(0.07, 0.1, h, x, h / 2, z, { tone: 0.14, seg: 10, outline: 0.012 })
  const g = new THREE.IcosahedronGeometry(r, 1)
  const m = new THREE.Mesh(g, inkMaterial(tone))
  m.position.set(x, h + r * 0.62, z)
  m.scale.set(1, 1.12, 1)
  m.rotation.set(x * 0.3, z * 0.7, 0)
  s.add(m, { edges: false, outline: 0.03 })
}

function chair(s, x, z, rot = 0, tone = 0.12) {
  const c = Math.cos(rot)
  const sn = Math.sin(rot)
  const P = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c]
  let p = P(0, 0)
  s.box(0.44, 0.04, 0.42, p[0], 0.46, p[1], { tone, rot })
  p = P(0, -0.2)
  s.box(0.44, 0.44, 0.03, p[0], 0.7, p[1], { tone, rot })
  for (const [lx, lz] of [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]]) {
    p = P(lx, lz)
    s.box(0.03, 0.46, 0.03, p[0], 0.23, p[1], { tone, rot, edges: false })
  }
}

function table(s, x0, z0, x1, z1, { y = 0.74, tone = 0.96, legTone = 0.12 } = {}) {
  s.slab(x0, y - 0.035, z0, x1, y, z1, { tone })
  for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x1 - 0.06, z0 + 0.06], [x0 + 0.06, z1 - 0.06], [x1 - 0.06, z1 - 0.06]]) {
    s.box(0.04, y - 0.035, 0.04, x, (y - 0.035) / 2, z, { tone: legTone })
  }
}

function glassOfWater(s, x, y, z) {
  s.cyl(0.032, 0.028, 0.1, x, y + 0.05, z, { tone: 0.95, seg: 18, outline: 0.0025, edges: false })
}

function drawing(kind) {
  return canvasTexture(512, 640, (c, w, h) => {
    c.fillStyle = '#f6f5f1'
    c.fillRect(0, 0, w, h)
    c.strokeStyle = '#161616'
    c.lineWidth = 5
    c.lineCap = 'round'
    c.lineJoin = 'round'
    if (kind === 'glasses') {
      // a quick line drawing of eyewear (a nod to the comic's poster)
      const cy = h * 0.5
      c.beginPath()
      c.ellipse(w * 0.32, cy, 86, 74, 0, 0, Math.PI * 2)
      c.ellipse(w * 0.68, cy, 86, 74, 0, 0, Math.PI * 2)
      c.moveTo(w * 0.32 + 86, cy - 14)
      c.quadraticCurveTo(w * 0.5, cy - 44, w * 0.68 - 86, cy - 14)
      c.moveTo(w * 0.32 - 86, cy - 20)
      c.lineTo(w * 0.06, cy - 60)
      c.moveTo(w * 0.68 + 86, cy - 20)
      c.lineTo(w * 0.94, cy - 60)
      c.stroke()
    } else if (kind === 'box') {
      c.beginPath()
      const cx = w / 2
      const cy = h / 2
      const a = 140
      const b = 70
      const hh = 60
      c.moveTo(cx - a, cy)
      c.lineTo(cx, cy - b)
      c.lineTo(cx + a, cy)
      c.lineTo(cx, cy + b)
      c.closePath()
      c.moveTo(cx - a, cy)
      c.lineTo(cx - a, cy + hh)
      c.lineTo(cx, cy + b + hh)
      c.lineTo(cx + a, cy + hh)
      c.lineTo(cx + a, cy)
      c.moveTo(cx, cy + b)
      c.lineTo(cx, cy + b + hh)
      c.stroke()
    } else if (kind === 'still') {
      c.fillStyle = '#1a1a1a'
      c.beginPath()
      c.ellipse(w * 0.35, h * 0.62, 90, 60, 0, 0, Math.PI * 2)
      c.fill()
      c.fillRect(w * 0.58, h * 0.3, 40, 220)
      c.fillRect(w * 0.56, h * 0.25, 48, 20)
      c.beginPath()
      c.arc(w * 0.72, h * 0.66, 44, 0, Math.PI * 2)
      c.stroke()
    }
  })
}

function sign(text, w = 512, h = 128) {
  return canvasTexture(w, h, (c) => {
    c.fillStyle = '#f4f2ed'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#141414'
    c.font = `600 ${Math.round(h * 0.42)}px "Inter Tight Variable", Arial, sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.letterSpacing = '6px'
    c.fillText(text, w / 2, h / 2 + 2)
  })
}

// ----------------------------------------------------------------------------------------------------------------
// The laptop screen: a canvas the director redraws when its state changes.

export function makeLaptopScreen() {
  const W = 1024
  const H = 640
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  let last = ''
  const mono = '"SFMono-Regular", Menlo, Consolas, monospace'

  function draw(state) {
    const key = JSON.stringify(state)
    if (key === last) return
    last = key
    ctx.fillStyle = '#0e0e0e'
    ctx.fillRect(0, 0, W, H)
    ctx.font = `28px ${mono}`
    ctx.textBaseline = 'top'
    // title bar
    ctx.fillStyle = '#1c1c1c'
    ctx.fillRect(0, 0, W, 44)
    ctx.fillStyle = '#6a6a6a'
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(26 + i * 26, 22, 7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#9a9a9a'
    ctx.font = `22px ${mono}`
    ctx.fillText('login — agent session', 110, 11)
    ctx.font = `28px ${mono}`
    const rows = []
    if (state.mode === 'edit') {
      rows.push(['#7d7d7d', '  export async function signIn(email) {'])
      rows.push(['#dcdcdc', '    const code = await sendCode(email)'])
      rows.push(['#dcdcdc', '    return verify(code)'])
      rows.push(['#7d7d7d', '  }'])
      rows.push(['', ''])
      rows.push(['#f2f2f2', '> fix login'])
      rows.push(['#f2f2f2', '  run tests.'])
    } else {
      rows.push(['#f2f2f2', '> Run the tests.'])
      rows.push(['#8a8a8a', '  Updating the login flow…'])
      const n = state.done || 0
      for (let i = 0; i < Math.min(n, 9); i++) rows.push(['#d4d4d4', `  ✓ test ${String(i + 1).padStart(2, '0')}`])
      rows.push(['#f2f2f2', n >= 12 ? '  12 / 12 passed' : `  running ${n} / 12`])
    }
    rows.forEach(([col, text], i) => {
      if (!col) return
      ctx.fillStyle = col
      ctx.fillText(text, 36, 70 + i * 44)
    })
    if (state.cursor) {
      ctx.fillStyle = '#f2f2f2'
      ctx.fillRect(36, 70 + rows.length * 44, 16, 30)
    }
    tex.needsUpdate = true
  }
  draw({ mode: 'edit', cursor: true })
  return { tex, draw }
}

// ----------------------------------------------------------------------------------------------------------------

export function buildOffice(laptop) {
  const s = new SetBuilder('office')
  // shell
  s.slab(-3.5, -0.05, -2.6, 3.5, 0, 3.6, { tone: 0.42, cast: false })
  s.slab(-3.5, 3.2, -2.6, 3.5, 3.3, 3.6, { tone: 0.94 })
  s.slab(-3.6, 0, -2.6, -3.5, 3.2, 3.6, { tone: 0.86 })
  s.slab(-3.5, 0, 3.6, 3.5, 3.2, 3.7, { tone: 0.86 })
  // east wall with the door to the hallway (z 1.8…2.8)
  s.slab(3.5, 0, -2.6, 3.6, 3.2, 1.8, { tone: 0.86 })
  s.slab(3.5, 0, 2.8, 3.6, 3.2, 3.6, { tone: 0.86 })
  s.slab(3.5, 2.2, 1.8, 3.6, 3.2, 2.8, { tone: 0.86 })
  s.box(0.04, 2.2, 0.06, 3.5, 1.1, 1.8, { tone: 0.1 })
  s.box(0.04, 2.2, 0.06, 3.5, 1.1, 2.8, { tone: 0.1 })
  // the big gridded window (north)
  s.slab(-3.5, 0, -2.62, 3.5, 0.32, -2.5, { tone: 0.1 })
  mullionWall(s, { axis: 'z', at: -2.56, from: -3.5, to: 3.5, y0: 0.32, y1: 3.2, step: 0.875, rails: [1.3, 2.35] })
  // outside: sky and a line-drawn skyline
  s.box(80, 30, 0.1, 0, 10, -40, { tone: 1, sky: true, edges: false, cast: false })
  // a line-drawn skyline, like the comic's window view: outlines on paper, no fills
  const sky = [[-11, 5.5, 3.5], [-7.5, 8.5, 3], [-4, 4.5, 3.6], [-0.5, 9.5, 3.2], [3, 6, 3.4], [6.5, 10.5, 2.8], [10, 5, 3.6], [13.5, 7.5, 3]]
  const zs = -30
  let prev = null
  for (const [x, h, w] of sky) {
    const x0 = x - w / 2
    const x1 = x + w / 2
    const y0 = -2
    if (prev) s.line(prev[0], prev[1], zs, x0, prev[1] < h ? prev[1] : h, zs)
    s.line(x0, y0, zs, x0, h, zs)
    s.line(x0, h, zs, x1, h, zs)
    s.line(x1, h, zs, x1, y0, zs)
    for (let y = 1; y < h - 0.8; y += 1.6) for (let xx = x0 + 0.5; xx < x1 - 0.4; xx += 0.9) s.line(xx, y, zs, xx + 0.4, y, zs)
    prev = [x1, h]
  }
  // desk
  table(s, -0.8, -1.32, 0.8, -0.6, { y: 0.76, tone: 0.96 })
  // laptop: base + hinged screen facing the wearer
  s.box(0.34, 0.016, 0.235, 0, 0.768, -0.93, { tone: 0.72 })
  const scr = new THREE.Group()
  scr.position.set(0, 0.776, -1.045)
  scr.rotation.x = -0.26
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.225, 0.008), inkMaterial(0.72))
  back.position.set(0, 0.1125, 0)
  back.castShadow = true
  scr.add(back)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.2), new THREE.MeshBasicMaterial({ map: laptop.tex, toneMapped: false }))
  face.position.set(0, 0.1125, 0.0045)
  scr.add(face)
  const edge = new THREE.Mesh(back.geometry, outlineMaterial(0.0015))
  edge.position.copy(back.position)
  scr.add(edge)
  s.group.add(scr)
  // on the desk
  s.cyl(0.042, 0.04, 0.095, 0.46, 0.81, -1.02, { tone: 0.08, outline: 0.003, edges: false })
  s.box(0.2, 0.012, 0.28, -0.46, 0.767, -0.98, { tone: 0.98, rot: 0.18 })
  s.box(0.16, 0.012, 0.23, -0.44, 0.779, -0.98, { tone: 0.2, rot: 0.1 })
  s.cyl(0.05, 0.26, 0.22, 0, 2.3, -0.96, { tone: 0.08, outline: 0.006, open: true })
  s.line(0, 2.41, -0.96, 0, 3.2, -0.96)
  // chair (the wearer's)
  chair(s, 0, -0.18, Math.PI)
  // credenza, books, pictures, plant
  s.slab(-3.5, 0, -1.2, -3.05, 0.78, 1.6, { tone: 0.9 })
  for (let i = 0; i < 6; i++) s.box(0.28, 0.24 + (i % 3) * 0.03, 0.05, -3.3, 0.9 + (i % 3) * 0.015, -0.7 + i * 0.06, { tone: i % 2 ? 0.15 : 0.92 })
  s.box(0.3, 0.06, 0.4, -3.28, 0.81, 0.9, { tone: 0.12 })
  s.picture(drawing('glasses'), 0.62, 0.78, -3.49, 1.75, -0.2, { rot: Math.PI / 2 })
  s.picture(drawing('box'), 0.62, 0.78, -3.49, 1.75, 0.8, { rot: Math.PI / 2 })
  s.cyl(0.16, 0.13, 0.36, 3.05, 0.18, -2.05, { tone: 0.15, outline: 0.006, edges: false })
  const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), inkMaterial(0.8))
  leaf.position.set(3.05, 0.78, -2.05)
  leaf.scale.set(1, 1.5, 1)
  s.add(leaf, { edges: false, outline: 0.012 })
  return { group: s.finish(), laptopScreen: scr }
}

export function buildHallway() {
  const s = new SetBuilder('hallway')
  const x0 = 3.6
  const x1 = 16
  s.slab(x0, -0.05, 1.2, x1, 0, 3.4, { tone: 0.6, cast: false })
  s.slab(x0, 2.8, 1.2, x1, 2.9, 3.4, { tone: 0.95 })
  // south wall with doors
  s.slab(x0, 0, 3.3, x1, 2.8, 3.4, { tone: 0.88 })
  for (const x of [6.2, 9.8, 13.2]) {
    s.box(0.95, 2.1, 0.04, x, 1.05, 3.28, { tone: 0.2 })
    s.box(0.1, 0.03, 0.05, x + 0.33, 1.02, 3.24, { tone: 0.8 })
  }
  // north wall: a low wall with a long window band, the sun comes through it
  s.slab(x0, 0, 1.2, x1, 0.9, 1.3, { tone: 0.88 })
  s.slab(x0, 2.35, 1.2, x1, 2.8, 1.3, { tone: 0.88 })
  mullionWall(s, { axis: 'z', at: 1.25, from: x0, to: x1, y0: 0.9, y1: 2.35, step: 1.25, rails: [1.6] })
  // ceiling lights
  for (let x = 5; x < x1; x += 2.6) s.box(1.1, 0.03, 0.36, x, 2.79, 2.3, { tone: 1, flat: true, cast: false })
  // glass door at the end
  mullionWall(s, { axis: 'x', at: x1, from: 1.2, to: 3.4, y0: 0, y1: 2.8, step: 1.1, rails: [2.2], skip: [[1.8, 2.8]] })
  // outside, seen through the window band: trees and a far wall
  for (let x = 5; x < 16; x += 3.4) tree(s, x, -2.5 - (x % 2), 2.2, 1.0, 0.62)
  s.box(26, 20, 0.1, 17, 8, -9, { tone: 1, sky: true, edges: false, cast: false })
  return { group: s.finish() }
}

export function buildGarden() {
  const s = new SetBuilder('garden')
  s.slab(16, -0.06, -14, 80, -0.01, 16, { tone: 0.74, cast: false, edges: false })
  // the lane
  s.slab(16, -0.01, 1.45, 46.2, 0.01, 3.15, { tone: 0.95, cast: false })
  for (let x = 16.8; x < 46; x += 0.8) s.line(x, 0.012, 1.45, x, 0.012, 3.15)
  // hedges with gaps
  for (let x = 17.5; x < 45; x += 4.2) {
    s.slab(x, 0, 0.75, x + 3.1, 0.62, 1.3, { tone: 0.55 })
    if (Math.abs(x - 29.6) > 1) s.slab(x + 0.8, 0, 3.3, x + 3.9, 0.62, 3.85, { tone: 0.55 })
  }
  for (const [x, z] of [[19, -0.8], [24.5, 5.4], [26.5, -1.2], [33.5, 5.6], [36, -0.7], [41.5, 5.2], [44, -1.1], [21, 6.2], [38.5, -4.5], [23, -5], [29, -6.2]]) tree(s, x, z, 2.2 + (x % 3) * 0.2, 1.0 + (z % 2) * 0.1)
  // lamp posts
  for (const x of [21.4, 31.4, 41.4]) {
    s.cyl(0.035, 0.05, 3.2, x, 1.6, 1.05, { tone: 0.1, seg: 10 })
    s.box(0.34, 0.08, 0.16, x, 3.2, 1.2, { tone: 0.1 })
  }
  // bench
  s.box(1.6, 0.05, 0.42, 27.5, 0.45, 4.05, { tone: 0.2 })
  s.box(1.6, 0.36, 0.05, 27.5, 0.7, 4.26, { tone: 0.2 })
  for (const dx of [-0.7, 0.7]) s.box(0.06, 0.45, 0.42, 27.5 + dx, 0.22, 4.05, { tone: 0.1 })
  // sign
  s.cyl(0.03, 0.03, 1.9, 17.4, 0.95, 1.05, { tone: 0.1, seg: 8 })
  s.picture(sign('GARDEN LANE'), 0.72, 0.18, 17.4, 1.85, 1.08, { rot: -Math.PI / 2 + 0.25, frame: 0.012, frameTone: 0.1, depth: 0.03 })

  // café corner (Find your use: translation)
  s.cyl(0.36, 0.36, 0.035, 30, 0.74, -2.5, { tone: 0.96, seg: 28 })
  s.cyl(0.03, 0.03, 0.72, 30, 0.37, -2.5, { tone: 0.12, seg: 8 })
  chair(s, 30, -3.12, 0, 0.14)
  chair(s, 30, -1.88, Math.PI, 0.14)
  glassOfWater(s, 29.85, 0.757, -2.3)
  glassOfWater(s, 30.15, 0.757, -2.72)
  const friend = makeFigure({ pose: 'sit', arms: 'table', clothes: 0.86, shirt: 0.86, hair: 0.1, hairStyle: 'long', tableY: 0.74 })
  friend.position.set(30, 0, -3.05)
  s.group.add(friend)
  s.anchors.friend = friend

  // buildings around
  const bld = [[20, -16, 10, 9], [34, -18, 12, 12], [50, -15, 9, 8], [26, 16, 12, 10], [42, 17, 10, 7]]
  for (const [x, z, w, h] of bld) {
    s.box(w, h, 6, x, h / 2, z, { tone: 0.9, cast: false })
    const face = z < 0 ? z + 3.02 : z - 3.02
    for (let y = 1.4; y < h - 0.8; y += 1.5) s.line(x - w / 2 + 0.3, y, face, x + w / 2 - 0.3, y, face)
    for (let xx = x - w / 2 + 1; xx < x + w / 2; xx += 1.3) s.line(xx, 0.8, face, xx, h - 0.6, face)
  }
  s.box(200, 60, 0.1, 40, 20, -45, { tone: 1, sky: true, edges: false, cast: false })
  s.box(200, 60, 0.1, 40, 20, 45, { tone: 1, sky: true, edges: false, cast: false })
  s.box(0.1, 60, 200, 110, 20, 0, { tone: 1, sky: true, edges: false, cast: false })

  // the street crossing beyond the pavilion (Find your use: directions)
  s.slab(58, -0.005, -14, 64, 0.005, 16, { tone: 0.48, cast: false })
  s.slab(56, 0, -14, 58, 0.14, 16, { tone: 0.85 })
  s.slab(64, 0, -14, 66, 0.14, 16, { tone: 0.85 })
  for (let z = 1.6; z < 3.2; z += 0.5) s.box(5.6, 0.012, 0.28, 61, 0.012, z, { tone: 0.98, cast: false, edges: false })
  for (let z = -13; z < 16; z += 3) s.box(0.14, 0.012, 1.4, 61, 0.012, z, { tone: 0.95, cast: false, edges: false })
  s.slab(46.2, -0.01, 1.45, 58, 0.01, 3.15, { tone: 0.95, cast: false })
  for (const [x, z, w, h] of [[71, -6, 8, 11], [71, 5, 8, 8], [71, 14, 8, 13], [80, -1, 6, 16]]) {
    s.box(w, h, 8, x, h / 2, z, { tone: 0.88, cast: false })
    for (let y = 1.4; y < h - 0.8; y += 1.5) s.line(x - w / 2 - 0.01, y, z - 3.7, x - w / 2 - 0.01, y, z + 3.7)
  }
  s.cyl(0.04, 0.04, 2.8, 57.4, 1.4, 1.2, { tone: 0.1, seg: 8 })
  s.box(0.24, 0.6, 0.2, 57.4, 2.6, 1.2, { tone: 0.1 })
  return { group: s.finish(), anchors: s.anchors }
}

export function buildPavilion() {
  const s = new SetBuilder('pavilion')
  const X0 = 46.2
  const X1 = 55
  const Z0 = -1.5
  const Z1 = 4.5
  s.slab(X0, -0.02, Z0, X1, 0.04, Z1, { tone: 0.9, cast: false })
  s.slab(X0 - 0.2, 3.0, Z0 - 0.2, X1 + 0.2, 3.16, Z1 + 0.2, { tone: 0.16 })
  mullionWall(s, { axis: 'z', at: Z0, from: X0, to: X1, y0: 0.04, y1: 3.0, step: 1.1, rails: [2.4] })
  mullionWall(s, { axis: 'z', at: Z1, from: X0, to: X1, y0: 0.04, y1: 3.0, step: 1.1, rails: [2.4] })
  mullionWall(s, { axis: 'x', at: X1, from: Z0, to: Z1, y0: 0.04, y1: 3.0, step: 1.0, rails: [2.4] })
  mullionWall(s, { axis: 'x', at: X0, from: Z0, to: Z1, y0: 0.04, y1: 3.0, step: 1.0, rails: [2.4], skip: [[1.75, 2.85]] })
  // meeting table
  table(s, 49.1, 0.6, 51.9, 1.75, { y: 0.75 })
  chair(s, 50.5, 2.32, Math.PI, 0.13)
  chair(s, 50.5, 0.05, 0, 0.13)
  chair(s, 49.55, 0.05, 0, 0.13)
  chair(s, 51.45, 2.32, Math.PI, 0.13)
  s.box(0.22, 0.012, 0.3, 50.35, 0.762, 0.95, { tone: 0.98, rot: -0.15 })
  s.box(0.02, 0.01, 0.16, 50.53, 0.77, 0.98, { tone: 0.1, rot: 0.4 })
  s.box(0.33, 0.018, 0.23, 51.35, 0.764, 0.95, { tone: 0.7, rot: 0.1 })
  glassOfWater(s, 49.9, 0.752, 1.05)
  glassOfWater(s, 50.8, 0.752, 1.55)
  // the colleague
  const colleague = makeFigure({ pose: 'sit', arms: 'table', clothes: 0.12, shirt: 0.93, hair: 0.07, tableY: 0.75 })
  colleague.position.set(50.5, 0, 0.18)
  s.group.add(colleague)
  return { group: s.finish(), colleague }
}

export function buildRestaurant() {
  const s = new SetBuilder('restaurant')
  s.slab(-4, -0.05, -4.2, 4, 0, 4, { tone: 0.34, cast: false })
  s.slab(-4, 3, -4.2, 4, 3.1, 4, { tone: 0.12 })
  s.slab(-4, 0, -4.3, 4, 3, -4.2, { tone: 0.2 })
  s.slab(-4.1, 0, -4.2, -4, 3, 4, { tone: 0.12 })
  s.slab(4, 0, -4.2, 4.1, 3, 4, { tone: 0.12 })
  s.slab(-4, 0, 4, 4, 3, 4.1, { tone: 0.2 })
  // wainscot
  s.slab(-4, 0, -4.2, 4, 1.0, -4.12, { tone: 0.08 })
  // shelves with bottles (as in the comic)
  s.slab(-1.6, 0.95, -4.2, 1.6, 2.7, -3.85, { tone: 0.5 })
  for (const y of [1.35, 1.8, 2.25]) {
    s.slab(-1.55, y - 0.02, -4.18, 1.55, y, -3.87, { tone: 0.94 })
    for (let i = 0; i < 9; i++) {
      const x = -1.35 + i * 0.34
      const dark = (i + Math.round(y * 10)) % 3 !== 0
      s.cyl(0.04, 0.04, 0.22, x, y + 0.11, -4.02, { tone: dark ? 0.08 : 0.85, seg: 12, edges: false, outline: 0.003 })
      s.cyl(0.013, 0.02, 0.08, x, y + 0.26, -4.02, { tone: dark ? 0.08 : 0.85, seg: 8, edges: false })
    }
  }
  s.picture(drawing('still'), 0.9, 0.7, -3.99, 1.8, -1.6, { rot: Math.PI / 2, frameTone: 0.85 })
  // our table
  s.cyl(0.46, 0.46, 0.035, 0, 0.75, -0.72, { tone: 0.97, seg: 32 })
  s.cyl(0.04, 0.04, 0.72, 0, 0.37, -0.72, { tone: 0.1, seg: 10 })
  s.cyl(0.26, 0.26, 0.02, 0, 0.01, -0.72, { tone: 0.1, seg: 24 })
  s.cyl(0.13, 0.13, 0.012, 0, 0.774, -0.42, { tone: 0.99, seg: 28, outline: 0.002, edges: false })
  s.cyl(0.13, 0.13, 0.012, 0, 0.774, -1.02, { tone: 0.99, seg: 28, outline: 0.002, edges: false })
  s.box(0.22, 0.008, 0.3, -0.26, 0.772, -0.5, { tone: 0.1, rot: 0.3 })
  for (const [x, z] of [[0.22, -0.52], [-0.18, -0.95]]) {
    s.cyl(0.004, 0.004, 0.12, x, 0.83, z, { tone: 0.9, seg: 6, edges: false })
    s.sphere(0.045, x, 0.93, z, { tone: 0.92, sy: 1.1, outline: 0.002 })
  }
  s.cyl(0.018, 0.018, 0.09, 0.08, 0.81, -0.8, { tone: 0.98, seg: 10, emissive: 0.6, edges: false, outline: 0.002 })
  chair(s, 0, 0.05, Math.PI, 0.1)
  chair(s, 0, -1.5, 0, 0.1)
  // pendants
  for (const [x, z] of [[0, -0.72], [-2.2, -2.3], [2.3, -2.6]]) {
    s.cyl(0.03, 0.2, 0.18, x, 1.95, z, { tone: 0.08, outline: 0.005, open: true })
    s.sphere(0.05, x, 1.88, z, { tone: 1, emissive: 1, outline: 0 })
    s.line(x, 2.04, z, x, 3, z)
  }
  // other tables and guests
  for (const [x, z, r] of [[-2.2, -2.3, 0], [2.3, -2.6, 0]]) {
    s.cyl(0.42, 0.42, 0.035, x, 0.75, z, { tone: 0.95, seg: 28 })
    s.cyl(0.04, 0.04, 0.72, x, 0.37, z, { tone: 0.1, seg: 10 })
    const g = makeFigure({ pose: 'sit', arms: 'table', clothes: r ? 0.85 : 0.12, shirt: 0.9, lite: false, tableY: 0.75, hairStyle: x < 0 ? 'long' : 'short' })
    g.position.set(x, 0, z - 0.55)
    s.group.add(g)
  }
  // the waiter
  const waiter = makeFigure({ pose: 'stand', arms: 'pad', clothes: 0.1, shirt: 0.95, apron: true })
  waiter.position.set(1.25, 0, -1.3)
  waiter.rotation.y = -0.7
  s.group.add(waiter)
  return { group: s.finish(), waiter }
}

export function buildVoid() {
  const s = new SetBuilder('void')
  s.slab(-60, -0.06, -90, 60, -0.01, 30, { tone: 1, flat: true, edges: false, cast: false })
  for (let x = -14; x <= 14; x += 2) s.line(x, 0, -26, x, 0, 20)
  for (let z = -26; z <= 20; z += 2) s.line(-14, 0, z, 14, 0, z)
  return { group: s.finish() }
}

export function buildStage() {
  const s = new SetBuilder('stage')
  s.slab(-7, -0.05, -4, 7, 0, 8, { tone: 0.3, cast: false })
  s.slab(-5, 0, -4, 5, 0.6, -1, { tone: 0.16 })
  s.slab(-7, 0, 8, 7, 5, 8.1, { tone: 0.2 })
  s.slab(-7.1, 0, -4, -7, 5, 8, { tone: 0.24 })
  s.slab(7, 0, -4, 7.1, 5, 8, { tone: 0.24 })
  s.box(0.5, 0.18, 0.04, 5.6, 2.6, 7.98, { tone: 1, emissive: 1, flat: true, cast: false })
  // podium
  s.box(0.62, 1.05, 0.46, 0, 0.6 + 0.525, -1.45, { tone: 0.12 })
  s.box(0.66, 0.03, 0.5, 0, 1.66, -1.43, { tone: 0.1, rotX: 0.2 })
  // audience
  let k = 0
  for (let row = 0; row < 5; row++) {
    const z = 0.8 + row * 1.2
    for (let i = 0; i < 9; i++) {
      const x = -4 + i * 1.0 + (row % 2) * 0.3
      s.box(0.5, 0.45, 0.5, x, 0.23, z + 0.05, { tone: 0.12, edges: false })
      s.box(0.5, 0.5, 0.06, x, 0.7, z + 0.3, { tone: 0.12, edges: false })
      k++
      if ((k * 7) % 10 < 7) {
        const f = makeFigure({ pose: 'sit', arms: 'lap', lite: true, clothes: (k % 3) * 0.35 + 0.1, skin: 0.9, hairStyle: k % 4 ? 'short' : 'long' })
        f.position.set(x, 0, z + 0.1)
        f.rotation.y = Math.PI
        s.group.add(f)
      }
    }
  }
  return { group: s.finish() }
}

export function buildGym() {
  const s = new SetBuilder('gym')
  s.slab(-5, -0.05, -3.6, 5, 0, 4, { tone: 0.26, cast: false })
  s.slab(-5, 3.4, -3.6, 5, 3.5, 4, { tone: 0.92 })
  s.slab(-5.1, 0, -3.6, -5, 3.4, 4, { tone: 0.86 })
  s.slab(5, 0, -3.6, 5.1, 3.4, 4, { tone: 0.86 })
  s.slab(-5, 0, -3.62, 5, 0.5, -3.5, { tone: 0.12 })
  mullionWall(s, { axis: 'z', at: -3.56, from: -5, to: 5, y0: 0.5, y1: 3.4, step: 1.25, rails: [2.2] })
  s.box(80, 30, 0.1, 0, 10, -30, { tone: 1, sky: true, edges: false, cast: false })
  for (const [x, z] of [[-8, -12], [-2, -16], [5, -11]]) tree(s, x, z, 2.6, 1.5, 0.66)
  // mats, rack, kettlebells, bench
  s.box(1.0, 0.02, 1.8, 0, 0.01, -0.3, { tone: 0.12, cast: false })
  s.slab(-4.8, 0, -2.6, -4.3, 1.2, 1.6, { tone: 0.15 })
  for (let i = 0; i < 6; i++) {
    for (const y of [0.35, 0.85]) {
      s.cyl(0.07, 0.07, 0.3, -4.4, y, -2.2 + i * 0.6, { tone: 0.08, rotX: Math.PI / 2, seg: 14, edges: false, outline: 0.004 })
    }
  }
  for (const x of [2.4, 2.8, 3.2]) {
    s.sphere(0.13, x, 0.13, -2.4, { tone: 0.1, outline: 0.004 })
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 18), inkMaterial(0.1))
    h.position.set(x, 0.29, -2.4)
    s.add(h, { edges: false, outline: 0.004 })
  }
  s.box(1.2, 0.08, 0.32, 2.8, 0.45, 0.8, { tone: 0.15 })
  for (const dx of [-0.45, 0.45]) s.box(0.06, 0.42, 0.3, 2.8 + dx, 0.21, 0.8, { tone: 0.1 })
  return { group: s.finish() }
}
