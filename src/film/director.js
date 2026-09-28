import { keys, ramp, win, smooth, clamp, lerp, inOut, USES, USES_T0, USE_LEN, useAt } from './timeline.js'

// The script. Every value is a pure function of story time t.
//
// Two lives for the camera:
//  - product: orbiting E1O's own model in the studio (we look AT the glasses)
//  - world:   the wearer's eyes (we look THROUGH the glasses)
// The lens "portal" joins them: the glasses' lenses show the world render, so the world can appear inside the
// frame while we put them on, and stay framed by it while we take them off.

// ---------------------------------------------------------------------------------------------------------------
// Product camera. az 0 = in front of the glasses, 90 = their right side, 180 = behind them (the wearer's side).

const SHOTS = [
  // S1: something in the dark (macro along the rim)
  [0, { tg: [0.06, 0.012, -0.006], az: 40, el: 11, dist: 0.082, fov: 26, fit: 0 }],
  [2.2, { tg: [0.038, 0.016, 0.0], az: 22, el: 8, dist: 0.105, fov: 26, fit: 0 }, 'sine'],
  [3.8, { tg: [0.006, 0.004, -0.02], az: 18, el: 10, dist: 0.19, fov: 25, fit: 0.4 }, 'sine'],
  // S2: the reveal, a full slow turn
  [5.1, { tg: [0, -0.004, -0.055], az: 34, el: 12, dist: 0.36, fov: 24, fit: 1 }],
  [6.3, { tg: [0, -0.004, -0.062], az: 90, el: 6, dist: 0.34, fov: 24, fit: 1 }],
  [7.3, { tg: [0, -0.002, -0.06], az: 168, el: 16, dist: 0.35, fov: 24, fit: 1 }],
  [8.5, { tg: [0, 0.0, -0.03], az: 360, el: 3, dist: 0.3, fov: 24, fit: 1 }],
  [10.0, { tg: [0, 0.0, -0.02], az: 360, el: 2, dist: 0.275, fov: 24, fit: 1 }, 'sine'],
  // S3: put them on
  [11.1, { tg: [0, 0.0, -0.06], az: 452, el: 4, dist: 0.36, fov: 24, fit: 1 }],
  [11.9, { tg: [0, 0.0, -0.02], az: 540, el: 3, dist: 0.4, fov: 26, fit: 1 }],
  [12.75, { tg: [0, 0.0, 0.0], az: 540, el: 0.4, dist: 0.07, fov: 46, fit: 0 }, 'inCubic'],
]

// After the veil the camera is in "eye" mode: behind the lenses, framed by them.
// eyeX: 0 = centred between the lenses, 1 = behind the right lens. frame: how much of the view the lens outline
// fills (1 = touching the edges, >1.6 = the rim has left the view).
const EYE = [
  [12.8, { eyeX: 0, frame: 0.78 }],
  [13.3, { eyeX: 0, frame: 0.82 }],
  [13.95, { eyeX: 1, frame: 1.02 }],
  [14.45, { eyeX: 1, frame: 2.4 }, 'inCubic'],
  [48.0, { eyeX: 1, frame: 2.4 }],
  [48.7, { eyeX: 1, frame: 0.94 }, 'outCubic'],
  [56.9, { eyeX: 1, frame: 0.94 }],
  [57.6, { eyeX: 0, frame: 0.8 }],
  [58.0, { eyeX: 0, frame: 0.72 }],
]

// Take them off: the eye pulls back out of the frame, then the glasses turn to face us.
const OFF = [
  [58.0, { tg: [0, 0, 0], az: 540, el: 0, dist: 0.13, fov: 46, fit: 0 }],
  [59.1, { tg: [0, 0, -0.02], az: 540, el: 2, dist: 0.42, fov: 26, fit: 1 }, 'outCubic'],
  [60.4, { tg: [0, 0, -0.02], az: 720, el: 3, dist: 0.34, fov: 24, fit: 1 }],
  // S12: No camera (the glasses sit low; the words sit above them)
  [61.2, { tg: [0, 0.018, -0.02], az: 720, el: 2, dist: 0.33, fov: 24, fit: 1 }],
  [64.0, { tg: [0, 0.016, -0.02], az: 720, el: 1, dist: 0.31, fov: 24, fit: 1 }, 'sine'],
  // S13: how it works (the glasses rise and step back to make room)
  [65.0, { tg: [0, -0.052, -0.05], az: 708, el: 8, dist: 0.62, fov: 24, fit: 1, py: -0.11 }],
  [68.4, { tg: [0, -0.052, -0.05], az: 692, el: 9, dist: 0.62, fov: 24, fit: 1, py: -0.11 }, 'sine'],
]

