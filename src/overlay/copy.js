// Every line of copy in the film, timed in beats. Wording comes from e1o.com wherever the site already says it
// (marked `site`). Kinds:
//   hero      E1Display, very large          statement  large sans, may carry a serif accent
//   eyebrow   small caps                     fine       caveats and notes
//   box       the narrator, in the official comic's hand lettering (in the wearer's view)
//   you       the wearer speaking            say        someone else speaking, pinned beside their head
//   label     a hardware callout pinned to a part of the model
//   slug      where we are in the day

export const COPY = [
  // S1: something in the dark
  { kind: 'hint', t0: -1, t1: 0.9, fi: 0, fo: 0.5, text: 'Scroll' },
  { kind: 'hero', place: 'hero-1', t0: 0.55, t1: 3.9, fi: 0.7, fo: 0.45, text: 'Your AI.', site: true },
  { kind: 'hero', place: 'hero-2', t0: 1.85, t1: 3.9, fi: 0.7, fo: 0.45, text: 'Out in the world.', site: true },

  // S2: the reveal
  { kind: 'eyebrow', place: 'top', t0: 4.25, t1: 6.1, text: 'Camera-free personal AI glasses', site: true },
  { kind: 'label', pin: 'front', t0: 4.85, t1: 5.95, text: 'Polished black front', site: true },
  { kind: 'label', pin: 'arm', t0: 5.0, t1: 6.25, text: 'Rounded metal arms', site: true },
  { kind: 'label', pin: 'hinge', t0: 5.85, t1: 6.95, text: 'Connected hinge', site: true },
  { kind: 'label', pin: 'pod', t0: 5.95, t1: 7.15, text: 'Substantial rear temple housings', site: true },
  { kind: 'label', pin: 'bridge', t0: 7.95, t1: 8.9, text: 'Keyhole bridge', site: true },
  { kind: 'label', pin: 'lens', t0: 8.0, t1: 8.9, text: 'Clear lenses', site: true },
  { kind: 'label', pin: 'rivet', t0: 8.1, t1: 8.9, text: 'Polished titanium detail' },
  { kind: 'hero', place: 'nocam-early', t0: 8.95, t1: 10.35, fi: 0.4, fo: 0.4, text: 'No camera.', site: true },
  { kind: 'statement', place: 'top-small', t0: 9.25, t1: 10.35, fi: 0.4, fo: 0.35, html: 'Camera-free glasses.<br/>Your assistant, in view.<br/>Connected through your phone.', site: true, small: true },
  { kind: 'fine', place: 'fine-dark', t0: 4.3, t1: 10.35, text: 'Current hardware concept. Final details may change.', site: true },

  // S3: put them on
  { kind: 'statement', place: 'low', t0: 10.35, t1: 12.2, fi: 0.4, fo: 0.35, html: 'Put them on.' },
  { kind: 'box', t0: 13.35, t1: 14.6, fi: 0.3, fo: 0.3, text: 'Now you’re looking through them.' },

  // S4: a glance
  { kind: 'slug', t0: 14.55, t1: 21.0, text: 'A day with E1O · At your desk', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 14.7, t1: 16.4, text: 'The world here is illustrated. Display examples use actual firmware layouts with illustrative content.', site: true },
  { kind: 'you', t0: 15.0, t1: 16.3, text: 'What’s next today?', site: true },
  { kind: 'box', t0: 16.55, t1: 18.3, text: 'A prompt. A glance. Back to it.', site: true },

  // S5: leave the desk
  { kind: 'you', t0: 18.65, t1: 20.0, text: 'Run the tests. I’m taking a break.', site: true },
  { kind: 'box', t0: 19.3, t1: 20.6, text: 'You should be able to get up.', site: true },
  { kind: 'box', t0: 20.8, t1: 22.5, text: 'The work can keep going.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 20.8, t1: 24.2, text: 'Coding agents run on your Mac, which stays awake and connected. The glasses let you follow supported sessions and respond.', site: true },
  { kind: 'slug', t0: 21.05, t1: 27.6, text: 'Between things' },
  { kind: 'you', t0: 25.15, t1: 26.25, text: 'How did the tests go?', site: true },
  { kind: 'box', t0: 26.45, t1: 27.75, text: 'Tests passed. Your move.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 26.45, t1: 27.75, text: 'Follow Claude Code and Codex from your glasses. Your Mac stays awake and connected to handle the work.', site: true },

  // S6: the meeting
  { kind: 'slug', t0: 27.8, t1: 32.7, text: 'At the meeting · Garden Lane', site: true },
  { kind: 'say', pin: 'colleague', t0: 29.45, t1: 31.3, fi: 0.2, text: 'We have the team ready for the pilot. When could we start?', site: true },
  { kind: 'box', t0: 30.75, t1: 32.1, text: 'The date was in your notes.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 30.75, t1: 32.1, text: 'A useful cue from your notes, right when it belongs in the conversation.', site: true },
  { kind: 'you', t0: 31.3, t1: 32.6, text: 'September 16. We’ve got two weeks set aside.', site: true },

  // S7: the restaurant
  { kind: 'slug', t0: 33.6, t1: 37.9, text: 'Later · At the restaurant', site: true },
  { kind: 'say', pin: 'waiter', t0: 34.4, t1: 35.95, fi: 0.2, text: '¿Qué le gustaría pedir?', site: true },
  { kind: 'box', t0: 35.6, t1: 36.95, text: 'Know what they’re asking.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 35.6, t1: 36.95, text: 'The waiter speaks Spanish. You see the translation in English, right in your glasses.', site: true },
  { kind: 'you', t0: 36.3, t1: 37.55, text: 'El risotto, por favor.', site: true },

  // S8: the reply you owe
  { kind: 'slug', t0: 38.0, t1: 42.85, text: 'The reply you owe', site: true },
  { kind: 'box', t0: 38.0, t1: 39.3, text: 'A few words to E1O.', site: true },
  { kind: 'you', t0: 38.5, t1: 39.85, text: 'Draft a reply saying Friday at two works.', site: true },
  { kind: 'box', t0: 40.4, t1: 41.3, text: 'Ready for your okay.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 40.4, t1: 41.65, text: 'Review the draft in your glasses. Swipe to approve sending.', site: true },
  { kind: 'box', t0: 41.85, t1: 42.85, text: 'Approved in your glasses.' },
  { kind: 'fine', place: 'fine-pov', t0: 41.85, t1: 42.85, text: 'With your email connected, E1O can help you catch up and draft a reply.', site: true },

  // S9: make it yours
  { kind: 'slug', t0: 43.25, t1: 47.95, text: 'Something of your own', site: true },
  { kind: 'box', t0: 43.3, t1: 44.6, text: 'What would you make for yours?', site: true },
  { kind: 'you', t0: 44.0, t1: 45.45, text: 'Build me a Twitch app. Keep chat in my glasses.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 44.0, t1: 47.95, text: 'Illustrative walkthrough. This page doesn’t generate, install or connect an app.', site: true, strong: true },
  { kind: 'box', t0: 46.65, t1: 47.95, text: 'Your kind of useful.', site: true },

  // S10: find your use (the per-use lines live in Uses.jsx)
  { kind: 'box', t0: 48.05, t1: 49.1, fi: 0.25, fo: 0.2, text: 'Find your use.', site: true },
  { kind: 'fine', place: 'fine-pov', t0: 48.05, t1: 49.1, fi: 0.25, fo: 0.2, text: 'There’s more than one way to use E1O. Same glasses, a different part of your day.', site: true },

  // S11: take them off
  { kind: 'slug', t0: 57.05, t1: 58.6, text: 'Back where you started' },

  // S12: no camera
  { kind: 'hero', place: 'nocam', t0: 60.75, t1: 64.0, fi: 0.6, fo: 0.4, text: 'No camera.', site: true, sweep: true },
  { kind: 'statement', place: 'under', t0: 61.9, t1: 64.0, fi: 0.45, fo: 0.4, html: 'All of that. <em>In these.</em>', site: true },
  { kind: 'statement', place: 'under-2', t0: 62.35, t1: 64.0, fi: 0.45, fo: 0.4, html: 'Camera-free glasses with a private display.', site: true, small: true },
  { kind: 'fine', place: 'fine-dark', t0: 61.9, t1: 64.0, text: 'Current hardware concept. Final details may change.', site: true },

  // S14: every angle (ink on paper)
  { kind: 'statement', place: 'angles-head', t0: 69.35, t1: 71.1, fi: 0.4, fo: 0.35, html: 'The glasses.<br/><em>Every angle.</em>', site: true, ink: true },
  { kind: 'caption', t0: 70.0, t1: 71.3, text: 'Black frames, metal arms and rounded temples.', site: true },
  { kind: 'caption', t0: 71.45, t1: 72.35, text: 'The keyhole bridge, rounded black frame and clear lenses.', site: true },
  { kind: 'caption', t0: 72.45, t1: 73.35, text: 'Up close: the curved bridge, frame thickness and lens edge.', site: true },
  { kind: 'caption', t0: 73.45, t1: 74.35, text: 'From the side: the metal arm, connected hinge and rounded temple.', site: true },
  { kind: 'caption', t0: 74.45, t1: 75.25, text: 'Up close: brushed metal, the hinge and the rounded earpiece.', site: true },
  { kind: 'caption', t0: 75.35, t1: 76.1, text: 'And they fold, like glasses should.' },
  { kind: 'fine', place: 'fine-ink', t0: 69.4, t1: 76.1, text: 'The current hardware concept. Final materials and specifications may change.', site: true },

  // S15: get in early (hero lines; the CTA lives in Finale.jsx)
  { kind: 'hero', place: 'final-1', t0: 77.0, t1: 999, fi: 0.7, fo: 0, text: 'Your AI.', site: true },
  { kind: 'hero', place: 'final-2', t0: 77.8, t1: 999, fi: 0.7, fo: 0, text: 'Out in the world.', site: true },
]
