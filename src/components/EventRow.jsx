import { Link } from 'react-router'
import { getCategory } from '../data/categories.js'
import { formatEventWhen } from '../lib/dates.js'
import { eventStatus, formatPrice } from '../lib/events.js'
import { DateBlock, EventImage, SeatsNote } from './EventBits.jsx'

/** Dense list row for the list view: scan many events by date at a glance. */
export default function EventRow({ event, registrations }) {
  const category = getCategory(event.category)
  const status = eventStatus(event, registrations)

  return (
    <article
      className="group relative grid grid-cols-[3.25rem_1fr] items-center gap-x-4 gap-y-1 py-5 sm:grid-cols-[3.25rem_8.5rem_1fr_auto] sm:gap-x-6"
      style={{ '--cat': category.color }}
    >
      <DateBlock date={event.start} size="sm" />
      <div className="img-frame hidden aspect-[16/10] overflow-hidden rounded-[4px] sm:block">
        <EventImage event={event} sizes="136px" className="size-full object-cover" />
      </div>
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[0.875rem] text-muted">
          <span className="swatch" aria-hidden="true" />
          <span>{category.label}</span>
          <span aria-hidden="true">/</span>
          <span>{event.city}</span>
        </p>
        <h3 className="display mt-1 text-[1.5rem] leading-[1.05]">
          <Link
            to={`/events/${event.slug}`}
            className="decoration-2 underline-offset-4 group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-accent"
          >
            {event.title}
          </Link>
        </h3>
        <p className="mt-1 text-[0.9375rem] text-muted">
          {formatEventWhen(event.start, event.end)}, {event.venue}
        </p>
      </div>
      <div className="col-start-2 flex items-baseline gap-4 text-[0.9375rem] sm:col-start-auto sm:flex-col sm:items-end sm:gap-1">
        <span className="font-semibold">{formatPrice(event.price)}</span>
        <SeatsNote event={event} registrations={registrations} status={status} className="text-[0.875rem]" />
      </div>
    </article>
  )
}