// S14: every angle, using the official viewer's camera marks (converted from its 6.6-unit scale).
// `angle` shots set position/target directly (in model space relative to the bbox centre).
export const MARKS = {
  threeQuarter: { pos: [8.4, 4.3, 11.7], tg: [0, 0, 0] },
  front: { pos: [0, 0.25, 13.5], tg: [0, 0, 0.6] },
  bridge: { pos: [1.2, 0.9, 8.2], tg: [0, 0.15, 2.5] },
  side: { pos: [13, 1.8, 1], tg: [0, 0, 0] },
  temple: { pos: [9.5, 1.9, 0.8], tg: [2.6, 0, -0.3] },
  rear: { pos: [-7.5, 4.2, -11.5], tg: [0, 0, -0.4] },
}
const ANGLES = [
  [69.0, 'threeQuarter'],
  [70.9, 'threeQuarter'],
  [71.6, 'front'],
  [72.6, 'bridge'],
  [73.6, 'side'],
  [74.6, 'temple'],
  [75.4, 'rear'],
  [76.0, 'rear'],
]

// S15: the final turn
const FINALE = [
  [76.0, { tg: [0, -0.004, -0.055], az: 214, el: 14, dist: 0.4, fov: 24, fit: 1 }],
  [77.4, { tg: [0, 0.006, -0.055], az: 394, el: 12, dist: 0.42, fov: 24, fit: 1 }],
  [78.6, { tg: [0, 0.006, -0.055], az: 404, el: 11, dist: 0.44, fov: 24, fit: 1 }, 'sine'],
  [79.6, { tg: [0, -0.002, -0.055], az: 414, el: 10, dist: 0.72, fov: 24, fit: 1 }],
  [81.0, { tg: [0, -0.002, -0.055], az: 430, el: 10, dist: 0.74, fov: 24, fit: 1 }, 'sine'],
]

function shotAt(list, t) {
  if (t <= list[0][0]) return { ...list[0][1] }
  for (let i = 1; i < list.length; i++) {
    const [t1, s1, e] = list[i]
    if (t <= t1) {
      const [t0, s0] = list[i - 1]
      const k = ({ inCubic: (x) => x * x * x, outCubic: (x) => 1 - Math.pow(1 - x, 3), sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2 }[e] || inOut)(clamp((t - t0) / (t1 - t0)))
      const out = {}
      for (const key of Object.keys(s0)) {
        const a = s0[key]
        const b = s1[key] ?? a
        out[key] = Array.isArray(a) ? a.map((x, j) => lerp(x, b[j], k)) : lerp(a, b, k)
      }
      return out
    }
  }
  return { ...list[list.length - 1][1] }
}

