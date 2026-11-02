/**
 * A tiny local database for registrations, backed by Web Storage.
 *
 * - One JSON array under a versioned key, so the shape can change later without
 *   breaking data already saved in someone's browser.
 * - Records are checked on read; anything malformed is dropped rather than crashing the app.
 * - Subscribers are notified on every change, including changes made in another tab
 *   (via the `storage` event), which is what useSyncExternalStore needs.
 * - The storage object is injected, so tests can run against an in-memory fake.
 */

export const STORAGE_KEY = 'mela:v1:registrations'

// Crockford base32 without I, L, O, U: easy to read aloud at a venue desk.
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function createTicketId(random = cryptoRandom) {
  const bytes = random(8)
  const chars = Array.from(bytes, (b) => ID_ALPHABET[b % 32])
  return `ML-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`
}

function cryptoRandom(length) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function isRecord(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'string' &&
    typeof value.event === 'string' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.phone === 'string' &&
    Number.isInteger(value.seats) &&
    value.seats > 0 &&
    typeof value.createdAt === 'string'
  )
}

export class StorageUnavailableError extends Error {
  constructor(cause) {
    super('Your browser blocked saving data on this device, so the ticket could not be stored.')
    this.name = 'StorageUnavailableError'
    this.cause = cause
  }
}

const EMPTY = Object.freeze([])

export function createRegistrationStore(storage) {
  let cache = null
  const listeners = new Set()

  function read() {
    if (cache) return cache
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      cache = Array.isArray(parsed) ? Object.freeze(parsed.filter(isRecord)) : EMPTY
    } catch {
      cache = EMPTY
    }
    return cache
  }

  function write(next) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      throw new StorageUnavailableError(error)
    }
    cache = Object.freeze(next)
    listeners.forEach((listener) => listener())
  }

  const sameEmail = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

  return {
    /** All registrations, oldest first. The array is frozen and only replaced on change. */
    getAll: read,

    get(id) {
      return read().find((r) => r.id === id) ?? null
    },

    findByEventAndEmail(eventSlug, email) {
      return read().find((r) => r.event === eventSlug && sameEmail(r.email, email)) ?? null
    },

    forEvent(eventSlug) {
      return read().filter((r) => r.event === eventSlug)
    },

    /** Saves a registration and returns the stored record (with its new ticket id). */
    add({ event, name, email, phone, seats }) {
      const existing = read()
      let id = createTicketId()
      while (existing.some((r) => r.id === id)) id = createTicketId()
      const record = {
        id,
        event,
        name: name.trim().replace(/\s+/g, ' '),
        email: email.trim().toLowerCase(),
        phone,
        seats: Number(seats),
        createdAt: new Date().toISOString(),
      }
      write([...existing, record])
      return record
    },

    /** Puts a record back exactly as it was (used by undo). */
    restore(record) {
      if (!isRecord(record) || read().some((r) => r.id === record.id)) return
      write([...read(), record])
    },

    remove(id) {
      const next = read().filter((r) => r.id !== id)
      if (next.length !== read().length) write(next)
    },

    clear() {
      write([])
    },

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    /** Call when another tab changed storage, so this tab re-reads it. */
    invalidate() {
      cache = null
      listeners.forEach((listener) => listener())
    },
  }
}

function browserStorage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // Some privacy modes throw on access.
  }
}

export const registrations = createRegistrationStore(browserStorage())

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) registrations.invalidate()
  })
}
