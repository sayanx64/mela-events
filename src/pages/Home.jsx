import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import EventCard from '../components/EventCard.jsx'
import { CategoryTag, coverTransitionName, EventImage, SeatsNote } from '../components/EventBits.jsx'
import HeroBackdrop from '../components/HeroBackdrop.jsx'
import SearchForm from '../components/SearchForm.jsx'
import TicketStack from '../components/TicketStack.jsx'
import { CATEGORIES, CITIES } from '../data/categories.js'
import { EVENTS } from '../data/events.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { formatEventWhen, relativeStart } from '../lib/dates.js'
import { countByCategory, eventStatus, filterEvents, formatPrice, getEvent, isUpcoming } from '../lib/events.js'

function Hero({ upcoming, registrations }) {
  const nextUp = upcoming.slice(0, 5)
  const myNext = registrations
    .map((r) => ({ registration: r, event: getEvent(r.event) }))
    .filter(({ event }) => event && isUpcoming(event))
    .sort((a, b) => Date.parse(a.event.start) - Date.parse(b.event.start))[0]

  return (
    <div className="relative isolate">
    <HeroBackdrop />
    <section className="wrap grid items-start gap-y-16 pt-6 pb-8 lg:grid-cols-12 lg:pt-12 lg:pb-16">
      <div className="relative z-10 lg:col-span-7">
        <h1 className="hero-title">
          <span className="line">
            <span>Go out</span>
          </span>
          <span className="line">
            <span>more.</span>
          </span>
        </h1>
        <p className="mt-8 max-w-[33rem] text-[1.1875rem] leading-relaxed">
          {upcoming.length} gigs, talks, workshops, food walks and screenings across eight cities. Find one you like and
          save a seat in under a minute.
        </p>
        <SearchForm className="mt-8 max-w-[35rem]" />
        <p className="mt-5 max-w-[35rem] text-[0.9375rem] leading-loose text-muted">
          Or start with a city:{' '}
          {CITIES.map((city, i) => (
            <span key={city}>
              <Link to={`/events?city=${city}`} className="link text-fg">
                {city}
              </Link>
              {i < CITIES.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
        {myNext && (
          <p className="mt-8 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-accent-soft py-2 pr-2 pl-4 text-[0.9375rem]">
            <span>
              You’re going to <strong className="font-semibold">{myNext.event.title}</strong>{' '}
              {relativeStart(myNext.event.start, myNext.event.end).toLowerCase()}.
            </span>
            <Link to="/tickets" className="btn btn-primary btn-sm min-h-9">
              Show ticket
            </Link>
          </p>
        )}
      </div>

      <section aria-labelledby="next-up" className="relative z-20 flex flex-col items-center lg:col-span-5 lg:items-end lg:pt-4">
        <h2 id="next-up" className="sr-only">
          Next up
        </h2>
        <div className="lg:mr-6 xl:mr-10">
          <TicketStack events={nextUp} />
        </div>
      </section>
    </section>
    </div>
  )
}

function SectionHeading({ id, title, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4 border-b border-line pb-6">
      <h2 id={id} className="display text-[clamp(2.75rem,6.5vw,5.5rem)] leading-[0.88]">
        {title}
      </h2>
      {children}
    </div>
  )
}

function Featured({ events, registrations }) {
  const [lead, ...rest] = events
  if (!lead) return null
  return (
    <section aria-labelledby="featured" className="wrap mt-20 lg:mt-28">
      <SectionHeading id="featured" title="Worth planning around">
        <p className="max-w-xs text-muted">The bigger nights and weekends of the season. These fill up first.</p>
      </SectionHeading>

      <div className="mt-10 grid gap-x-12 gap-y-12 lg:grid-cols-12">
        <article className="group relative lg:col-span-7">
          <div className="img-frame parallax relative aspect-[16/10] overflow-hidden rounded-[6px]">
            <EventImage
              event={lead}
              sizes="(min-width: 1024px) 55vw, 92vw"
              transitionName={coverTransitionName(lead.slug)}
              className="size-full object-cover"
            />
            <CategoryTag id={lead.category} className="absolute top-4 left-4" />
          </div>
          <p className="mt-6 text-[1.0625rem] font-semibold">
            {formatEventWhen(lead.start, lead.end)}
          </p>
          <h3 className="display mt-2 text-[clamp(2.5rem,4.6vw,4rem)] leading-[0.9]">
            <Link
              to={`/events/${lead.slug}`}
              className="decoration-[3px] underline-offset-[6px] group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
            >
              {lead.title}
            </Link>
          </h3>
          <p className="mt-3 text-muted">
            {lead.venue}, {lead.area}, {lead.city}
          </p>
          <p className="mt-4 max-w-[38rem] text-[1.0625rem] leading-relaxed">{lead.summary}</p>
          <p className="mt-5 flex gap-5 text-[0.9375rem]">
            <span className="font-semibold">{formatPrice(lead.price)}</span>
            <SeatsNote event={lead} registrations={registrations} status={eventStatus(lead, registrations)} />
          </p>
        </article>

        <ul className="divide-y divide-line border-y border-line lg:col-span-5 lg:self-start">
          {rest.map((event) => (
            <li key={event.slug}>
              <article className="group relative grid grid-cols-[7.5rem_1fr] gap-5 py-5 sm:grid-cols-[10rem_1fr]">
                <div className="img-frame aspect-[16/10] overflow-hidden rounded-[4px]">
                  <EventImage event={event} sizes="160px" transitionName={coverTransitionName(event.slug)} className="size-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.875rem] font-semibold">{formatEventWhen(event.start, event.end)}</p>
                  <h3 className="display mt-1 text-[1.5rem] leading-[1]">
                    <Link
                      to={`/events/${event.slug}`}
                      className="decoration-2 underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-accent"
                    >
                      {event.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-[0.9375rem] text-muted">
                    {event.venue}, {event.city}
                  </p>
                  <p className="mt-1 hidden text-[0.9375rem] sm:line-clamp-2">{event.summary}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Categories({ upcoming }) {
  const counts = countByCategory(upcoming)
  return (
    <section aria-labelledby="categories" className="wrap mt-24 lg:mt-32">
      <SectionHeading id="categories" title="Browse by what you’re into" />
      <ul className="mt-10 grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((c) => (
          <li key={c.id}>
            <Link
              to={`/events?category=${c.id}`}
              className="raffle flex h-full flex-col px-8 pt-6 pb-5 transition-transform duration-300 ease-(--ease-out) hover:-translate-y-1 hover:-rotate-1 focus-visible:-rotate-1"
              style={{ '--cat': c.color }}
            >
              <span className="display text-[1.85rem] leading-none">{c.label}</span>
              <span className="mt-2 text-[0.9375rem] leading-snug">{c.blurb}</span>
              <span className="tabular mt-6 text-[0.9375rem] font-semibold">
                {counts[c.id]} event{counts[c.id] === 1 ? '' : 's'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ComingUp({ upcoming, registrations }) {
  const [city, setCity] = useState('')
  const reduceMotion = useReducedMotion()
  const inCity = city ? upcoming.filter((e) => e.city === city) : upcoming
  const shown = inCity.slice(0, 6)

  return (
    <section aria-labelledby="coming-up" className="wrap mt-24 lg:mt-32">
      <SectionHeading id="coming-up" title="Coming up" />
      <div role="group" aria-label="Show events in" className="scroll-row -mx-(--gutter) mt-6 flex gap-2 px-(--gutter) pb-1">
        {['', ...CITIES].map((c) => (
          <button
            key={c || 'all'}
            type="button"
            aria-pressed={city === c}
            onClick={() => setCity(c)}
            className={`btn btn-sm flex-none border-[1.5px] ${
              city === c ? 'border-fg bg-fg text-bg' : 'border-line-strong hover:border-fg'
            }`}
          >
            {c || 'All cities'}
          </button>
        ))}
      </div>

      <motion.ul layout={!reduceMotion} className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((event) => (
            <motion.li
              key={event.slug}
              layout={!reduceMotion}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <EventCard event={event} registrations={registrations} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <div className="mt-14">
        <Link to={city ? `/events?city=${city}` : '/events'} className="btn btn-secondary">
          See all {inCity.length} events{city ? ` in ${city}` : ''}
        </Link>
      </div>
    </section>
  )
}

export default function Home() {
  const registrations = useRegistrations()
  // Computed once per visit; countdowns tick on their own.
  const upcoming = useMemo(() => filterEvents(EVENTS, {}), [])
  const featured = upcoming.filter((e) => e.featured)

  return (
    <>
      <title>mela | Go out more</title>
      <Hero upcoming={upcoming} registrations={registrations} />
      <Featured events={featured} registrations={registrations} />
      <Categories upcoming={upcoming} />
      <ComingUp upcoming={upcoming} registrations={registrations} />
    </>
  )
}