export function product(t) {
  // which camera track
  let shot
  let mark = null
  // eyeBlend: 0 = orbit camera, 1 = the wearer's eye behind the lenses (computed by the stage from `eye`)
  const eyeBlend = t < 12.7 ? 0 : t < 12.84 ? smooth(ramp(t, 12.7, 12.84)) : t < 58 ? 1 : 1 - smooth(ramp(t, 58.0, 58.7))
  const eye = t >= 12.7 && t < 58.7 ? shotAt(EYE, Math.min(t, 58)) : null
  if (t < 12.78) shot = shotAt(SHOTS, t)
  else if (t < 58) shot = shotAt(SHOTS, 12.75)
  else if (t < 69) shot = shotAt(OFF, t)
  else if (t < 76) {
    // blend between official marks
    let i = 0
    while (i < ANGLES.length - 1 && t > ANGLES[i + 1][0]) i++
    const [ta, a] = ANGLES[i]
    const [tb, b] = ANGLES[Math.min(i + 1, ANGLES.length - 1)]
    const k = tb > ta ? inOut(clamp((t - ta) / (tb - ta))) : 0
    mark = { a: MARKS[a], b: MARKS[b], k }
    // the first mark eases in from the "how it works" framing
    shot = shotAt(OFF, 68.4)
    shot.markBlend = smooth(ramp(t, 69.0, 70.6))
  } else shot = shotAt(FINALE, t)

  // light and look
  const exposure = keys(t, [[0, 0.5], [1.4, 0.82], [4.6, 1.0], [12.4, 1.0], [12.7, 0.2], [57.9, 0.2], [58.4, 1.0]])
  const envRot = keys(t, [[0, -2.4], [4.2, 0.7, 'sine'], [10, 1.2], [12.8, 1.9], [58, 1.9], [61, 2.6], [64, 3.2], [69, 3.5], [76, 3.5], [81, 4.4]])
  const key = keys(t, [[0, 0.0], [1.8, 0.6], [4.8, 2.1], [69, 2.1], [70, 2.5], [75.8, 2.5], [76.6, 2.0]])
  const rim = keys(t, [[0, 1.8], [4.8, 1.3], [11.5, 1.6], [12.6, 2.4], [58, 2.4], [60, 1.4], [69, 1.4], [70, 0.9], [75.8, 0.9], [76.6, 1.6]])
  const hemi = keys(t, [[0, 0.04], [4.8, 0.3], [69, 0.3], [70, 0.9], [75.8, 0.9], [76.6, 0.25]])
  const envI = keys(t, [[0, 0.55], [3.8, 1.0], [69, 1.0], [70, 1.25], [75.8, 1.25], [76.6, 1.0]])
  // studio background: black, then paper for "every angle", then black again
  const paper = smooth(ramp(t, 69.0, 69.9)) * (1 - smooth(ramp(t, 75.9, 76.7)))
  const floor = paper * 0.3
  const fold = smooth(ramp(t, 75.0, 75.8)) * (1 - smooth(ramp(t, 76.1, 76.9)))
  const idle = win(t, 60.4, 64.2, 0.6, 0.6) + smooth(ramp(t, 77, 78))
  // the pool of light behind the product: absent in the opening, there once the glasses are revealed
  const glow = keys(t, [[0, 0], [3.4, 0], [5.0, 1], [12.2, 1], [12.6, 0], [59, 0], [60.4, 1], [76.5, 0.35], [78, 0.8]])
  return { shot, mark, eye, eyeBlend, exposure, envRot, key, rim, hemi, envI, paper, floor, fold, idle, glow }
}

// ---------------------------------------------------------------------------------------------------------------
// Render mode and the lens portal

export function lens(t) {
  // product: studio only. portal: world seen through the lenses. world: the wearer's view, no frame.
  let mode = 'product'
  if (t >= 12.72 && t < 14.4) mode = 'portal'
  else if (t >= 14.4 && t < 48.0) mode = 'world'
  else if (t >= 48.0 && t < 59.2) mode = 'portal'
  const bright = keys(t, [[12.9, 0], [13.45, 1], [58.3, 1], [58.95, 0]])
  const outside = keys(t, [[13.6, 0], [14.3, 1], [48.0, 1], [48.7, 0.16], [56.9, 0.16], [57.6, 0]])
  const glint = keys(t, [[12.8, 0.5], [14.2, 0.15], [48, 0.15], [48.6, 0.3], [57, 0.3], [58.6, 0.6]])
  // glasses lighting while worn: a dark silhouette at the edge of vision
  const worn = t >= 12.72 && t < 58.6 ? 1 : keys(t, [[58.6, 1], [59.3, 0]])
  return { mode, bright, outside, glint, worn }
}

// A dip to black (the blink when the glasses go on, cuts between places).
export function veil(t) {
  // full black from 12.68 to 12.86 while the frame passes over the eyes
  return Math.max(win(t, 12.5, 13.06, 0.18, 0.2), win(t, 32.75, 33.65, 0.35, 0.4))
}

// ---------------------------------------------------------------------------------------------------------------
// The wearer's day

const R = [0, 0, -80]
const ST = [0, 0, -140]
const GY = [0, 0, -170]
const VO = [0, 0, -200]
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]

