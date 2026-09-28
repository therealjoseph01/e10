import { USES, USES_T0, USE_LEN } from '../film/timeline.js'

// Official firmware renders from e1o.com (540×440, white glyphs). We never re-typeset them; we only reveal them
// in pieces. Rects are in firmware pixels: [x, y, w, h]. `at` is when a piece arrives, as a fraction of the
// appearance; `mode` is fade | wipe (grows downward) | slide.
// `alt` is the site's own "Read display text" transcript (firmware/scenarios.json).

export const ALT = {
  dashboard: 'Wednesday, September 16. 21 degrees, clear. Battery 73 percent. Time 09:41. Phone linked. Calendar, next: Pilot meeting, in 4 minutes, 09:45, Garden Lane. Tap opens Calendar. Hold for apps. Triple-tap for E1 Agent.',
  translation: 'English (US) to French. The meeting starts at three. La réunion commence à trois heures. Listening.',
  twitch: 'Live, MACEO_LIVE. Twitch Chat. Saved, now. maceo_live: welcome in, chat. viewer_one: the glasses look great. Selected message, viewer_two: how long is the battery?',
  teleprompter: 'E1O Teleprompter. Paused, 1 of 5. Thanks for joining us today. We are starting a two-week pilot. Six people will take part. We will begin on September 16. At the end, we will review the results. Tap hides. Swipe paces.',
  coding: 'Codex / Login. Done. Email sign-in is ready. Updated the login flow. Removed the extra step. Tests passed: 12 out of 12. Ready for your review. Ask Codex to do anything.',
  conversate: 'Pilot planning. Pilot start: September 16. Two weeks, six people. Conversation: We have the team ready for the pilot. When could we start?',
  'hero-translation': 'Spanish (Spain) to English (US). ¿Qué le gustaría pedir? What would you like to order? Listening.',
  agent: 'Friday at two works for me. See you then. Send to alex@example.com. Swipe to approve. Double-tap to decline. The calendar remains dimly visible behind the request.',
  navigation: '14:32. Walking. Continue ahead, next guidance in 60 metres, Garden Lane. 850 metres and 11 minutes remaining. Arrive 14:43. Market Street.',
  workout: 'Workout app concept. Squats. Set 1 of 3. Goal: 12 reps. Say how many you completed. Voice logging.',
  'workout-logged': 'Workout app concept. 12 reps logged by voice. Set 1 of 3 complete. Rest for 60 seconds.',
}

const FULL = [{ r: [0, 0, 540, 440], at: 0, dur: 0.22, mode: 'wipe' }]

export const APPEARANCES = [
  // A glance: one thing first (what's next), then the rest of the home screen
  {
    fw: 'dashboard', t0: 15.65, t1: 18.1,
    parts: [
      { r: [176, 48, 364, 344], at: 0.0, dur: 0.14, mode: 'slide' },
      { r: [0, 52, 176, 200], at: 0.2, dur: 0.14 },
      { r: [0, 396, 540, 44], at: 0.34, dur: 0.14 },
    ],
  },
  // Tests passed: the session prints row by row
  {
    fw: 'coding', t0: 25.7, t1: 27.7,
    parts: [
      { r: [0, 0, 540, 44], at: 0.0, dur: 0.1, mode: 'wipe' },
      { r: [0, 44, 540, 24], at: 0.1, dur: 0.08 },
      { r: [0, 68, 540, 52], at: 0.18, dur: 0.08 },
      { r: [0, 120, 540, 36], at: 0.27, dur: 0.08 },
      { r: [0, 156, 540, 40], at: 0.35, dur: 0.08 },
      { r: [0, 196, 540, 244], at: 0.42, dur: 0.12, mode: 'wipe' },
    ],
  },
  // The meeting: live caption first, then the cue from your notes
  {
    fw: 'conversate', t0: 29.65, t1: 31.95,
    parts: [
      { r: [0, 278, 540, 60], at: 0.0, dur: 0.12 },
      { r: [0, 34, 540, 30], at: 0.1, dur: 0.1 },
      { r: [0, 82, 540, 84], at: 0.36, dur: 0.1, mode: 'slide' },
    ],
  },
  // The restaurant
  {
    fw: 'hero-translation', t0: 34.75, t1: 37.15,
    parts: [
      { r: [0, 4, 540, 38], at: 0.0, dur: 0.1 },
      { r: [0, 342, 540, 34], at: 0.12, dur: 0.1 },
      { r: [0, 376, 540, 40], at: 0.3, dur: 0.12, mode: 'slide' },
      { r: [0, 416, 540, 24], at: 0.44, dur: 0.1 },
    ],
  },
  // The reply: request → draft → review → approve (swipe) → done
  {
    fw: 'agent', t0: 39.3, t1: 41.85, exit: { at: 0.8, dur: 0.14, mode: 'swipe' },
    parts: [
      { r: [0, 48, 540, 128], at: 0.0, dur: 0.12 },
      { r: [494, 170, 46, 230], at: 0.0, dur: 0.12 },
      { r: [14, 168, 486, 256], at: 0.14, dur: 0.32, mode: 'wipe' },
    ],
  },
  // Something of your own: the chat assembles
  {
    fw: 'twitch', t0: 44.9, t1: 47.95,
    parts: [
      { r: [36, 88, 468, 24], at: 0.0, dur: 0.07 },
      { r: [36, 112, 468, 34], at: 0.07, dur: 0.07, mode: 'slide' },
      { r: [36, 158, 468, 32], at: 0.17, dur: 0.07, mode: 'slide' },
      { r: [36, 192, 468, 38], at: 0.27, dur: 0.07, mode: 'slide' },
      { r: [36, 230, 468, 52], at: 0.37, dur: 0.08, mode: 'slide' },
    ],
  },
  // Find your use: same glasses, different life
  ...USES.flatMap((u, i) => {
    const a = USES_T0 + i * USE_LEN
    if (u.id === 'workout') {
      return [
        { fw: 'workout', t0: a + 0.14, t1: a + USE_LEN * 0.58, parts: FULL, quick: true },
        { fw: 'workout-logged', t0: a + USE_LEN * 0.58, t1: a + USE_LEN - 0.02, parts: [{ r: [0, 0, 540, 440], at: 0, dur: 0.12 }], quick: true, noIn: true },
      ]
    }
    return [{ fw: u.fw, t0: a + 0.14, t1: a + USE_LEN - 0.04, parts: FULL, quick: true }]
  }),
]
