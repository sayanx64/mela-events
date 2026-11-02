import { LayoutGrid, List, Search, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import EventCard from '../components/EventCard.jsx'
import EventRow from '../components/EventRow.jsx'
import { CATEGORIES, CITIES, getCategory } from '../data/categories.js'
import { EVENTS } from '../data/events.js'
import { useEventFilters } from '../hooks/useEventFilters.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { formatMonthYear } from '../lib/dates.js'
import { countByCategory, filterEvents, SORT_OPTIONS, WHEN_OPTIONS } from '../lib/events.js'

/** Search box with its own state so typing stays instant; the URL catches up after a pause. */
function SearchBox({ value, onSearch }) {
  const [text, setText] = useState(value)
  const pushed = useRef(value)
  const id = useId()

  // If the URL changes from elsewhere (clear filters, back button), follow it.
  useEffect(() => {
    if (value !== pushed.current) {
      pushed.current = value
      setText(value)
    }
  }, [value])

  useEffect(() => {
    if (text === pushed.current) return
    const timer = setTimeout(() => {
      pushed.current = text
      onSearch(text)
    }, 220)
    return () => clearTimeout(timer)
  }, [text, onSearch])

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Search events
      </label>
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search by name, venue, city or what it’s about"
        className="field-input h-14 rounded-full pr-12 pl-12 [&::-webkit-search-cancel-button]:hidden"
        autoComplete="off"
        enterKeyHint="search"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('')
            pushed.current = ''
            onSearch('')
          }}
          className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-accent-soft hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function SelectFilter({ label, value, onChange, options }) {
  const id = useId()
  return (
    <div className="min-w-0 flex-1 sm:flex-none">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field-input h-14 w-full rounded-full sm:w-auto">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ResultSummary({ count, filters }) {
  const category = getCategory(filters.category)
  const bits = [
    category && category.label.toLowerCase(),
    filters.free && 'free',
  ].filter(Boolean)
  const what = `${bits.length ? `${bits.join(', ')} ` : ''}event${count === 1 ? '' : 's'}`
  const where = filters.city ? ` in ${filters.city}` : ''
  const when = filters.when !== 'any' ? `, ${WHEN_OPTIONS.find((o) => o.id === filters.when).label.toLowerCase()}` : ''
  const query = filters.q.trim() ? ` matching “${filters.q.trim()}”` : ''
  return (
    <p className="text-[0.9375rem]" aria-live="polite" aria-atomic="true">
      <span className="tabular font-semibold">{count}</span> {what}
      {where}
      {when}
      {query}
    </p>
  )
}

function groupByMonth(events) {
  const groups = []
  for (const event of events) {
    const label = formatMonthYear(event.start)
    const last = groups.at(-1)
    if (last?.label === label) last.events.push(event)
    else groups.push({ label, events: [event] })
  }
  return groups
}

export default function Events() {
  const { filters, update, reset, activeCount } = useEventFilters()
  const registrations = useRegistrations()
  const reduceMotion = useReducedMotion()
  const onSearch = useCallback((q) => update({ q }, { replace: true }), [update])

  const results = useMemo(() => filterEvents(EVENTS, filters), [filters])
  // Counts per category ignore the category filter, so each chip shows what you'd get by picking it.
  const categoryCounts = useMemo(() => countByCategory(filterEvents(EVENTS, { ...filters, category: '' })), [filters])
  const totalForChips = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const sortedForList = filters.sort === 'soonest' ? groupByMonth(results) : [{ label: null, events: results }]

  return (
    <>
      <title>{filters.city ? `Events in ${filters.city} | mela` : 'All events | mela'}</title>
      <section className="wrap pt-8 lg:pt-14">
        <h1 key={filters.city} className="display text-[clamp(3.75rem,10vw,9rem)] leading-[0.84]">
          {filters.city ? `What’s on in ${filters.city}` : 'What’s on'}
        </h1>

        <div className="mt-10 flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <SearchBox value={filters.q} onSearch={onSearch} />
          </div>
          <div className="flex flex-wrap gap-3">
            <SelectFilter
              label="City"
              value={filters.city}
              onChange={(city) => update({ city })}
              options={[{ value: '', label: 'All cities' }, ...CITIES.map((c) => ({ value: c, label: c }))]}
            />
            <SelectFilter
              label="Date"
              value={filters.when}
              onChange={(when) => update({ when })}
              options={WHEN_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            />
            <SelectFilter
              label="Sort by"
              value={filters.sort}
              onChange={(sort) => update({ sort })}
              options={SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }))}
            />
          </div>
        </div>

        <div role="group" aria-label="Category" className="scroll-row -mx-(--gutter) mt-4 flex gap-2 px-(--gutter) py-1">
          {[{ id: '', label: 'Everything', color: null }, ...CATEGORIES].map((c) => {
            const active = filters.category === c.id
            const count = c.id ? categoryCounts[c.id] : totalForChips
            return (
              <button
                key={c.id || 'all'}
                type="button"
                aria-pressed={active}
                onClick={() => update({ category: c.id })}
                className={`btn btn-sm flex-none gap-2 border-[1.5px] ${
                  active ? 'border-fg bg-fg text-bg' : 'border-line-strong hover:border-fg'
                } ${count === 0 && !active ? 'opacity-55' : ''}`}
                style={c.color ? { '--cat': c.color } : undefined}
              >
                {c.color && <span className="swatch" aria-hidden="true" />}
                {c.label}
                <span className={`tabular text-[0.8125rem] ${active ? 'text-bg/70' : 'text-muted'}`}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-line pb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ResultSummary count={results.length} filters={filters} />
            {activeCount > 0 && (
              <button type="button" onClick={reset} className="link text-[0.9375rem] font-semibold text-accent">
                Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2.5 text-[0.9375rem] font-semibold select-none">
              <input
                type="checkbox"
                checked={filters.free}
                onChange={(e) => update({ free: e.target.checked })}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-6 w-10 rounded-full bg-line-strong transition-colors peer-checked:bg-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-4"
              />
              Free only
            </label>
            <div role="group" aria-label="Layout" className="flex rounded-full border-[1.5px] border-line-strong p-0.5">
              {[
                { id: 'grid', label: 'Grid', Icon: LayoutGrid },
                { id: 'list', label: 'List', Icon: List },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={filters.view === id}
                  onClick={() => update({ view: id }, { replace: true })}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.875rem] font-semibold transition-colors ${
                    filters.view === id ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="py-20">
            <h2 className="display text-[2.5rem] leading-none">Nothing matches that.</h2>
            <p className="mt-4 max-w-[34rem] text-[1.0625rem] text-muted">
              {filters.q.trim()
                ? 'Check the spelling, try a shorter search, or look in another city.'
                : 'Try a different date range or another city.'}
            </p>
            <button type="button" onClick={reset} className="btn btn-primary mt-8">
              Clear filters and show everything
            </button>
          </div>
        ) : filters.view === 'list' ? (
          <div className="mt-2">
            {sortedForList.map((group) => (
              <section key={group.label ?? 'all'} aria-label={group.label ?? 'Results'}>
                {group.label && (
                  <h2 className="sticky top-[4.5rem] z-10 border-b border-line bg-bg pt-8 pb-3 font-sans text-[1.0625rem] font-semibold">
                    {group.label}
                  </h2>
                )}
                <ul className="divide-y divide-line">
                  {group.events.map((event) => (
                    <li key={event.slug}>
                      <EventRow event={event} registrations={registrations} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <motion.ul layout={!reduceMotion} className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {results.map((event, i) => (
                <motion.li
                  key={event.slug}
                  layout={!reduceMotion}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <EventCard event={event} registrations={registrations} morph priority={i < 3} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </section>
    </>
  )
}
