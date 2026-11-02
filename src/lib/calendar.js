/**
 * Builds an .ics calendar file (RFC 5545) so a ticket can be added to any calendar app.
 */

const toUtcStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// Commas, semicolons, backslashes and newlines must be escaped in text values.
const escapeText = (text) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

// Lines longer than 75 octets are folded with CRLF + space.
function fold(line) {
  const parts = []
  let rest = line
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74))
    rest = ` ${rest.slice(74)}`
  }
  parts.push(rest)
  return parts.join('\r\n')
}

export function buildCalendarFile(event, registration, siteUrl = '') {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//mela//events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${registration?.id ?? event.slug}@mela`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(event.start)}`,
    `DTEND:${toUtcStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(`${event.venue}, ${event.address}`)}`,
    `DESCRIPTION:${escapeText(
      [event.summary, registration ? `Ticket ${registration.id} for ${registration.seats} seat${registration.seats > 1 ? 's' : ''}.` : '', siteUrl ? `${siteUrl}/events/${event.slug}` : '']
        .filter(Boolean)
        .join('\n\n'),
    )}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`${event.title} starts in 2 hours`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n')
}

export function downloadFile(filename, contents, type) {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCalendarFile(event, registration) {
  const ics = buildCalendarFile(event, registration, window.location.origin)
  downloadFile(`${event.slug}.ics`, ics, 'text/calendar;charset=utf-8')
}
