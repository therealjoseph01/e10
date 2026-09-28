import * as THREE from 'three'
import { inkMaterial, outlineMaterial } from './ink.js'

// People in the world, drawn like the comic's figures: dark clothes, white skin, black hair, an ink contour.
// They are scenery. Faces stay minimal on purpose.

const Y = new THREE.Vector3(0, 1, 0)
const geos = new Map()
const capsule = (r, len) => {
  const k = `c${r.toFixed(3)}|${len.toFixed(3)}`
  if (!geos.has(k)) geos.set(k, new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14))
  return geos.get(k)
}
const sphereGeo = (() => {
  let g
  return () => g || (g = new THREE.SphereGeometry(1, 22, 16))
})()
const capGeo = (() => {
  let g
  return () => g || (g = new THREE.SphereGeometry(1, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.56))
})()
const torsoGeo = (() => {
  const cache = new Map()
  return (h) => {
    const k = h.toFixed(3)
    if (cache.has(k)) return cache.get(k)
    const pts = [
      [0.0, 0], [0.145, 0.0], [0.155, 0.1], [0.15, 0.22], [0.172, 0.34], [0.19, 0.43], [0.18, 0.47], [0.12, 0.495], [0.0, 0.5],
    ].map(([r, y]) => new THREE.Vector2(r, y * (h / 0.5)))
    const g = new THREE.LatheGeometry(pts, 24)
    g.computeVertexNormals()
    cache.set(k, g)
    return g
  }
})()

function part(parent, geo, tone, { pos, scale, quat, outline = 0.007 } = {}) {
  const m = new THREE.Mesh(geo, inkMaterial(tone))
  if (pos) m.position.copy(pos)
  if (scale) m.scale.copy(scale)
  if (quat) m.quaternion.copy(quat)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  if (outline > 0) {
    const s = scale ? (scale.x + scale.y + scale.z) / 3 : 1
    const o = new THREE.Mesh(geo, outlineMaterial(outline / s))
    o.position.copy(m.position)
    o.scale.copy(m.scale)
    o.quaternion.copy(m.quaternion)
    parent.add(o)
  }
  return m
}

function limb(parent, a, b, r, tone) {
  const d = new THREE.Vector3().subVectors(b, a)
  const len = d.length()
  const q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize())
  return part(parent, capsule(r, len), tone, { pos: a.clone().add(b).multiplyScalar(0.5), quat: q })
}

const V = (x, y, z) => new THREE.Vector3(x, y, z)

