import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { TicketPortrait } from './Ticket.jsx'

// Resting positions for the pile, top ticket first.
const FAN = [
  { x: 0, y: 0, rotate: -2.5, scale: 1 },
  { x: 30, y: 12, rotate: 4.5, scale: 0.965 },
  { x: -26, y: 22, rotate: -7, scale: 0.935 },
  { x: 44, y: 30, rotate: 8.5, scale: 0.905 },
  { x: -40, y: 36, rotate: -10.5, scale: 0.875 },
]

const SPRING = { type: 'spring', stiffness: 260, damping: 28, mass: 0.9 }

/**
 * A pile of real-looking tickets for the next few events. Drag or swipe the top
 * one away (or use the arrow buttons / arrow keys) to send it to the back.
 */
export default function TicketStack({ events }) {
  const [order, setOrder] = useState(() => events.map((_, i) => i))
  const [dealt, setDealt] = useState(false)
  const dragged = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const id = setTimeout(() => setDealt(true), 1400)
    return () => clearTimeout(id)
  }, [])

  const next = () => setOrder((o) => [...o.slice(1), o[0]])
  const prev = () => setOrder((o) => [o.at(-1), ...o.slice(0, -1)])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    }
  }

  const top = events[order[0]]
  const position = order[0] + 1

  return (
    <div className="flex flex-col items-center" onKeyDown={onKeyDown}>
      <div className="relative grid w-[min(80vw,21.5rem)] [&>*]:col-start-1 [&>*]:row-start-1">
        {events.map((event, i) => {
          const p = order.indexOf(i)
          const isTop = p === 0
          const resting = FAN[Math.min(p, FAN.length - 1)]
          return (
            <motion.div
              key={event.slug}
              className="ticket-shadow touch-pan-y select-none"
              style={{ zIndex: events.length - p, cursor: isTop ? 'grab' : 'default' }}
              initial={reduceMotion ? false : { opacity: 0, y: 140, x: 0, rotate: 0, scale: 0.96 }}
              animate={{ opacity: 1, ...resting }}
              transition={reduceMotion ? { duration: 0 } : dealt ? SPRING : { ...SPRING, delay: 0.5 + (events.length - 1 - p) * 0.08 }}
              drag={isTop ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.55}
              whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
              onDragStart={() => {
                dragged.current = true
              }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 650) next()
                // Let the click that follows a drag be ignored, then reset.
                setTimeout(() => (dragged.current = false), 0)
              }}
              aria-hidden={!isTop}
              inert={!isTop}
            >
              <Link
                to={`/events/${event.slug}`}
                draggable={false}
                onClick={(e) => dragged.current && e.preventDefault()}
                className="block rounded-[18px] focus-visible:outline-offset-6"
              >
                <TicketPortrait event={event} priority={i === 0} headingLevel={3} />
              </Link>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-12 flex items-center gap-3">
        <button type="button" onClick={prev} className="btn btn-secondary size-11 min-h-0 p-0" aria-label="Previous event">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <p className="tabular min-w-[4.5rem] text-center text-[0.9375rem] text-muted" aria-live="polite">
          <span className="sr-only">Showing {top.title}, </span>
          {position} of {events.length}
        </p>
        <button type="button" onClick={next} className="btn btn-secondary size-11 min-h-0 p-0" aria-label="Next event">
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
