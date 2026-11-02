import { useSyncExternalStore } from 'react'

/**
 * One shared clock for every countdown on the page. It only ticks while
 * something is subscribed and pauses when the tab is hidden.
 */
let now = Date.now()
let timer = null
const listeners = new Set()

function tick() {
  now = Date.now()
  listeners.forEach((listener) => listener())
}

function start() {
  if (timer || typeof document === 'undefined' || document.hidden) return
  tick()
  timer = setInterval(tick, 1000)
}

function stop() {
  clearInterval(timer)
  timer = null
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else if (listeners.size) start()
  })
}

function subscribe(listener) {
  listeners.add(listener)
  start()
  return () => {
    listeners.delete(listener)
    if (!listeners.size) stop()
  }
}

const getSnapshot = () => now

/** Current time in ms, updated every second. */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
