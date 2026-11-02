import { Moon, Sun } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { useNow } from '../hooks/useNow.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { useTheme } from '../hooks/useTheme.js'
import { getEvent, isUpcoming } from '../lib/events.js'
import Logo from './Logo.jsx'

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <button
      type="button"
      onClick={(e) => toggle(e.currentTarget)}
      className="btn btn-quiet size-11 min-h-0 p-0"
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </button>
  )
}

function TicketCount() {
  const registrations = useRegistrations()
  const now = useNow()
  const count = registrations.filter((r) => {
    const event = getEvent(r.event)
    return event && isUpcoming(event, now)
  }).length
  if (!count) return null
  return (
    <span className="tabular grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-[0.8125rem] leading-none font-bold text-accent-fg">
      {count}
      <span className="sr-only"> upcoming</span>
    </span>
  )
}

const navClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 font-semibold transition-colors sm:px-4 ${
    isActive ? 'bg-fg text-bg' : 'hover:bg-accent-soft'
  }`

export default function Header() {
  return (
    <header className="site-header sticky top-0 z-40">
      <div className="wrap flex h-[4.5rem] items-center justify-between gap-4">
        <Link to="/" className="rounded-md" aria-label="mela home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-[0.9375rem] sm:gap-2 sm:text-base">
          <NavLink to="/events" className={navClass}>
            Events
          </NavLink>
          <NavLink to="/tickets" className={navClass}>
            <span>
              <span className="hidden xs:inline">My </span>tickets
            </span>
            <TicketCount />
          </NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
