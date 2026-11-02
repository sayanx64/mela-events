import { useEffect, useState } from 'react'
import { EVENTS } from '../data/events.js'
import { imageUrl } from '../lib/events.js'

// Three rows of event photos drifting in opposite directions behind the hero.
const rows = [EVENTS.slice(0, 9), EVENTS.slice(8, 17), EVENTS.slice(16, 25)]

/** Waits until the page has finished loading and the browser is idle. */
function useAfterLoad() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let idle
    const go = () => {
      idle = (window.requestIdleCallback ?? ((cb) => setTimeout(cb, 200)))(() => setReady(true))
    }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => {
      window.removeEventListener('load', go)
      if (idle) (window.cancelIdleCallback ?? clearTimeout)(idle)
    }
  }, [])
  return ready
}

/**
 * Decorative photo wall. It is mounted only after the page has loaded, so its
 * images never compete with the content people actually came for.
 */
export default function HeroBackdrop() {
  const ready = useAfterLoad()
  return (
    <div aria-hidden="true" className="hero-backdrop pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {ready && (
        <div className="hero-backdrop__tilt">
          {rows.map((row, r) => (
            <div key={r} className={`hero-backdrop__row ${r % 2 ? 'is-reverse' : ''}`}>
              {[...row, ...row].map((event, i) => (
                <img
                  key={i}
                  src={imageUrl(event, 'xs')}
                  alt=""
                  decoding="async"
                  fetchPriority="low"
                  width="480"
                  height="300"
                />
              ))}
            </div>
          ))}
        </div>
      )}
      <div className="hero-backdrop__veil" />
    </div>
  )
}
