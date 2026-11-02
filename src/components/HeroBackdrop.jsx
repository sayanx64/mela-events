import { EVENTS } from '../data/events.js'
import { imageUrl } from '../lib/events.js'

// Three rows of event photos drifting in opposite directions behind the hero.
const rows = [EVENTS.slice(0, 9), EVENTS.slice(8, 17), EVENTS.slice(16, 25)]

export default function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-backdrop__tilt">
        {rows.map((row, r) => (
          <div key={r} className={`hero-backdrop__row ${r % 2 ? 'is-reverse' : ''}`}>
            {[...row, ...row].map((event, i) => (
              <img key={i} src={imageUrl(event, 'sm')} alt="" loading="lazy" decoding="async" width="800" height="500" />
            ))}
          </div>
        ))}
      </div>
      <div className="hero-backdrop__veil" />
    </div>
  )
}
