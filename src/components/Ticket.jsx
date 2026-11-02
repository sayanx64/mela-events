import { getCategory } from '../data/categories.js'
import { compactCountdown, countdownLabel, dateParts, formatEventWhen, formatTime } from '../lib/dates.js'
import { formatPrice, startTime } from '../lib/events.js'
import { useNow } from '../hooks/useNow.js'
import { EventImage } from './EventBits.jsx'
import QrCode from './QrCode.jsx'

function StubDate({ date }) {
  const { weekday, day, month } = dateParts(date)
  return (
    <time dateTime={date} className="flex flex-col leading-none">
      <span className="text-[0.875rem] font-semibold">{weekday}</span>
      <span className="display tabular mt-1 text-[3.6rem]" style={{ fontStretch: '60%' }}>
        {day}
      </span>
      <span className="text-[0.875rem] font-semibold">{month}</span>
    </time>
  )
}

function LiveCountdown({ event }) {
  const now = useNow()
  const ms = startTime(event) - now
  if (Date.parse(event.end) <= now) return <span className="font-semibold">Ended</span>
  if (ms <= 0) return <span className="font-semibold">Happening now</span>
  return (
    <span className="tabular font-semibold">
      <span aria-hidden="true">{compactCountdown(ms)}</span>
      <span className="sr-only">{countdownLabel(ms)}</span>
    </span>
  )
}

/**
 * Portrait ticket: photo on top, details, then a coloured stub below the perforation.
 * With a `registration` the stub carries a scannable QR code and the ticket id;
 * without one it shows a live countdown and the price.
 */
export function TicketPortrait({
  event,
  registration,
  name,
  seats,
  countdown = true,
  priority = false,
  stamp = null,
  className = '',
  headingLevel = 3,
}) {
  const category = getCategory(event.category)
  const Heading = `h${headingLevel}`
  const holder = registration?.name ?? name
  const seatCount = registration?.seats ?? seats

  return (
    <div className={`ticket ticket--portrait ${className}`} style={{ '--cat': category.color }}>
      <div className="flex min-h-0 flex-col">
        <div className="img-frame aspect-[16/10] flex-none overflow-hidden">
          <EventImage event={event} sizes="380px" priority={priority} className="size-full object-cover" />
        </div>
        <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
          <p className="flex items-center gap-2 text-[0.875rem] text-muted">
            <span className="swatch" aria-hidden="true" />
            {category.label} in {event.city}
          </p>
          <Heading className="display mt-1.5 text-[1.85rem] leading-[0.98]">{event.title}</Heading>
          <p className="mt-2 text-[0.9375rem] leading-snug text-muted">
            {formatTime(event.start)}, {event.venue}
          </p>
          {holder !== undefined && (
            <p className="mt-auto flex items-baseline justify-between gap-3 border-t border-dashed border-line-strong pt-3 text-[0.9375rem]">
              <span className={`truncate font-semibold ${holder ? '' : 'text-muted'}`}>{holder || 'Your name'}</span>
              <span className="tabular flex-none text-muted">
                {seatCount} seat{Number(seatCount) === 1 ? '' : 's'}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="ticket__stub flex items-end justify-between gap-4 px-5 pt-5 pb-4">
        <StubDate date={event.start} />
        {registration ? (
          <div className="flex items-end gap-3">
            <p className="ticket__serial text-right text-[0.8125rem] leading-tight font-semibold">
              Admit {registration.seats}
              <br />
              {registration.id}
            </p>
            <QrCode value={registration.id} size={84} className="rounded-[4px]" />
          </div>
        ) : (
          <div className="text-right leading-tight">
            {countdown && (
              <>
                <span className="block text-[0.8125rem]">Starts in</span>
                <span className="block text-[1.125rem]">
                  <LiveCountdown event={event} />
                </span>
              </>
            )}
            <span className="ticket__serial mt-2 block text-[0.9375rem] font-semibold">{formatPrice(event.price)}</span>
          </div>
        )}
      </div>
      {stamp}
    </div>
  )
}

/** Landscape ticket for the My tickets wallet. */
export function TicketLandscape({ event, registration, className = '', headingLevel = 2 }) {
  const category = getCategory(event.category)
  const Heading = `h${headingLevel}`
  return (
    <div className={`ticket ticket--landscape min-h-[13.5rem] ${className}`} style={{ '--cat': category.color }}>
      <div className="grid min-w-0 grid-cols-1 sm:grid-cols-[minmax(0,11rem)_1fr]">
        <div className="img-frame hidden overflow-hidden sm:block">
          <EventImage event={event} sizes="176px" className="size-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <p className="flex items-center gap-2 text-[0.875rem] text-muted">
            <span className="swatch" aria-hidden="true" />
            {category.label} in {event.city}
          </p>
          <Heading className="display mt-1.5 text-[1.75rem] leading-[1] sm:text-[2rem]">{event.title}</Heading>
          <p className="mt-2 text-[0.9375rem] leading-snug">{formatEventWhen(event.start, event.end)}</p>
          <p className="text-[0.9375rem] leading-snug text-muted">{event.venue}</p>
          <p className="mt-auto flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-dashed border-line-strong pt-3 text-[0.9375rem]">
            <span className="font-semibold">{registration.name}</span>
            <span className="tabular text-muted">
              {registration.seats} seat{registration.seats === 1 ? '' : 's'}
            </span>
          </p>
        </div>
      </div>
      <div className="ticket__stub flex flex-col items-center justify-center gap-2 p-4 text-center">
        <QrCode value={registration.id} size={92} className="rounded-[4px]" />
        <p className="ticket__serial text-[0.8125rem] leading-tight font-semibold">{registration.id}</p>
      </div>
    </div>
  )
}
