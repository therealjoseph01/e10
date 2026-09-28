# E1O: putting them on for the first time

A scroll-driven product film for **E1O (E1 Optics)**, the camera-free personal AI glasses with a private display.
The glasses carry the whole story. The visitor starts by looking **at** E1O, puts them on, spends one day looking
**through** them, takes them off, and finally understands the object in front of them.

```
DARK → REVEAL → PUT THEM ON → A GLANCE → LEAVE THE DESK → THE MEETING → THE RESTAURANT → THE REPLY
     → MAKE IT YOURS → FIND YOUR USE → TAKE THEM OFF → NO CAMERA → HOW IT WORKS → EVERY ANGLE → GET IN EARLY
```

Everything below was checked against the live e1o.com on Sept 28 2026: the landing page, its story, its seven
"Find your use" panels, the FAQ, `/glasses.html` (the official 3D viewer and its `product-viewer.js`),
`/firmware/scenarios.json` (the official display transcripts) and `/firmware/display-page.js`.

---

## 1. What E1O is (verified)

| | Source on e1o.com |
|---|---|
| "Camera-free personal AI glasses." "Your AI. Out in the world." "No camera." | Hero |
| "Camera-free AI glasses with a private display and a personal assistant." | Page meta description |
| "Camera-free glasses. Your assistant, in view. Connected through your phone." | "All of that. In these." |
| "The glasses put information in view. The E1O phone app connects your services and manages the experience. Coding agents run on your Mac, which needs to stay awake and connected; the glasses let you follow supported sessions and respond." | FAQ: What runs where? |
| "With your email connected, E1O can help you catch up and draft a reply. Review the draft and approve sending right in your glasses." | FAQ: Can it send things for me? |
| "The story is illustrated. The display previews use actual firmware layouts and glyphs with example content… rather than simulating the brightness or field of view of physical glasses." | FAQ: What am I seeing in the demos? |
| "Join the waitlist with your phone number. Access opens gradually. We haven't announced a public launch date; joining doesn't guarantee an invitation." | FAQ: How do I get access? |
| "Current hardware concept. Final details may change." / "Final fit, finishes and features may change." / "Final materials and specifications may change." | Product sections, `/glasses.html` |

### The seven uses, and how each is labelled

| Use | Prompt on the site | Label the site gives it |
|---|---|---|
| Coding agents | "Try the simpler version. Run the tests." | "Requires the E1O app and a Mac that stays awake and connected. Available controls depend on the agent session." |
| Conversation cues | "What did we agree for the pilot?" | "Conversate example with a note-grounded cue and live caption layout." |
| Translation | "Translate this conversation for me." | "Native translation screen with an English–French example." |
| Daily glances | "What's next today?" | "Native dashboard example. Calendar and reminders use your connected phone." |
| Directions | "How do I get there?" | "Firmware navigation layout, with an illustrative route." |
| Teleprompter | "Open my talking points." | "Native teleprompter example with illustrative content." |
| Workout | "Log my reps. Show me what's next." | **"Illustrative app concept."** |
| Your own app | "Build me a Twitch app. Keep chat in my glasses." | **"Illustrative walkthrough. This page doesn't generate, install or connect an app."** |

### What this film must never say or show

- A camera, a lens that looks like one, or anything that implies visual capture.
- Claude Code or Codex running on the glasses. They run on the Mac; E1O follows the session.
- Field of view, brightness, resolution, battery life, weight, price or a launch date. None are published.
- A display colour or optical effect. The firmware previews are white glyphs; we show them as layouts, and say so.
- A shipped custom-app builder or a shipped workout app.
- Gestures beyond what the firmware itself prints: *Swipe > approve · Double-tap > no*, *Tap hides | Swipe paces*,
  *Tap opens calendar · Hold for apps · Triple-tap for E1 Agent*.
- Any privacy promise beyond **camera-free** and **a private display**.

---

## 2. Official assets used (nothing about the glasses is re-modelled)

