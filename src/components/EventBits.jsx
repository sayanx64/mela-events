import { ViewTransition } from 'react'
import { getCategory } from '../data/categories.js'
import { dateParts } from '../lib/dates.js'
import { imageUrl, seatsLeft } from '../lib/events.js'

/** Event photo with responsive sources. `transitionName` lets it morph between pages. */
export function EventImage({ event, sizes = '100vw', priority = false, transitionName, className = '' }) {
  const img = (
    <img
      src={imageUrl(event, 'sm')}
      srcSet={`${imageUrl(event, 'sm')} 800w, ${imageUrl(event, 'lg')} 1600w`}
      sizes={sizes}
      width={1600}
      height={1000}
      alt={event.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
    />
  )
  if (!transitionName) return img
  // Only animate when the same photo appears on the next page (card to detail cover).
  return (
    <ViewTransition name={transitionName} share="auto" enter="none" exit="none" update="none">
      {img}
    </ViewTransition>
  )
}

/** Coloured category label, styled like a strip torn off a raffle roll. */
export function CategoryTag({ id, className = '' }) {
  const category = getCategory(id)
  if (!category) return null
  return (
    <span
      className={`inline-flex items-center rounded-[4px] bg-(--cat) px-2 py-0.5 text-[0.8125rem] leading-5 font-semibold text-ink ${className}`}
      style={{ '--cat': category.color }}
    >
      {category.label}
    </span>
  )
}

/** Weekday, big day number, month. Reads like the date on a gig poster. */
export function DateBlock({ date, className = '', size = 'md' }) {
  const { weekday, day, month } = dateParts(date)
  const big = size === 'lg' ? 'text-[3.25rem]' : size === 'sm' ? 'text-[2rem]' : 'text-[2.6rem]'
  return (
    <time dateTime={date} className={`flex w-[3.25rem] flex-none flex-col items-start leading-none ${className}`}>
      <span className="text-[0.8125rem] font-semibold">{weekday}</span>
      <span className={`display tabular mt-1 mb-0.5 ${big}`} style={{ fontStretch: '62%' }}>
        {day}
      </span>
      <span className="text-[0.8125rem] font-semibold">{month}</span>
    </time>
  )
}

/** "Sold out", "12 seats left" and so on. Says nothing when there is plenty of room. */
export function SeatsNote({ event, registrations, status, className = '' }) {
  if (status === 'ended') return <span className={`text-muted ${className}`}>Ended</span>
  if (status === 'live') return <span className={`font-semibold text-success ${className}`}>Happening now</span>
  if (status === 'sold-out') return <span className={`font-semibold text-danger ${className}`}>Sold out</span>
  const left = seatsLeft(event, registrations)
  if (status === 'few-left') {
    return (
      <span className={`font-semibold text-danger ${className}`}>
        {left} seat{left === 1 ? '' : 's'} left
      </span>
    )
  }
  return <span className={`text-muted ${className}`}>{left.toLocaleString('en-IN')} seats left</span>
}
