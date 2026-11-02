import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { CATEGORIES, CITIES } from '../data/categories.js'
import { SORT_OPTIONS, WHEN_OPTIONS } from '../lib/events.js'

const DEFAULTS = { q: '', category: '', city: '', when: 'any', free: false, sort: 'soonest', view: 'grid' }

const valid = {
  category: (v) => CATEGORIES.some((c) => c.id === v),
  city: (v) => CITIES.includes(v),
  when: (v) => WHEN_OPTIONS.some((o) => o.id === v),
  sort: (v) => SORT_OPTIONS.some((o) => o.id === v),
  view: (v) => v === 'grid' || v === 'list',
}

/**
 * Filters live in the URL (?q=jazz&city=Pune&view=list) so results can be
 * bookmarked, shared and restored with the back button. Unknown values are ignored.
 */
export function useEventFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const read = (key) => {
      const value = params.get(key) ?? ''
      return valid[key] && !valid[key](value) ? DEFAULTS[key] : value || DEFAULTS[key]
    }
    return {
      q: params.get('q') ?? '',
      category: read('category'),
      city: read('city'),
      when: read('when'),
      sort: read('sort'),
      view: read('view'),
      free: params.get('free') === '1',
    }
  }, [params])

  const update = useCallback(
    (changes, { replace = false } = {}) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = value === DEFAULTS[key] || value === '' || value === false
            if (isDefault) next.delete(key)
            else next.set(key, value === true ? '1' : String(value))
          }
          return next
        },
        { replace, preventScrollReset: true },
      )
    },
    [setParams],
  )

  const reset = useCallback(() => {
    setParams((current) => {
      const next = new URLSearchParams()
      if (current.get('view')) next.set('view', current.get('view'))
      return next
    }, { preventScrollReset: true })
  }, [setParams])

  const activeCount =
    (filters.q.trim() ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.when !== 'any' ? 1 : 0) +
    (filters.free ? 1 : 0)

  return { filters, update, reset, activeCount }
}
