import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRegistrationStore, createTicketId, STORAGE_KEY, StorageUnavailableError } from './store.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    dump: () => data,
  }
}

const sample = { event: 'build-weekend', name: '  Priya   Sharma ', email: 'Priya@Example.com', phone: '+91 98765 43210', seats: 2 }

describe('createTicketId', () => {
  it('produces readable ids without ambiguous letters', () => {
    const id = createTicketId()
    expect(id).toMatch(/^ML-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/)
  })
})

describe('registration store', () => {
  let storage
  let store

  beforeEach(() => {
    storage = memoryStorage()
    store = createRegistrationStore(storage)
  })

  it('starts empty and persists new registrations as JSON', () => {
    expect(store.getAll()).toEqual([])
    const record = store.add(sample)
    expect(record.name).toBe('Priya Sharma')
    expect(record.email).toBe('priya@example.com')
    expect(JSON.parse(storage.getItem(STORAGE_KEY))).toHaveLength(1)
  })

  it('finds duplicates regardless of email case', () => {
    store.add(sample)
    expect(store.findByEventAndEmail('build-weekend', 'PRIYA@example.com ')).not.toBeNull()
    expect(store.findByEventAndEmail('ray-weekend', 'priya@example.com')).toBeNull()
  })

  it('keeps the same array reference until something changes', () => {
    const first = store.getAll()
    expect(store.getAll()).toBe(first)
    store.add(sample)
    expect(store.getAll()).not.toBe(first)
  })

  it('notifies subscribers on add, remove and clear', () => {
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)
    const record = store.add(sample)
    store.remove(record.id)
    store.add(sample)
    store.clear()
    expect(listener).toHaveBeenCalledTimes(4)
    unsubscribe()
    store.add(sample)
    expect(listener).toHaveBeenCalledTimes(4)
  })

  it('can restore a removed record for undo', () => {
    const record = store.add(sample)
    store.remove(record.id)
    store.restore(record)
    expect(store.get(record.id)).toEqual(record)
  })

  it('ignores corrupted or malformed data instead of crashing', () => {
    const broken = createRegistrationStore(memoryStorage({ [STORAGE_KEY]: '{not json' }))
    expect(broken.getAll()).toEqual([])
    const mixed = createRegistrationStore(
      memoryStorage({ [STORAGE_KEY]: JSON.stringify([{ id: 1 }, { ...sample, id: 'ML-AAAA-BBBB', seats: 1, createdAt: 'x' }]) }),
    )
    expect(mixed.getAll()).toHaveLength(1)
  })

  it('reports when storage refuses to save', () => {
    const full = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
    expect(() => createRegistrationStore(full).add(sample)).toThrow(StorageUnavailableError)
  })

  it('re-reads storage after invalidate (another tab changed it)', () => {
    store.add(sample)
    storage.setItem(STORAGE_KEY, '[]')
    expect(store.getAll()).toHaveLength(1)
    store.invalidate()
    expect(store.getAll()).toHaveLength(0)
  })
})
