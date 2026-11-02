import { useSyncExternalStore } from 'react'
import { registrations } from '../lib/store.js'

const EMPTY = []

/** Live list of registrations saved on this device. Re-renders on any change, in any tab. */
export function useRegistrations() {
  return useSyncExternalStore(registrations.subscribe, registrations.getAll, () => EMPTY)
}
