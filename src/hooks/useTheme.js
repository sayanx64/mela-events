import { useCallback, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

const STORAGE_KEY = 'mela:theme'
const listeners = new Set()

const read = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function apply(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* private mode: the choice just won't persist */
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  // Follow the system setting until the visitor picks a theme themselves.
  const media = matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (event) => {
    let saved = null
    try {
      saved = localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (!saved) {
      document.documentElement.dataset.theme = event.matches ? 'dark' : 'light'
      listener()
    }
  }
  media.addEventListener('change', onSystemChange)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}

/**
 * Light/dark theme. Switching uses a View Transition so the new theme spreads
 * out in a circle from the button that was pressed.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => 'light')

  const toggle = useCallback((origin) => {
    const next = read() === 'dark' ? 'light' : 'dark'
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      apply(next)
      return
    }
    const root = document.documentElement
    if (origin) {
      const { left, top, width, height } = origin.getBoundingClientRect()
      const x = left + width / 2
      const y = top + height / 2
      root.style.setProperty('--reveal-x', `${x}px`)
      root.style.setProperty('--reveal-y', `${y}px`)
      root.style.setProperty('--reveal-r', `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
    }
    root.dataset.themeSwitching = ''
    const transition = document.startViewTransition(() => flushSync(() => apply(next)))
    transition.finished.finally(() => delete root.dataset.themeSwitching)
  }, [])

  return { theme, toggle }
}
