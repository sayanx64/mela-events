import { Link } from 'react-router'
import { CATEGORIES, CITIES } from '../data/categories.js'
import { FerrisWheel } from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="mt-32 overflow-hidden bg-ink text-[#eeedf6] dark:bg-sunken">
      <div className="wrap grid gap-12 pt-16 pb-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <FerrisWheel className="mb-6 size-24 text-[#eeedf6]" />
          <p className="text-[1.0625rem] leading-relaxed text-[#c9c6e4]">
            Gigs, talks, workshops, food walks and screenings across eight Indian cities. Find one, save a seat, show the
            ticket at the door.
          </p>
        </div>
        <nav aria-label="Categories">
          <h2 className="font-sans text-[0.9375rem] font-semibold text-[#c9c6e4]">Categories</h2>
          <ul className="mt-3 space-y-1.5">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link to={`/events?category=${c.id}`} className="link">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Cities">
          <h2 className="font-sans text-[0.9375rem] font-semibold text-[#c9c6e4]">Cities</h2>
          <ul className="mt-3 space-y-1.5">
            {CITIES.map((city) => (
              <li key={city}>
                <Link to={`/events?city=${city}`} className="link">
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-sans text-[0.9375rem] font-semibold text-[#c9c6e4]">About this project</h2>
          <ul className="mt-3 space-y-1.5">
            <li>
              <Link to="/tickets" className="link">
                My tickets
              </Link>
            </li>
            <li>
              <a href="https://github.com/sayanx64/mela-events" className="link" rel="noreferrer" target="_blank">
                Source on GitHub
              </a>
            </li>
            <li>
              <a href="https://unsplash.com/license" className="link" rel="noreferrer" target="_blank">
                Photos from Unsplash
              </a>
            </li>
          </ul>
          <p className="mt-6 text-[0.875rem] leading-relaxed text-[#a9a6c6]">
            Built by sayanx64 for K Explore, Web Designing. Events and venues are made up for this project.
          </p>
        </div>
      </div>
      <div className="footer-mark-box wrap mt-6" aria-hidden="true">
        <p className="footer-mark -mb-[0.05em] -translate-x-[0.036em] select-none text-[#eeedf6]">mela</p>
      </div>
    </footer>
  )
}