// [t, pos, yaw, pitch]
const DAY = [
  [12.7, [0, 1.2, -0.12], 0, -7],
  [15.4, [0, 1.2, -0.12], 5, -6],
  [18.0, [0, 1.2, -0.12], -3, -9],
  [18.9, [0, 1.19, -0.12], 0, -21],
  [19.8, [0, 1.62, 0.1], 0, -16],
  [21.1, [0, 1.62, 1.4], 0, -10],
  [22.0, [0.95, 1.62, 2.25], -86, -3],
  [22.8, [3.6, 1.62, 2.3], -90, -1],
  [24.3, [15.3, 1.62, 2.3], -90, -1],
  [24.9, [17.4, 1.62, 2.3], -93, 0],
  [27.4, [36, 1.62, 2.3], -90, 0],
  [28.3, [45.4, 1.62, 2.3], -90, -1],
  [28.9, [49.3, 1.62, 2.7], -40, -5],
  [29.4, [50.5, 1.2, 2.3], 0, -9],
  [30.3, [50.5, 1.2, 2.28], 1, -8.5],
  [31.3, [50.5, 1.2, 2.16], 0, -8.5],
  [32.8, [50.5, 1.2, 2.26], -3, -9],
]
const RESTO = [
  [33.3, add(R, [0, 1.18, 0.02]), -6, -8],
  [34.3, add(R, [0, 1.18, 0.02]), -34, 4],
  [36.4, add(R, [0, 1.18, 0.02]), -32, 3],
  [37.4, add(R, [0, 1.18, 0.02]), -8, -3],
  [40.5, add(R, [0, 1.18, 0.02]), -3, -3],
  [43.2, add(R, [0, 1.18, 0.02]), 2, -2],
]
const PAGE = [
  [43.0, add(VO, [0, 1.62, 12]), 0, -3],
  [46.2, add(VO, [0, 1.62, 6]), 0, -3],
  [48.0, add(VO, [0, 1.62, -4]), 0, -2],
  [49.0, add(VO, [0, 1.62, -7]), 0, -2],
]

function path(list, t) {
  if (t <= list[0][0]) return { pos: list[0][1], yaw: list[0][2], pitch: list[0][3] }
  for (let i = 1; i < list.length; i++) {
    if (t <= list[i][0]) {
      const [t0, p0, y0, q0] = list[i - 1]
      const [t1, p1, y1, q1] = list[i]
      const k = inOut(clamp((t - t0) / (t1 - t0)))
      // Catmull-Rom through neighbours for position, so walking feels continuous
      const pm = (list[i - 2] || list[i - 1])[1]
      const pn = (list[i + 1] || list[i])[1]
      const u = (t - t0) / (t1 - t0)
      const cr = (a, b, c, d, s) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s * s * s)
      const lin = p0.map((x, j) => lerp(x, p1[j], k))
      const spl = p0.map((x, j) => cr(pm[j], x, p1[j], pn[j], u))
      // spline for long walks, eased lerp for short settles
      const walk = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]) > 2.2
      return { pos: walk ? spl : lin, yaw: lerp(y0, y1, k), pitch: lerp(q0, q1, k) }
    }
  }
  const l = list[list.length - 1]
  return { pos: l[1], yaw: l[2], pitch: l[3] }
}

// distance walked along the day path (drives the step bob)
function walkBob(t) {
  const segs = [
    [19.8, 21.1, 1.3], [21.1, 22.0, 1.3], [22.0, 22.8, 2.7], [22.8, 24.3, 11.7], [24.3, 24.9, 2.1], [24.9, 27.4, 18.6],
    [27.4, 28.3, 9.4], [28.3, 28.9, 3.9],
  ]
  let d = 0
  let speed = 0
  for (const [a, b, len] of segs) {
    if (t >= b) d += len
    else if (t > a) {
      const k = inOut((t - a) / (b - a))
      d += len * k
      speed = len / (b - a)
    }
  }
  const amp = clamp(speed / 6) * 0.022
  return { y: Math.sin(d * Math.PI * 1.4) * amp - amp * 0.5, roll: Math.sin(d * Math.PI * 0.7) * amp * 18 }
}

const USE_POSES = [
  { sets: ['office'], preset: 'officeNight', a: [[0, 1.2, -0.12], 2, -17], b: [[0, 1.2, -0.14], -2, -18] },
  { sets: ['pavilion', 'garden'], preset: 'meeting', a: [[50.5, 1.2, 2.3], 5, -8], b: [[50.5, 1.2, 2.22], 2, -8] },
  { sets: ['garden'], preset: 'meeting', a: [[30, 1.2, -1.82], 3, -9], b: [[30, 1.2, -1.86], -2, -8.5] },
  { sets: ['office'], preset: 'morning', a: [[1.1, 1.62, -1.55], 12, 1], b: [[1.15, 1.62, -1.6], 4, 0] },
  { sets: ['garden', 'pavilion'], preset: 'day', a: [[52.6, 1.62, 2.3], -90, -2], b: [[55.4, 1.62, 2.3], -91, -2] },
  { sets: ['stage'], preset: 'stage', a: [add(ST, [0, 2.22, -1.9]), 180, -9], b: [add(ST, [0, 2.22, -1.9]), 174, -8] },
  { sets: ['gym'], preset: 'day', a: [add(GY, [0, 1.62, 0.3]), 0, -3], b: [add(GY, [0, 1.62, 0.3]), 3, -3] },
]

