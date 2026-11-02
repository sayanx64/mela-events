import { Link } from 'react-router'
import { getCategory } from '../data/categories.js'
import { coverTransitionName, eventStatus, formatPrice } from '../lib/events.js'
import { CategoryTag, DateBlock, EventImage, SeatsNote } from './EventBits.jsx'

/**
 * Poster-style event card: photo, date block, title, venue, short description, price.
 * The whole card is clickable through the title link (stretched over the card),
 * so screen readers hear one link with the event name instead of several.
 */
export default function EventCard({
  event,
  registrations,
  sizes = '(min-width: 1280px) 28vw, (min-width: 768px) 45vw, 92vw',
  morph = false,
  priority = false,
  headingLevel = 3,
}) {
  const category = getCategory(event.category)
  const status = eventStatus(event, registrations)
  const Heading = `h${headingLevel}`

  return (
    <article className="group relative flex h-full flex-col" style={{ '--cat': category.color }}>
      <div className="img-frame relative aspect-[16/10] overflow-hidden rounded-[6px]">
        <EventImage
          event={event}
          sizes={sizes}
          priority={priority}
          transitionName={morph ? coverTransitionName(event.slug) : undefined}
          className="size-full object-cover"
        />
        <CategoryTag id={event.category} className="absolute top-3 left-3" />
        {status === 'sold-out' && (
          <span className="absolute top-3 right-3 rounded-[4px] bg-ink px-2 py-0.5 text-[0.8125rem] leading-5 font-semibold text-white">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <DateBlock date={event.start} />
        <div className="min-w-0 flex-1 pt-0.5">
          <Heading className="display text-[1.625rem] leading-[1.02]">
            <Link
              to={`/events/${event.slug}`}
              className="decoration-2 underline-offset-4 group-hover:underline after:absolute after:inset-0 after:rounded-[6px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
            >
              {event.title}
            </Link>
          </Heading>
          <p className="mt-1.5 text-[0.9375rem] leading-snug text-muted">
            {event.venue}, {event.city}
          </p>
        </div>
      </div>

      <p className="mt-3 mb-5 line-clamp-2 text-[0.9375rem] leading-relaxed">{event.summary}</p>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-line pt-3 text-[0.9375rem]">
        <span className="font-semibold">{formatPrice(event.price)}</span>
        <SeatsNote event={event} registrations={registrations} status={status} />
      </div>
    </article>
  )
}
