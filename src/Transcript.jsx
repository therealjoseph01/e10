import { ALT } from './overlay/displays.js'
import { ASSETS, FIRMWARE, LINKS } from './config.js'
import { USES } from './film/timeline.js'

// The whole film as plain content, in order. Screen readers get it (visually hidden) next to the film,
// and the no-WebGL fallback shows it as a page.

const DAY = [
  {
    title: 'At your desk',
    lines: [['You', 'What’s next today?']],
    fw: 'dashboard',
    after: 'A prompt. A glance. Back to it.',
  },
  {
    title: 'Leave the desk',
    lines: [['You', 'Run the tests. I’m taking a break.'], ['', 'The work can keep going.'], ['You', 'How did the tests go?']],
    fw: 'coding',
    after: 'Tests passed. Your move. Follow Claude Code and Codex from your glasses. Your Mac stays awake and connected to handle the work.',
  },
  {
    title: 'At the meeting',
    lines: [['Colleague', 'We have the team ready for the pilot. When could we start?']],
    fw: 'conversate',
    after: 'The date was in your notes. You: “September 16. We’ve got two weeks set aside.”',
  },
  {
    title: 'At the restaurant',
    lines: [['Waiter', '¿Qué le gustaría pedir?']],
    fw: 'hero-translation',
    after: 'Know what they’re asking. You: “El risotto, por favor.”',
  },
  {
    title: 'The reply you owe',
    lines: [['You', 'Draft a reply saying Friday at two works.']],
    fw: 'agent',
    after: 'Ready for your okay. Review the draft in your glasses. Swipe to approve sending.',
  },
  {
    title: 'Something of your own',
    lines: [['You', 'Build me a Twitch app. Keep chat in my glasses.']],
    fw: 'twitch',
    after: 'A little app for the thing you do. Illustrative walkthrough. This page doesn’t generate, install or connect an app.',
  },
]

export function Story({ visual = false }) {
  const Fw = ({ name }) =>
    visual ? (
      <figure className="fb-fw">
        <img src={FIRMWARE(name)} alt={ALT[name]} loading="lazy" />
        <figcaption>Actual firmware layout · example content</figcaption>
      </figure>
    ) : (
      <p>In E1O: {ALT[name]}</p>
    )
  return (
    <>
      <header>
        <p>Camera-free personal AI glasses</p>
        <h1>Your AI. Out in the world.</h1>
        <p>No camera.</p>
        {visual && <img className="fb-hero" src={ASSETS.poster} alt="E1O glasses with a polished black front, rounded metal arms, and substantial rear temple housings." />}
        <p>Camera-free glasses. Your assistant, in view. Connected through your phone. Current hardware concept. Final details may change.</p>
      </header>
      <section>
        <h2>A day with E1O</h2>
        <p>The story is illustrated. The display previews use actual firmware layouts and glyphs with example content.</p>
        {DAY.map((d) => (
          <article key={d.title}>
            <h3>{d.title}</h3>
            {d.lines.map(([who, what], i) => (
              <p key={i}>{who ? <b>{who}: </b> : null}{who ? `“${what}”` : what}</p>
            ))}
            <Fw name={d.fw} />
            <p>{d.after}</p>
          </article>
        ))}
      </section>
      <section>
        <h2>Find your use</h2>
        {USES.map((u) => (
          <article key={u.id}>
            <h3>{u.name}</h3>
            <p>{u.ask}</p>
            <Fw name={u.fw} />
            <p>{u.note}</p>
          </article>
        ))}
      </section>
      <section>
        <h2>No camera.</h2>
        <p>All of that. In these. Camera-free glasses with a private display.</p>
        <h3>What runs where?</h3>
        <p>
          The glasses put information in view. The E1O phone app connects your services and manages the experience. Coding agents run on your Mac, which needs to stay
          awake and connected; the glasses let you follow supported sessions and respond.
        </p>
        {visual && <img className="fb-phone" src={ASSETS.phone} alt="The actual E1O app showing recent Twitch Chat messages and its Open on E1 control" loading="lazy" />}
        <h3>The glasses. Every angle.</h3>
        {visual && <img className="fb-hero" src={ASSETS.posterTemple} alt="Close-up of the E1O temple: brushed metal, the hinge and the rounded earpiece." loading="lazy" />}
        <p>
          <a href={LINKS.inspect}>Inspect the glasses</a>. The current hardware concept. Final materials and specifications may change.
        </p>
      </section>
      <section id={visual ? 'access' : undefined}>
        <h2>Get in early.</h2>
        <p>We’re opening access gradually. Leave your number and tell us what you’d put E1O to work on.</p>
        <p>
          <a className={visual ? 'button' : undefined} href={LINKS.waitlist}>
            Join the waitlist
          </a>{' '}
          <a href={LINKS.email}>Request early access by email</a>
        </p>
        <p>Access opens gradually. We haven’t announced a public launch date; joining doesn’t guarantee an invitation.</p>
        <p>
          E1O is short for E1 Optics. E1O is operated by Datost Inc. <a href={LINKS.privacy}>Waitlist privacy</a> · <a href={LINKS.terms}>Messaging terms</a>
        </p>
      </section>
    </>
  )
}

export default function Transcript() {
  return (
    <main className="sr-only" id="top">
      <Story />
    </main>
  )
}
