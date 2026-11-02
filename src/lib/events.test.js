import { describe, expect, it } from 'vitest'
import { EVENTS } from '../data/events.js'
import { CATEGORIES } from '../data/categories.js'
import {
  countByCategory,
  eventStatus,
  filterEvents,
  formatPrice,
  getEvent,
  matchesQuery,
  relatedEvents,
  seatsLeft,
} from './events.js'
import { formatEventWhen, isWeekend, relativeStart, splitDuration } from './dates.js'

const NOW = Date.parse('2026-11-02T12:00:00+05:30')

describe('event data', () => {
  it('has unique slugs, known categories and valid dates', () => {
    const slugs = new Set(EVENTS.map((e) => e.slug))
    expect(slugs.size).toBe(EVENTS.length)
    const categories = new Set(CATEGORIES.map((c) => c.id))
    for (const event of EVENTS) {
      expect(categories.has(event.category), event.slug).toBe(true)
      expect(Date.parse(event.end) > Date.parse(event.start), event.slug).toBe(true)
      expect(event.registered <= event.capacity, event.slug).toBe(true)
      expect(event.summary.length, event.slug).toBeLessThanOrEqual(140)
    }
  })
})

describe('search and filters', () => {
  it('matches every word anywhere in the event, ignoring case and accents', () => {
    const event = getEvent('biryani-trail')
    expect(matchesQuery(event, 'BIRYANI hyderabad')).toBe(true)
    expect(matchesQuery(event, 'biryani pune')).toBe(false)
    expect(matchesQuery(getEvent('raag-and-brass'), 'jazz')).toBe(true)
  })

  it('filters by category, city and price', () => {
    expect(filterEvents(EVENTS, { category: 'film' }, NOW).every((e) => e.category === 'film')).toBe(true)
    expect(filterEvents(EVENTS, { city: 'Kolkata' }, NOW).map((e) => e.slug)).toContain('ray-weekend')
    expect(filterEvents(EVENTS, { free: true }, NOW).every((e) => e.price === 0)).toBe(true)
  })

  it('limits by date window', () => {
    const week = filterEvents(EVENTS, { when: 'week' }, NOW)
    expect(week.length).toBeGreaterThan(0)
    expect(week.every((e) => Date.parse(e.start) - NOW <= 7 * 86_400_000)).toBe(true)
    expect(filterEvents(EVENTS, { when: 'weekend' }, NOW).every((e) => isWeekend(e.start) || isWeekend(e.end))).toBe(true)
  })

  it('sorts soonest first by default and by price on request', () => {
    const soonest = filterEvents(EVENTS, {}, NOW)
    expect(soonest[0].slug).toBe('garage-hours-14')
    const byPrice = filterEvents(EVENTS, { sort: 'price' }, NOW)
    expect(byPrice[0].price).toBe(0)
    expect(byPrice.at(-1).price).toBe(4500)
  })

  it('hides events that have ended', () => {
    const later = Date.parse('2027-01-01T00:00:00+05:30')
    expect(filterEvents(EVENTS, {}, later).some((e) => e.slug === 'build-weekend')).toBe(false)
  })

  it('counts events per category', () => {
    const counts = countByCategory(EVENTS)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(EVENTS.length)
  })

  it('suggests related events without the current one', () => {
    const event = getEvent('ray-weekend')
    const related = relatedEvents(event, NOW)
    expect(related).toHaveLength(3)
    expect(related.some((e) => e.slug === event.slug)).toBe(false)
    expect(related[0].category).toBe('film')
  })
})

describe('seats and status', () => {
  const event = getEvent('wheel-and-clay') // capacity 12, 7 taken

  it('subtracts seats booked on this device', () => {
    expect(seatsLeft(event)).toBe(5)
    expect(seatsLeft(event, [{ event: 'wheel-and-clay', seats: 2 }, { event: 'other', seats: 4 }])).toBe(3)
  })

  it('reports sold out, few left, live and ended', () => {
    expect(eventStatus(getEvent('decoction-and-drip'), [], NOW)).toBe('sold-out')
    expect(eventStatus(event, [{ event: 'wheel-and-clay', seats: 1 }], NOW)).toBe('few-left')
    expect(eventStatus(event, [], Date.parse('2026-11-21T12:00:00+05:30'))).toBe('live')
    expect(eventStatus(event, [], Date.parse('2026-11-22T12:00:00+05:30'))).toBe('ended')
  })
})

describe('formatting', () => {
  it('formats prices in rupees with Indian grouping', () => {
    expect(formatPrice(0)).toBe('Free')
    expect(formatPrice(4500)).toBe('₹4,500')
  })

  it('describes single and multi-day events', () => {
    const single = getEvent('garage-hours-14')
    expect(formatEventWhen(single.start, single.end)).toBe('Sat, 7 Nov, 7:30 pm to 11:30 pm')
    const multi = getEvent('low-tide-weekender')
    expect(formatEventWhen(multi.start, multi.end)).toBe('Fri, 18 Dec to Sun, 20 Dec')
  })

  it('gives relative start labels', () => {
    const e = getEvent('open-mic-tuesdays') // Tue 10 Nov, 8 pm
    expect(relativeStart(e.start, e.end, NOW)).toBe('In 8 days')
    expect(relativeStart(e.start, e.end, Date.parse('2026-11-09T09:00:00+05:30'))).toBe('Tomorrow')
    expect(relativeStart(e.start, e.end, Date.parse('2026-11-10T21:00:00+05:30'))).toBe('Happening now')
  })

  it('splits durations', () => {
    expect(splitDuration((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
    expect(splitDuration(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})
