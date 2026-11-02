/**
 * Date helpers. Every event happens in India, so everything is formatted in IST
 * regardless of where the visitor's device thinks it is.
 */
export const TIME_ZONE = 'Asia/Kolkata'
const LOCALE = 'en-IN'

const fmt = (options) => new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...options })

const weekdayFmt = fmt({ weekday: 'short' })
const dayFmt = fmt({ day: 'numeric' })
const monthFmt = fmt({ month: 'short' })
const monthYearFmt = fmt({ month: 'long', year: 'numeric' })
const shortDateFmt = fmt({ weekday: 'short', day: 'numeric', month: 'short' })
const longDateFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeFmt = fmt({ hour: 'numeric', minute: '2-digit', hour12: true })
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const isoWeekdayFmt = fmt({ weekday: 'short' })

const toDate = (value) => (value instanceof Date ? value : new Date(value))

/** Parts used by the date block on cards and tickets. */
export function dateParts(value) {
  const date = toDate(value)
  return {
    weekday: weekdayFmt.format(date),
    day: dayFmt.format(date),
    month: monthFmt.format(date),
    year: date.toLocaleString(LOCALE, { timeZone: TIME_ZONE, year: 'numeric' }),
  }
}

/** "7:30 pm" */
export function formatTime(value) {
  return timeFmt.format(toDate(value)).replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toLowerCase()}`)
}

/** "Sat, 14 Nov" */
export function formatShortDate(value) {
  return shortDateFmt.format(toDate(value))
}

/** "Saturday, 14 November 2026" */
export function formatLongDate(value) {
  return longDateFmt.format(toDate(value))
}

/** "November 2026", used to group lists by month. */
export function formatMonthYear(value) {
  return monthYearFmt.format(toDate(value))
}

/** Calendar day in IST as "2026-11-14", for same-day comparisons. */
export function dayKey(value) {
  return ymdFmt.format(toDate(value))
}

export function isMultiDay(start, end) {
  return dayKey(start) !== dayKey(end)
}

/**
 * Human date range for an event.
 * Same day:  "Sat, 14 Nov, 7:30 pm to 11:30 pm"
 * Multi-day: "Fri, 18 Dec to Sun, 20 Dec"
 */
export function formatEventWhen(start, end) {
  if (isMultiDay(start, end)) return `${formatShortDate(start)} to ${formatShortDate(end)}`
  return `${formatShortDate(start)}, ${formatTime(start)} to ${formatTime(end)}`
}

export function isWeekend(value) {
  const day = isoWeekdayFmt.format(toDate(value))
  return day === 'Sat' || day === 'Sun'
}

/** Splits a duration into whole days, hours, minutes and seconds. Negative becomes zero. */
export function splitDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const DAY = 86_400_000

/**
 * A short relative label for when an event starts.
 * Returns "Happening now", "Ended", "Today", "Tomorrow", "In 5 days" or "In 3 weeks".
 */
export function relativeStart(start, end, now = Date.now()) {
  const s = toDate(start).getTime()
  const e = toDate(end).getTime()
  if (now >= e) return 'Ended'
  if (now >= s) return 'Happening now'
  const days = Math.round((Date.parse(`${dayKey(s)}T00:00:00+05:30`) - Date.parse(`${dayKey(now)}T00:00:00+05:30`)) / DAY)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 14) return `In ${days} days`
  if (days < 60) return `In ${Math.round(days / 7)} weeks`
  return `In ${Math.round(days / 30)} months`
}

/** Spoken version of a countdown for screen readers, e.g. "8 days, 4 hours and 12 minutes". */
export function countdownLabel(ms) {
  const { days, hours, minutes } = splitDuration(ms)
  const unit = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  const parts = [days && unit(days, 'day'), (days || hours) && unit(hours, 'hour'), unit(minutes, 'minute')].filter(Boolean)
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}` : parts[0]
}

/** Compact countdown text, e.g. "8d 04h 12m". */
export function compactCountdown(ms) {
  const { days, hours, minutes } = splitDuration(ms)
  const pad = (n) => String(n).padStart(2, '0')
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`
  return `${pad(hours)}h ${pad(minutes)}m`
}
