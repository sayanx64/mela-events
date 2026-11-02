import { describe, expect, it } from 'vitest'
import { getEvent } from './events.js'
import { buildCalendarFile } from './calendar.js'

describe('buildCalendarFile', () => {
  const event = getEvent('raag-and-brass')
  const ics = buildCalendarFile(event, { id: 'ML-AAAA-BBBB', seats: 2 }, 'https://example.com')

  it('wraps a single VEVENT in a VCALENDAR with CRLF line endings', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.endsWith('END:VCALENDAR')).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })

  it('converts IST times to UTC', () => {
    // 19:00 IST is 13:30 UTC
    expect(ics).toContain('DTSTART:20261212T133000Z')
    expect(ics).toContain('DTEND:20261212T163000Z')
  })

  it('escapes commas in text and keeps lines short', () => {
    expect(ics).toContain('LOCATION:Bowbazar Music Hall\\, Bepin Behari Ganguly Street')
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75)
  })

  it('uses the ticket id as a stable UID', () => {
    expect(ics).toContain('UID:ML-AAAA-BBBB@mela')
  })
})