| Asset | Used for |
|---|---|
| `assets/glasses-r35-meshopt.glb` (5.7 MB, the model behind `/glasses.html`) | The protagonist in every scene. Its own parts (acetate front, lenses, titanium arms, hinges, rear housings) and its own "Fold and unfold" animation. |
| `product-viewer.js` presets (front, three-quarter, side, bridge, temple) and view descriptions | Camera marks and captions in *Every angle* |
| `firmware/previews-a73dd5659814/*.png` (11 exact native firmware renders, 540×440) | Every in-glasses moment. We only reveal them in pieces (clip masks); no text is typed into them. |
| `firmware/scenarios.json` transcripts | The accessible text for each display |
| `assets/phone-twitch-496-….webp` (actual companion app) | *Make it yours* and *How it works* |
| `assets/wordmark.svg`, favicons, `assets/display.woff` (E1Display), `lettering/PatrickHand` | Brand type: E1Display for the big statements, Patrick Hand for spoken lines (as in the official comic) |
| `product-three-quarter.png`, `product-temple.png`, `hero-glasses-cutout.webp` | Poster frames and the no-WebGL fallback |

The official story is an illustrated third-person comic. There is no first-person imagery, so the world seen
*through* the glasses is drawn procedurally in the same language as that comic: monochrome ink, big gridded windows,
hard window-light, halftone shade. It is scenery, not product, so drawing it invents nothing about E1O.

---

## 3. AT or THROUGH, scene by scene

| # | Scene | We are… | Technique |
|---|---|---|---|
| 1 | Something in the dark | **AT**: macro on the acetate edge | WebGL, GLB, black studio, one travelling light (rotating environment + moving key) |
| 2 | The reveal | **AT**: slow orbit | WebGL, orbit; DOM labels pinned to the model's own parts |
| 3 | Put them on | **AT → THROUGH** | Orbit behind the frame, temples sweep past the screen edges, **the lenses become windows into the world** (lens material samples the world render), black, eyes open |
| 4 | A glance | **THROUGH**: morning desk | Ink world (WebGL) + firmware dashboard revealed in pieces |
| 5 | Leave the desk | **THROUGH**: back away, turn, hallway, outside | Continuous first-person camera path; laptop keeps scrolling test output as it recedes |
| 6 | The meeting | **THROUGH** | Colleague speaks, world slows, conversation cue arrives and leaves |
| 7 | The restaurant | **THROUGH**: evening | Waiter speaks Spanish, translation arrives |
| 8 | The reply you owe | **THROUGH** | Request → draft → review → swipe → done |
| 9 | Make it yours | **THROUGH**: the world becomes a blank page | Twitch chat assembles row by row, the actual companion app appears |
| 10 | Find your use | **THROUGH, framed**: the lens outline stays fixed on screen while the world behind it cuts | Seven mini-scenes, same frame, different life |
| 11 | Take them off | **THROUGH → AT** | Exact reverse of scene 3 |
| 12 | No camera | **AT**: black, front view | The strongest type moment |
| 13 | How it works | **AT**: glasses, phone, Mac | DOM + SVG connections around the live model |
| 14 | Every angle | **AT**: light studio | The official viewer's five camera marks, then the arms fold |
| 15 | Get in early | **AT**: darkness, one slow turn | Final statement and the waitlist |

### Why take-off comes before "No camera"
The brief places *No camera* (11) before *Take them off* (14), but scene 11 already has us looking at the glasses
floating in black, which means we must have taken them off. So the reverse transition happens right after the
montage. That also makes the reveal land harder: you take them off, and the first thing you learn about the object
you just spent a day inside is that it never had a camera.

### The glasses as navigation
The model is never swapped for a picture. In AT scenes it is the subject. In THROUGH scenes it is still rendered, as
the rim at the edge of vision: sharp just after you put them on, then drifting outward until it is gone (a good
wearable stops asking for attention). It returns, as a fixed lens outline, in *Find your use* (the one constant
while the world cuts), and then closes in for *Take them off*.

---

## 4. The signature transitions

1. **Put them on.** Front view → the glasses turn away from us (profile, then the back) → they come closer with
   temples open → the temple tips and rear housings slide past the left and right edges → the front fills the frame
   and we are looking through both lenses → the world appears *inside the lenses only* while the rest stays black →
   the eye settles behind one lens → the rim drifts out of view. Reversible frame by frame.
2. **Desk → walk away.** We say "Run the tests. I'm taking a break.", back away (the laptop, still printing test
   output, shrinks in front of us), turn, and walk out. Nothing is in view while we walk. Later, outside:
   "How did the tests go?" and the Codex session appears: *Tests passed: 12 / 12*.
3. **Conversation cue.** The colleague's question is captioned. The world slows. The cue from your notes arrives
   (*Pilot start: September 16. Two weeks, six people.*). You answer. It leaves.
4. **Translation.** "¿Qué le gustaría pedir?" is captioned by the waiter. The firmware shows it dimmed, then
   *What would you like to order?*
