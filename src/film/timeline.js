// Story time is measured in beats. One beat is a fixed amount of scroll (see store.js).
// Every visual value in the film is a pure function of story time, so scrolling back rewinds exactly.

export const SCENES = [
  { id: 'dark', label: 'Something in the dark', t0: 0, t1: 4 },
  { id: 'reveal', label: 'The glasses', t0: 4, t1: 10 },
  { id: 'on', label: 'Put them on', t0: 10, t1: 14.5 },
  { id: 'glance', label: 'A glance', t0: 14.5, t1: 18.5 },
  { id: 'desk', label: 'Leave the desk', t0: 18.5, t1: 27.2 },
  { id: 'meeting', label: 'At the meeting', t0: 27.2, t1: 33 },
  { id: 'restaurant', label: 'At the restaurant', t0: 33, t1: 38 },
  { id: 'reply', label: 'The reply you owe', t0: 38, t1: 43 },
  { id: 'yours', label: 'Something of your own', t0: 43, t1: 48 },
  { id: 'uses', label: 'Find your use', t0: 48, t1: 57 },
  { id: 'off', label: 'Take them off', t0: 57, t1: 60.5 },
  { id: 'nocamera', label: 'No camera', t0: 60.5, t1: 64 },
  { id: 'how', label: 'How it works', t0: 64, t1: 69 },
  { id: 'angles', label: 'Every angle', t0: 69, t1: 76 },
  { id: 'access', label: 'Get in early', t0: 76, t1: 81 },
]

export const T_END = 81

// "Find your use": seven mini-scenes, same glasses, different life.
export const USES_T0 = 49
export const USE_LEN = 1.14
export const USES = [
  { id: 'coding', name: 'Coding agents', ask: '“Try the simpler version. Run the tests.”', fw: 'coding', note: 'Requires the E1O app and a Mac that stays awake and connected.' },
  { id: 'cues', name: 'Conversation cues', ask: '“What did we agree for the pilot?”', fw: 'conversate', note: 'Conversate example with a note-grounded cue and live caption layout.' },
  { id: 'translate', name: 'Translation', ask: '“Translate this conversation for me.”', fw: 'translation', note: 'Native translation screen with an English–French example.' },
  { id: 'glance', name: 'Daily glances', ask: '“What’s next today?”', fw: 'dashboard', note: 'Native dashboard example. Calendar and reminders use your connected phone.' },
  { id: 'directions', name: 'Directions', ask: '“How do I get there?”', fw: 'navigation', note: 'Firmware navigation layout, with an illustrative route.' },
  { id: 'prompter', name: 'Teleprompter', ask: '“Open my talking points.”', fw: 'teleprompter', note: 'Native teleprompter example with illustrative content.' },
  { id: 'workout', name: 'Workout', ask: '“Log my reps. Show me what’s next.”', fw: 'workout', note: 'Illustrative app concept.' },
]
export const useAt = (t) => {
  const i = Math.floor((t - USES_T0) / USE_LEN)
  return i >= 0 && i < USES.length ? i : -1
}

// Reduced motion: long camera moves become cuts. Each stop is [from, to, restTime].
export const RM_STOPS = [
  [0, 4, 2.6], [4, 6.2, 5.2], [6.2, 7.6, 6.8], [7.6, 10, 8.8], [10, 12.8, 10.2], [12.8, 14.5, 14.2],
  [14.5, 19.8, 16.5], [19.8, 22, 21], [22, 25.2, 24.2], [25.2, 27.4, 26.6], [27.4, 29.3, 29], [29.3, 33.4, 30.6],
  [33.4, 43, 35.5], [43, 48, 45.5], [48, 49, 48.6],
  ...Array.from({ length: 7 }, (_, i) => [USES_T0 + i * USE_LEN, USES_T0 + (i + 1) * USE_LEN, USES_T0 + (i + 0.55) * USE_LEN]),
  [57, 60.5, 60.4], [60.5, 64, 62], [64, 69, 66.5], [69, 70.9, 70.2], [70.9, 72, 71.5], [72, 73, 72.5], [73, 74, 73.5],
  [74, 75.1, 74.6], [75.1, 76, 75.9], [76, 81, 79],
]

// ---------------------------------------------------------------------------------------------------------------
// Math helpers

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x)
export const lerp = (a, b, k) => a + (b - a) * k
export const ramp = (t, a, b) => clamp((t - a) / (b - a))
export const smooth = (x) => x * x * (3 - 2 * x)
export const smoother = (x) => x * x * x * (x * (x * 6 - 15) + 10)
export const inOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const outCubic = (x) => 1 - Math.pow(1 - x, 3)
export const inCubic = (x) => x * x * x
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))
export const inOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2

export const EASE = { linear: (x) => x, smooth, smoother, inOut, outCubic, inCubic, outExpo, sine: inOutSine }

// Visibility window: fades in over [a, a+fi], holds, fades out over [b-fo, b].
export function win(t, a, b, fi = 0.35, fo = 0.35) {
  if (t <= a || t >= b) return 0
  const i = fi > 0 ? smooth(clamp((t - a) / fi)) : 1
  const o = fo > 0 ? smooth(clamp((b - t) / fo)) : 1
  return Math.min(i, o)
}

// Piecewise keyframes: [[t, value, ease?], ...]. value may be a number or an array. The ease on a key shapes the
// segment that ends at that key.
export function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0][1]
  for (let i = 1; i < ks.length; i++) {
    const [t1, v1, e] = ks[i]
    if (t <= t1) {
      const [t0, v0] = ks[i - 1]
      const k = (EASE[e || 'inOut'] || inOut)(clamp((t - t0) / (t1 - t0 || 1)))
      if (Array.isArray(v0)) return v0.map((x, j) => lerp(x, v1[j], k))
      return lerp(v0, v1, k)
    }
  }
  return ks[ks.length - 1][1]
}

// Shortest-arc angle blend in degrees is not wanted here: yaw keys are authored continuously.

export const sceneAt = (t) => SCENES.find((s) => t >= s.t0 && t < s.t1) || SCENES[SCENES.length - 1]

// For reduced motion: the camera holds one pose per stop; `veil` is a short dip to black at each cut.
export function reducedTime(t) {
  for (const [a, b, r] of RM_STOPS) {
    if (t >= a && t < b) {
      const edge = Math.min(t - a, b - t)
      return { t: r, veil: 1 - smooth(clamp(edge / 0.18)) }
    }
  }
  return { t, veil: 0 }
}
