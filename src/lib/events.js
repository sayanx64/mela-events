import { CATEGORIES, getCategory } from '../data/categories.js'
import { EVENTS } from '../data/events.js'
import { isWeekend } from './dates.js'

const bySlug = new Map(EVENTS.map((event) => [event.slug, event]))

export function getEvent(slug) {
  return bySlug.get(slug) ?? null
}

export const startTime = (event) => Date.parse(event.start)
export const endTime = (event) => Date.parse(event.end)

export const isPast = (event, now = Date.now()) => endTime(event) <= now
export const isUpcoming = (event, now = Date.now()) => !isPast(event, now)

/** Seats booked on this device for an event. */
export function seatsBookedHere(slug, registrations) {
  return registrations.reduce((sum, r) => (r.event === slug ? sum + r.seats : sum), 0)
}

export function seatsLeft(event, registrations = []) {
  return Math.max(0, event.capacity - event.registered - seatsBookedHere(event.slug, registrations))
}

/**
 * Where an event stands right now.
 * 'ended' | 'live' | 'sold-out' | 'few-left' | 'open'
 */
export function eventStatus(event, registrations = [], now = Date.now()) {
  if (isPast(event, now)) return 'ended'
  if (startTime(event) <= now) return 'live'
  const left = seatsLeft(event, registrations)
  if (left === 0) return 'sold-out'
  if (left <= Math.max(5, Math.ceil(event.capacity * 0.1))) return 'few-left'
  return 'open'
}

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function formatPrice(price) {
  return price === 0 ? 'Free' : rupees.format(price)
}

/** Shared name for the photo that morphs from a card into the event page cover. */
export const coverTransitionName = (slug) => `cover-${slug}`

export function imageUrl(event, size = 'sm') {
  return `/images/events/${event.slug}-${size}.webp`
}

export function mapsUrl(event) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue}, ${event.address}`)}`
}

/** Lowercase, strip accents and punctuation so "Café" matches "cafe". */
export function normalise(text) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

function haystack(event) {
  const category = getCategory(event.category)
  return normalise(
    [event.title, event.venue, event.area, event.city, event.host, category?.label, event.summary, ...event.tags].join(' '),
  )
}

const haystacks = new Map(EVENTS.map((event) => [event.slug, haystack(event)]))

/** Every word in the query has to appear somewhere in the event. */
export function matchesQuery(event, query) {
  const terms = normalise(query).split(' ').filter(Boolean)
  if (terms.length === 0) return true
  const text = haystacks.get(event.slug) ?? haystack(event)
  return terms.every((term) => text.includes(term))
}

export const WHEN_OPTIONS = [
  { id: 'any', label: 'Any date' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'month', label: 'Next 30 days' },
  { id: 'weekend', label: 'Weekends only' },
]

export const SORT_OPTIONS = [
  { id: 'soonest', label: 'Soonest first' },
  { id: 'price', label: 'Price, low to high' },
  { id: 'popular', label: 'Filling up fastest' },
]

const DAY = 86_400_000

function matchesWhen(event, when, now) {
  const start = startTime(event)
  switch (when) {
    case 'week':
      return start - now <= 7 * DAY
    case 'month':
      return start - now <= 30 * DAY
    case 'weekend':
      return isWeekend(event.start) || isWeekend(event.end)
    default:
      return true
  }
}

const fillRate = (event) => event.registered / event.capacity

/**
 * Applies search, filters and sorting.
 * @param {object[]} events
 * @param {{q?: string, category?: string, city?: string, when?: string, free?: boolean, sort?: string, includePast?: boolean}} filters
 */
export function filterEvents(events, filters = {}, now = Date.now()) {
  const { q = '', category = '', city = '', when = 'any', free = false, sort = 'soonest', includePast = false } = filters
  const result = events.filter(
    (event) =>
      (includePast || isUpcoming(event, now)) &&
      (!category || event.category === category) &&
      (!city || event.city === city) &&
      (!free || event.price === 0) &&
      matchesWhen(event, when, now) &&
      matchesQuery(event, q),
  )
  const bySoonest = (a, b) => startTime(a) - startTime(b)
  if (sort === 'price') return result.sort((a, b) => a.price - b.price || bySoonest(a, b))
  if (sort === 'popular') return result.sort((a, b) => fillRate(b) - fillRate(a) || bySoonest(a, b))
  return result.sort(bySoonest)
}

/** Number of matching events per category, for the filter chips. */
export function countByCategory(events) {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]))
  for (const event of events) counts[event.category] = (counts[event.category] ?? 0) + 1
  return counts
}

export function upcomingEvents(now = Date.now()) {
  return filterEvents(EVENTS, {}, now)
}

export function relatedEvents(event, now = Date.now(), limit = 3) {
  const others = upcomingEvents(now).filter((e) => e.slug !== event.slug)
  const sameCategory = others.filter((e) => e.category === event.category)
  const sameCity = others.filter((e) => e.city === event.city && e.category !== event.category)
  return [...sameCategory, ...sameCity, ...others].filter((e, i, all) => all.indexOf(e) === i).slice(0, limit)
}