5. **Take them off.** Scene 3 in reverse, ending on the object.

---

## 5. Display language

- Only the official firmware renders appear in view. They are revealed in pieces with clip masks (a header, then a
  line, then a cue), never re-typeset.
- They sit on one small dark plate, centred slightly below the eye line. The world around them is untouched.
- Every appearance carries the site's own caveat: *Actual firmware layout · example content · brightness and field of
  view are not simulated.*
- One thing at a time. The display is empty most of the time.

## 6. Voices

- **You**: a hand-lettered box at the bottom (Patrick Hand, the official comic lettering), marked YOU, in E1O orange.
- **Other people**: hand-lettered boxes pinned beside their heads.
- **The narrator**: large Inter Tight / E1Display lines, 3–10 words.

---

## 7. Beat map (as built)

One beat is 0.82 of a screen of scroll on desktop (0.72 on phones). 81 beats in all.

| Beats | Scene | What happens |
|---|---|---|
| 0–4 | Something in the dark | Macro along the rim; a highlight travels across acetate and titanium. *Your AI.* then *Out in the world.* |
| 4–10 | The reveal | One slow turn: three-quarter, side, rear housings, round to the front. Labels on the model's own parts. *No camera.* |
| 10–14.5 | Put them on | Turn away, temples open toward us, approach, black, the world appears inside both lenses, the eye settles behind one, the rim drifts out. |
| 14.5–18.5 | A glance | "What's next today?" The calendar card arrives first, then the rest of the home screen. *A prompt. A glance. Back to it.* |
| 18.5–27.2 | Leave the desk | "Run the tests. I'm taking a break." Back away (the Mac keeps printing), turn, the hallway, Garden Lane. "How did the tests go?" *Tests passed. Your move.* |
| 27.2–33 | The meeting | Into the pavilion. The colleague asks; the caption lands, the world hushes, the cue arrives. "September 16." |
| 33–38 | The restaurant | A dip to evening. "¿Qué le gustaría pedir?" → *What would you like to order?* |
| 38–43 | The reply you owe | Request → draft → review → swipe → done, on a small rail at the side. |
| 43–48 | Something of your own | The room dissolves to a blank page. "Build me a Twitch app." The chat assembles row by row; the actual app rises from below. |
| 48–57 | Find your use | The lens outline closes in and stays fixed; the world behind it cuts seven times. |
| 57–60.5 | Take them off | Back at the desk at dusk, the frame closes, the glasses leave the face with the world still in the lenses, then turn to face us. |
| 60.5–64 | No camera | The strongest type moment. *All of that. In these.* |
| 64–69 | How it works | Glasses ↔ E1O phone app ↔ your services; phone ↔ your Mac, where Claude Code and Codex run. |
| 69–76 | Every angle | Paper studio, the official viewer's marks, then the arms fold. |
| 76–81 | Get in early | Darkness, one slow turn, the opening lines return, the waitlist. |

Composition rules that came out of testing: the display plate sits just below the eye line, so faces stay above it
(on phones the camera also looks slightly lower); only one narrator line, one voice and one display at a time; the
people in the world are lit from the wearer's side so faces read.

---

## 8. Desktop, mobile, performance, accessibility

**Desktop.** One fixed WebGL canvas, three passes (world, lens portal, glasses). Lenis smooth scroll. Story time is
spring-smoothed so scrubbing feels filmed, and every value is a pure function of story time, so scrolling back
rewinds exactly.

**Mobile (portrait).** Its own camera marks (the glasses sit higher and smaller so the temples still sweep past the
edges), a taller world field of view, the display plate at 88vw, speech stacked at the top. The lens uses cheap glass
instead of transmission, shadows drop to 1024², DPR is capped at 1.5, and only the active set is drawn. Native touch
scrolling (no scroll hijack); the spring smooths it.

**Performance.** The model loads once (meshopt, 512² textures). The world is procedural: no downloads, about 30k
triangles, one shadow-casting light, sets hidden outside their time window. The world render target only exists
during the two lens transitions. DPR adapts to measured frame time. Rendering stops when the story is still and
nothing is idling.

**Reduced motion.** No smoothing, no idle rotation, and the long camera moves become cuts with short fades. The story
and all copy remain.

**Fallback.** Without WebGL2 (or if the model fails), the same story is told as a still page with official renders
and the firmware previews.

**Accessibility.** All copy is real DOM text. Each display has the site's own transcript as its text alternative. A
"Skip to early access" link sits first in the tab order.
