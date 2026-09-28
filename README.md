# E1O: a new point of view

A scroll-driven first-person product film for **E1O (E1 Optics)**, the camera-free personal AI glasses, built in React
and three.js.

You start by looking **at** E1O in the dark. You put them on, and the site becomes the wearer's point of view: one day
of useful glances (a coding agent that keeps working while you walk, a cue from your notes in a meeting, a waiter
translated at dinner, a reply you approve in your glasses, a little app of your own). Then you take them off, and
learn the one thing that matters about the object you just lived inside: **no camera**.

Scroll is the playhead. Scrolling back rewinds everything exactly.

See [`STORYBOARD.md`](./STORYBOARD.md) for the scene plan, every source on e1o.com, and what the film must never claim.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build → dist/ (static; deploy anywhere, vercel.json included)
npm run build:single   # one HTML file → preview/index.html. Double-click it: from disk it loads the official
                       # assets from e1o.com, so it needs a connection but no server
npm run assets         # re-mirror E1O's official assets from e1o.com into public/e1o
```

Node 20.19 or newer.

## What's official, what's drawn

| | |
|---|---|
| **The glasses** | E1O's own model, `glasses-r35-meshopt.glb`, the one behind e1o.com/glasses.html. Its materials, its parts, and its own *Fold and unfold* animation. Nothing about the hardware is re-modelled. |
| **The display** | E1O's 11 native firmware renders (540×440). They are revealed in pieces with clip masks and never re-typeset. Each carries the site's own transcript as its text alternative. |
| **The companion app** | The actual app screenshot from e1o.com. |
| **Type** | E1Display (E1O's display face) for the big statements, Patrick Hand (the official comic's lettering) for spoken lines, Inter Tight and Instrument Serif for everything else. |
| **The world** | Drawn procedurally, in the language of E1O's official comic: paper, ink, hard window light and a halftone screen. It's scenery, so it claims nothing about the product. |

All official assets live in `public/e1o/` with their original e1o.com paths.

## How it's built

| File | Role |
|---|---|
| `src/film/timeline.js` | The 15 scenes in beats, the seven uses, reduced-motion stops, and easing helpers. |
| `src/film/director.js` | The script. Every camera, light, lens and world value is a pure function of story time. Product shots (including the official viewer's five camera marks), the eye behind the lenses, the wearer's walk through the day. |
| `src/film/store.js` | Scroll → story time. Lenis on desktop, native scrolling on touch, and a critically damped spring on top. |
| `src/gl/Stage.js` | One canvas, three passes: **product** (the studio), **portal** (the world rendered off-screen and shown *through the lenses*), **world** (the wearer's view). Adaptive DPR, draw-on-demand. |
| `src/gl/glasses.js` | Loads and re-centres the model, keeps E1O's materials, adds the lens portal material and part anchors for the labels. |
| `src/gl/world/*` | The ink shader (halftone + tone curve), a small set-building kit, the people, and every place of the day (office, hallway, Garden Lane, the pavilion, the restaurant, the blank page, a stage, a gym). Static meshes are merged per material. |
| `src/overlay/*` | All copy is DOM, driven per frame without React re-renders: timed lines, the firmware display plate, speech pinned to heads, hardware labels pinned to the model, the reply steps, "Find your use", "How it works", the finale. |
| `src/Transcript.jsx`, `src/Fallback.jsx` | The whole film as text (screen readers), and as a still page when WebGL2 isn't available. |

## QA

- `#t24.5` in the URL jumps to a beat. `~d` shows the beat and render mode in the tab title.
- `~fallback` forces the no-WebGL page.
- In the console, `__e1o.go(40.2)` scrolls to a beat, and `__e1o.at(40.2)` draws that beat immediately (it works in
  background tabs too; `__e1o.go()` releases it).

## Performance, accessibility, fallbacks

- The model (5.7 MB, meshopt) and the firmware PNGs load behind a progress bar; every shader variant is compiled before
  the film starts.
- The world is procedural: nothing to download, one shadow-casting light, sets hidden outside their moment.
- The off-screen world render only exists during the two lens transitions and "Find your use".
- DPR adapts to measured frame time, and nothing is drawn while the story is still (except slow idle life at 30 fps).
- Phones get their own framing: the glasses step back to fit, the lens is allowed to overflow the sides, the display
  plate is 86vw, faces are kept above it, and the "How it works" diagram stacks.
- `prefers-reduced-motion`: no smoothing, no idle motion, and the long camera moves become cuts.
- Without WebGL2, or if the model fails to load, `Fallback.jsx` tells the same story with official renders.
