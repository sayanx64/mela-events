/**
 * Registration form validation.
 *
 * Every validator takes a raw string and returns an error message, or an empty
 * string when the value is fine. Messages say what is wrong and how to fix it.
 */

export const MAX_SEATS_PER_REGISTRATION = 4

// Letters from any script, plus the punctuation that shows up in real names.
const NAME_ALLOWED = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u
const LETTER = /\p{L}/gu

export function validateName(raw) {
  const value = raw.trim().replace(/\s+/g, ' ')
  if (!value) return 'Enter your full name.'
  if (!NAME_ALLOWED.test(value)) return 'Use letters only. Spaces, hyphens, apostrophes and full stops are fine.'
  if ((value.match(LETTER) ?? []).length < 2) return 'Your name needs at least two letters.'
  if (value.length > 60) return 'Keep your name under 60 characters.'
  return ''
}

// Practical email check: something@domain.tld, no spaces, no double dots.
const EMAIL = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/

export function validateEmail(raw) {
  const value = raw.trim()
  if (!value) return 'Enter your email address.'
  if (/\s/.test(value)) return 'Email addresses can’t contain spaces.'
  if (!value.includes('@')) return 'An email address needs an @, like name@example.com.'
  if (value.includes('..')) return 'An email address can’t contain two dots in a row.'
  if (value.length > 254 || !EMAIL.test(value)) return 'Enter an email address like name@example.com.'
  return ''
}

const COMMON_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'rediffmail.com',
  'proton.me',
  'protonmail.com',
  'live.com',
]

/** Optimal string alignment distance (Levenshtein plus adjacent swaps). */
export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/**
 * Catches common domain typos ("gmial.com") and returns the corrected address,
 * or null when the domain looks fine or is too different to guess.
 */
export function suggestEmail(raw) {
  const value = raw.trim()
  const at = value.lastIndexOf('@')
  if (at < 1) return null
  const local = value.slice(0, at)
  const domain = value.slice(at + 1).toLowerCase()
  if (!domain || COMMON_DOMAINS.includes(domain)) return null
  let best = null
  for (const candidate of COMMON_DOMAINS) {
    const distance = editDistance(domain, candidate)
    if (distance > 0 && distance <= 2 && (!best || distance < best.distance)) {
      best = { candidate, distance }
    }
  }
  return best ? `${local}@${best.candidate}` : null
}

/** Strips formatting and an optional +91 / 91 / 0 prefix. Returns the bare digits. */
export function phoneDigits(raw) {
  let digits = raw.replace(/[\s\-().]/g, '')
  if (digits.startsWith('+91')) digits = digits.slice(3)
  else if (digits.startsWith('0091')) digits = digits.slice(4)
  else if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits
}

export function validatePhone(raw) {
  const value = raw.trim()
  if (!value) return 'Enter your mobile number.'
  if (/[^\d\s\-+().]/.test(value)) return 'Use digits only, like 98765 43210.'
  const digits = phoneDigits(value)
  if (!/^\d+$/.test(digits)) return 'Use digits only, like 98765 43210.'
  if (digits.length < 10) return `That’s ${digits.length} digit${digits.length === 1 ? '' : 's'}. Indian mobile numbers have 10.`
  if (digits.length > 10) return 'That’s too many digits. Indian mobile numbers have 10.'
  if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9.'
  return ''
}

/** "9876543210" → "+91 98765 43210". Leaves invalid input untouched. */
export function formatPhone(raw) {
  const digits = phoneDigits(raw)
  if (!/^[6-9]\d{9}$/.test(digits)) return raw.trim()
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

/**
 * Validates the whole form.
 * @param {{name: string, email: string, phone: string, event: string, seats: string|number}} values
 * @param {{ event: object|null, seatsLeft: number, isPast: boolean, alreadyRegistered: boolean }} context
 * @returns {Record<string, string>} only the fields that have errors
 */
export function validateRegistration(values, context) {
  const errors = {
    name: validateName(values.name),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    event: validateEventChoice(values.event, context),
    seats: validateSeats(values.seats, context),
  }
  if (!errors.email && !errors.event && context.alreadyRegistered) {
    errors.email = 'This email is already registered for this event. Check My tickets, or use a different email.'
  }
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

export function validateEventChoice(slug, { event, isPast, seatsLeft }) {
  if (!slug) return 'Choose the event you want to attend.'
  if (!event) return 'That event isn’t available. Choose another from the list.'
  if (isPast) return 'This event has already happened. Choose an upcoming one.'
  if (seatsLeft <= 0) return 'This event is sold out. Choose another event.'
  return ''
}

export function validateSeats(raw, { seatsLeft = MAX_SEATS_PER_REGISTRATION } = {}) {
  const seats = Number(raw)
  if (!Number.isInteger(seats) || seats < 1) return 'Choose how many seats you need.'
  if (seats > MAX_SEATS_PER_REGISTRATION) return `You can book up to ${MAX_SEATS_PER_REGISTRATION} seats at a time.`
  if (seatsLeft > 0 && seats > seatsLeft) return `Only ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left. Choose fewer.`
  return ''
}
