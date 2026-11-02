import { ArrowLeft, Check, MapPin, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import Countdown from '../components/Countdown.jsx'
import EventCard from '../components/EventCard.jsx'
import { CategoryTag, coverTransitionName, EventImage } from '../components/EventBits.jsx'
import { getCategory } from '../data/categories.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { formatLongDate, formatTime, isMultiDay } from '../lib/dates.js'
import { eventStatus, formatPrice, getEvent, mapsUrl, relatedEvents, seatsLeft } from '../lib/events.js'
import NotFound from './NotFound.jsx'

function ShareButton({ event }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text: event.summary, url })
      } catch {
        /* the visitor closed the share sheet */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  return (
    <button type="button" onClick={share} className="btn btn-quiet btn-sm" aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  )
}

/** The booking panel is drawn as a ticket: details up top, countdown and action on the stub. */
function BookingTicket({ event, registrations }) {
  const status = eventStatus(event, registrations)
  const left = seatsLeft(event, registrations)
  const taken = event.capacity - left
  const mine = registrations.filter((r) => r.event === event.slug)
  const multiDay = isMultiDay(event.start, event.end)

  return (
    <div className="ticket-shadow">
      <div className="ticket ticket--portrait [--stub:14.5rem]">
        <dl className="grid content-start gap-5 p-6 text-[0.9375rem]">
          <div>
            <dt className="text-muted">When</dt>
            <dd className="mt-0.5 font-semibold">
              {multiDay ? (
                <>
                  {formatLongDate(event.start)}, {formatTime(event.start)}
                  <br />
                  to {formatLongDate(event.end)}, {formatTime(event.end)}
                </>
              ) : (
                <>
                  {formatLongDate(event.start)}
                  <br />
                  {formatTime(event.start)} to {formatTime(event.end)}
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Where</dt>
            <dd className="mt-0.5">
              <span className="font-semibold">{event.venue}</span>
              <br />
              {event.address}
            </dd>
          </div>
          <div className="flex gap-10">
            <div>
              <dt className="text-muted">Price</dt>
              <dd className="mt-0.5 font-semibold">
                {formatPrice(event.price)}
                {event.price > 0 && <span className="font-normal text-muted"> a seat</span>}
              </dd>
            </div>
            <div className="flex-1">
              <dt className="text-muted">Seats</dt>
              <dd className="mt-0.5">
                <span className="font-semibold">{left.toLocaleString('en-IN')}</span> of{' '}
                <span>{event.capacity.toLocaleString('en-IN')}</span> left
                <span
                  className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line"
                  role="img"
                  aria-label={`${Math.round((taken / event.capacity) * 100)}% of seats taken`}
                >
                  <span className="block h-full rounded-full bg-fg" style={{ width: `${(taken / event.capacity) * 100}%` }} />
                </span>
              </dd>
            </div>
          </div>
        </dl>

        <div className="ticket__stub flex flex-col justify-between gap-4 p-5 pt-6">
          {status === 'open' || status === 'few-left' ? (
            <>
              <div>
                <p className="mb-2 text-[0.875rem] font-semibold">Starts in</p>
                <Countdown to={event.start} />
              </div>
              {mine.length > 0 ? (
                <div className="grid gap-2">
                  <Link to="/tickets" className="btn w-full bg-ink text-white hover:bg-ink/85">
                    <Check className="size-5" aria-hidden="true" />
                    You’re going. View ticket
                  </Link>
                  <Link to={`/register?event=${event.slug}`} className="text-center text-[0.9375rem] font-semibold underline underline-offset-4">
                    Register someone else
                  </Link>
                </div>
              ) : (
                <Link to={`/register?event=${event.slug}`} className="btn w-full bg-ink text-[1.0625rem] text-white hover:bg-ink/85">
                  Register for this event
                </Link>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <p className="display text-[2.5rem] leading-none">
                {status === 'sold-out' ? 'Sold out' : status === 'live' ? 'Happening now' : 'This one’s over'}
              </p>
              <p className="mt-3 text-[0.9375rem] leading-snug">
                {status === 'sold-out'
                  ? 'Every seat is taken. Seats freed up by cancellations show up here.'
                  : status === 'live'
                    ? 'Registration has closed. If you have a ticket, show it at the door.'
                    : 'This event has finished. Have a look at what’s coming up instead.'}
              </p>
              {mine.length > 0 && (
                <Link to="/tickets" className="btn mt-4 w-full bg-ink text-white hover:bg-ink/85">
                  View your ticket
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventDetail() {
  const { slug } = useParams()
  const registrations = useRegistrations()
  const event = getEvent(slug)
  if (!event) return <NotFound />

  const category = getCategory(event.category)
  const status = eventStatus(event, registrations)
  const related = relatedEvents(event)
  const canRegister = status === 'open' || status === 'few-left'

  return (
    <article style={{ '--cat': category.color }} className="pb-24 lg:pb-0">
      <title>{`${event.title} | mela`}</title>
      <meta name="description" content={event.summary} />

      <div className="wrap pt-6 lg:pt-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/events" className="btn btn-quiet btn-sm -ml-3">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All events
          </Link>
          <ShareButton event={event} />
        </div>

        <header className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="flex flex-wrap items-center gap-3 text-[0.9375rem]">
              <CategoryTag id={event.category} />
              <span className="text-muted">
                {event.area}, {event.city}
              </span>
            </p>
            <h1 className="display mt-4 text-[clamp(3.25rem,8.5vw,8rem)] leading-[0.84]">{event.title}</h1>
          </div>
          <p className="max-w-[34rem] text-[1.1875rem] leading-relaxed lg:col-span-4">{event.summary}</p>
        </header>

        <div className="img-frame mt-10 aspect-[16/10] overflow-hidden rounded-[8px] sm:aspect-[2/1] lg:aspect-[21/9]">
          <EventImage
            event={event}
            sizes="(min-width: 1500px) 1400px, 100vw"
            priority
            transitionName={coverTransitionName(event.slug)}
            className="size-full object-cover"
          />
        </div>

        <div className="mt-14 grid gap-x-16 gap-y-14 lg:grid-cols-12">
          <div className="space-y-14 lg:col-span-7">
            <section aria-labelledby="about">
              <h2 id="about" className="display text-[2.25rem] leading-none">
                About
              </h2>
              <div className="mt-5 max-w-[40rem] space-y-4 text-[1.125rem] leading-[1.7]">
                {event.description.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <p className="mt-6 text-[0.9375rem] text-muted">Hosted by {event.host}</p>
            </section>

            <section aria-labelledby="schedule">
              <h2 id="schedule" className="display text-[2.25rem] leading-none">
                Schedule
              </h2>
              <ol className="mt-5 max-w-[40rem] border-t border-line">
                {event.schedule.map((item) => (
                  <li key={item.time + item.title} className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-line py-3.5 text-[1.0625rem]">
                    <span className="font-semibold">{item.time}</span>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="good-to-know">
              <h2 id="good-to-know" className="display text-[2.25rem] leading-none">
                Good to know
              </h2>
              <ul className="mt-5 grid max-w-[40rem] gap-x-8 gap-y-3 text-[1.0625rem] sm:grid-cols-2">
                {event.goodToKnow.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="swatch mt-[0.45em]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="where">
              <h2 id="where" className="display text-[2.25rem] leading-none">
                Getting there
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed">
                <span className="font-semibold">{event.venue}</span>
                <br />
                {event.address}
              </p>
              <a href={mapsUrl(event)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm mt-5">
                <MapPin className="size-4" aria-hidden="true" />
                Open in Google Maps
              </a>
            </section>
          </div>

          <aside aria-label="Registration" className="lg:col-span-5 xl:col-span-4 xl:col-start-9">
            <div className="lg:sticky lg:top-24">
              <BookingTicket event={event} registrations={registrations} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-28">
            <h2 id="related" className="display border-b border-line pb-5 text-[clamp(2.5rem,5vw,4rem)] leading-none">
              You might also like
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <li key={e.slug}>
                  <EventCard event={e} registrations={registrations} morph />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Mobile: keep the action within thumb reach. */}
      {canRegister && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-sm lg:hidden">
          <div className="wrap flex items-center justify-between gap-4 py-3">
            <p className="leading-tight">
              <span className="block font-semibold">{formatPrice(event.price)}</span>
              <span className="text-[0.875rem] text-muted">{seatsLeft(event, registrations)} seats left</span>
            </p>
            <Link to={`/register?event=${event.slug}`} className="btn btn-primary">
              Register
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}