export function world(t) {
  // Which place, which light
  let sets = ['office']
  let preset = 'morning'
  let pose
  let dim = 1
  let lift = null
  const cues = {}
  let laptop = { mode: 'edit', cursor: Math.floor(t * 6) % 2 === 0 }

  if (t < 22.2) {
    sets = t > 21 ? ['office', 'hallway'] : ['office']
    preset = 'morning'
  } else if (t < 24.6) {
    sets = ['office', 'hallway', 'garden']
    preset = 'day'
  } else if (t < 33.0) {
    sets = t < 28.4 ? ['hallway', 'garden', 'pavilion'] : ['garden', 'pavilion']
    preset = t < 28.9 ? 'day' : t < 32.4 ? 'meeting' : 'dusk'
  } else if (t < 43.1) {
    sets = ['restaurant']
    preset = 'night'
  } else if (t < 49.0) {
    sets = ['void']
    preset = 'page'
  } else if (t < 57.0) {
    const i = Math.max(0, useAt(t))
    sets = USE_POSES[i].sets
    preset = USE_POSES[i].preset
  } else {
    sets = ['office']
    preset = 'dusk'
  }

  if (t < 33.0) {
    pose = path(DAY, t)
    const bob = walkBob(t)
    pose.pos = [pose.pos[0], pose.pos[1] + bob.y, pose.pos[2]]
    pose.roll = bob.roll
  } else if (t < 43.1) pose = path(RESTO, t)
  else if (t < 49.0) {
    pose = path(PAGE, t)
    const d = (t - 43) * 4
    pose.pos = [pose.pos[0], pose.pos[1] + Math.sin(d * Math.PI * 1.4) * 0.012, pose.pos[2]]
  } else if (t < 57.0) {
    const i = Math.max(0, useAt(t))
    const u = clamp((t - (USES_T0 + i * USE_LEN)) / USE_LEN)
    const P = USE_POSES[i]
    const k = inOut(u)
    pose = { pos: P.a[0].map((x, j) => lerp(x, P.b[0][j], k)), yaw: lerp(P.a[1], P.b[1], k), pitch: lerp(P.a[2], P.b[2], k) }
    if (t < USES_T0) pose = { pos: P.a[0], yaw: P.a[1], pitch: P.a[2] }
    if (USES[i].id === 'workout') {
      const reps = u * 3
      const sq = Math.pow(Math.sin(reps * Math.PI), 2)
      pose.pos = [pose.pos[0], pose.pos[1] - sq * 0.5, pose.pos[2] - sq * 0.12]
      pose.pitch += sq * 6
    }
    if (USES[i].id === 'directions') {
      const bob = Math.sin(u * 14) * 0.012
      pose.pos = [pose.pos[0], pose.pos[1] + bob, pose.pos[2]]
    }
    if (USES[i].id === 'coding') laptop = { mode: 'edit', cursor: Math.floor(t * 6) % 2 === 0 }
  } else {
    pose = { pos: [0, 1.2, -0.12], yaw: keys(t, [[57, -4], [60, 3]]), pitch: -4 }
  }

  // laptop: after "Run the tests." the Mac keeps working
  if (t >= 19.2 && t < 33) laptop = { mode: 'run', done: Math.floor(clamp((t - 19.5) / 5.0) * 12) }

  // dissolve to the blank page and back
  if (t > 42.4 && t < 44.2) lift = keys(t, [[42.4, 0], [43.08, 1], [43.12, 1], [44.0, 0.1]])

  // people
  cues.colleague = {
    talk: win(t, 29.5, 31.0, 0.1, 0.2),
    freeze: win(t, 30.9, 31.6, 0.15, 0.25),
  }
  cues.waiter = { talk: win(t, 34.4, 35.7, 0.1, 0.2) }
  cues.friend = { talk: useAt(t) === 2 ? 0.6 : 0 }

  // waiter walks off after taking the order
  const leave = smooth(ramp(t, 37.5, 38.8))
  const waiter = { pos: [lerp(1.25, 2.9, leave), 0, lerp(-1.3, -3.1, leave)], rot: lerp(-0.7, -2.6, smooth(ramp(t, 37.4, 37.9))) }

  // the world "pauses" while the cue is up
  const hush = win(t, 30.3, 31.6, 0.25, 0.35)

  const fovH = 66
  return { sets, preset, pose, dim, lift, cues, laptop, waiter, hush, fovH }
}

// ---------------------------------------------------------------------------------------------------------------

export function everything(t) {
  return { product: product(t), lens: lens(t), world: world(t), veil: veil(t) }
}