// pose: 'sit' | 'stand'. arms: 'table' | 'side' | 'pad' | 'lap'. Faces +Z.
export function makeFigure({
  pose = 'sit',
  arms = 'table',
  clothes = 0.13,
  shirt = null,
  skin = 0.94,
  hair = 0.08,
  apron = false,
  lite = false,
  tableY = 0.75,
  hairStyle = 'short',
} = {}) {
  const g = new THREE.Group()
  const body = new THREE.Group()
  g.add(body)
  const sit = pose === 'sit'
  const hipY = sit ? 0.54 : 0.96
  const torsoH = 0.5
  const shY = hipY + torsoH - 0.06

  // legs
  if (!lite) {
    if (sit) {
      for (const s of [-1, 1]) {
        limb(body, V(s * 0.09, hipY - 0.04, 0.02), V(s * 0.1, hipY - 0.06, 0.42), 0.072, clothes)
        limb(body, V(s * 0.1, hipY - 0.07, 0.44), V(s * 0.1, 0.07, 0.46), 0.058, clothes)
        part(body, sphereGeo(), 0.08, { pos: V(s * 0.1, 0.04, 0.5), scale: V(0.05, 0.035, 0.1), outline: 0.004 })
      }
    } else {
      for (const s of [-1, 1]) {
        limb(body, V(s * 0.095, hipY - 0.02, 0), V(s * 0.1, 0.5, 0.01), 0.074, clothes)
        limb(body, V(s * 0.1, 0.5, 0.01), V(s * 0.1, 0.07, -0.01), 0.06, clothes)
        part(body, sphereGeo(), 0.08, { pos: V(s * 0.1, 0.04, 0.05), scale: V(0.052, 0.036, 0.12), outline: 0.004 })
      }
    }
    // pelvis
    part(body, sphereGeo(), clothes, { pos: V(0, hipY, 0), scale: V(0.16, 0.1, 0.12) })
  }

  // torso
  const chest = new THREE.Group()
  chest.position.set(0, hipY, 0)
  body.add(chest)
  part(chest, torsoGeo(torsoH), shirt ?? clothes, { scale: V(1, 1, 0.64) })
  if (apron) part(chest, new THREE.BoxGeometry(0.34, 0.62, 0.02), 0.1, { pos: V(0, -0.22, 0.105), outline: 0.004 })
  if (shirt != null && clothes !== shirt) {
    // a jacket over a light shirt: two dark panels
    for (const s of [-1, 1]) part(chest, new THREE.BoxGeometry(0.12, torsoH * 0.86, 0.02), clothes, { pos: V(s * 0.1, torsoH * 0.46, 0.105), quat: new THREE.Quaternion().setFromAxisAngle(Y, s * -0.22), outline: 0.003 })
  }
  for (const s of [-1, 1]) part(chest, sphereGeo(), shirt ?? clothes, { pos: V(s * 0.175, torsoH - 0.07, 0), scale: V(0.075, 0.07, 0.07) })

  // arms (in chest space)
  const sh = (s) => V(s * 0.2, torsoH - 0.08, 0)
  const armTone = clothes
  if (arms === 'table') {
    for (const s of [-1, 1]) {
      const e = V(s * 0.24, tableY - hipY + 0.04, 0.2)
      const h = V(s * 0.1, tableY - hipY + 0.04, 0.42)
      limb(chest, sh(s), e, 0.055, armTone)
      limb(chest, e, h, 0.048, armTone)
      part(chest, sphereGeo(), skin, { pos: h.clone().add(V(-s * 0.02, 0.0, 0.05)), scale: V(0.045, 0.03, 0.06), outline: 0.004 })
    }
  } else if (arms === 'pad') {
    // left hand holds a notepad at chest height, right hand a pen
    const eL = V(-0.24, 0.14, 0.12)
    const hL = V(-0.08, 0.3, 0.3)
    limb(chest, sh(-1), eL, 0.055, armTone)
    limb(chest, eL, hL, 0.048, armTone)
    part(chest, sphereGeo(), skin, { pos: hL, scale: V(0.045, 0.05, 0.035), outline: 0.004 })
    part(chest, new THREE.BoxGeometry(0.13, 0.17, 0.012), 0.97, { pos: V(-0.03, 0.34, 0.31), quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.9, 0.25, 0)), outline: 0.004 })
    const eR = V(0.25, 0.1, 0.1)
    const hR = V(0.08, 0.3, 0.33)
    limb(chest, sh(1), eR, 0.055, armTone)
    limb(chest, eR, hR, 0.048, armTone)
    part(chest, sphereGeo(), skin, { pos: hR, scale: V(0.045, 0.05, 0.035), outline: 0.004 })
  } else if (arms === 'lap' || lite) {
    for (const s of [-1, 1]) {
      const e = V(s * 0.23, 0.12, 0.08)
      const h = V(s * 0.12, 0.02, 0.3)
      limb(chest, sh(s), e, 0.052, armTone)
      if (!lite) limb(chest, e, h, 0.046, armTone)
    }
  } else {
    for (const s of [-1, 1]) {
      const e = V(s * 0.25, 0.14, 0.0)
      const h = V(s * 0.25, -0.12, 0.04)
      limb(chest, sh(s), e, 0.055, armTone)
      limb(chest, e, h, 0.048, armTone)
      part(chest, sphereGeo(), skin, { pos: h.clone().add(V(0, -0.06, 0)), scale: V(0.04, 0.06, 0.045), outline: 0.004 })
    }
  }

  // head
  const neck = new THREE.Group()
  neck.position.set(0, torsoH - 0.02, 0)
  chest.add(neck)
  part(neck, new THREE.CylinderGeometry(0.048, 0.055, 0.1, 14), skin, { pos: V(0, 0.04, 0), outline: 0.004 })
  const head = new THREE.Group()
  head.position.set(0, 0.17, 0.005)
  neck.add(head)
  part(head, sphereGeo(), skin, { scale: V(0.093, 0.118, 0.105) })
  // hair
  const hs = hairStyle === 'long' ? V(0.103, 0.13, 0.116) : V(0.099, 0.118, 0.11)
  part(head, capGeo(), hair, { pos: V(0, 0.018, -0.012), scale: hs, quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, 0, 0)), outline: 0.004 })
  if (hairStyle === 'long') part(head, sphereGeo(), hair, { pos: V(0, -0.06, -0.05), scale: V(0.1, 0.12, 0.06), outline: 0.004 })
  if (!lite) {
    for (const s of [-1, 1]) {
      part(head, sphereGeo(), skin, { pos: V(s * 0.09, -0.005, -0.005), scale: V(0.016, 0.03, 0.02), outline: 0.003 })
      part(head, sphereGeo(), 0.06, { pos: V(s * 0.034, 0.012, 0.094), scale: V(0.011, 0.007, 0.006), outline: 0 })
      part(head, sphereGeo(), 0.1, { pos: V(s * 0.036, 0.036, 0.093), scale: V(0.02, 0.004, 0.006), outline: 0 })
    }
    part(head, sphereGeo(), skin, { pos: V(0, -0.012, 0.102), scale: V(0.014, 0.024, 0.016), outline: 0.003 })
    part(head, sphereGeo(), 0.35, { pos: V(0, -0.058, 0.093), scale: V(0.024, 0.004, 0.006), outline: 0 })
  }

  g.userData = { head, neck, chest, body, phase: Math.random() * 10 }
  return g
}

// Head world position (for pinning speech to a person).
export function headWorld(fig, out = new THREE.Vector3()) {
  return fig.userData.head.getWorldPosition(out)
}

// Idle life: breathing, a little head movement. `talk` adds nods while speaking. `freeze` holds still.
export function animateFigure(fig, time, { talk = 0, freeze = 0, look = 0 } = {}) {
  const u = fig.userData
  const k = 1 - freeze
  const s = time + u.phase
  u.chest.scale.y = 1 + Math.sin(s * 1.6) * 0.006 * k
  u.head.rotation.x = (Math.sin(s * 0.7) * 0.03 + Math.sin(s * 5.2) * 0.05 * talk) * k
  u.head.rotation.y = (Math.sin(s * 0.43) * 0.06 + look) * (0.4 + 0.6 * k)
  u.neck.rotation.z = Math.sin(s * 0.31) * 0.02 * k
}
