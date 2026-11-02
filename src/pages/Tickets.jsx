import { CalendarPlus, Download, FileDown, Trash2 } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { TicketLandscape } from '../components/Ticket.jsx'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { downloadCalendarFile, downloadFile } from '../lib/calendar.js'
import { relativeStart } from '../lib/dates.js'
import { downloadTicketPdf } from '../lib/pdf.js'
import { getEvent, isPast } from '../lib/events.js'
import { registrations as store, STORAGE_KEY } from '../lib/store.js'

function Toast({ toast, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, 7000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.15 } }}
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-fg py-2 pr-2 pl-5 text-bg shadow-lg"
          >
            <span className="text-[0.9375rem]">{toast.message}</span>
            <button type="button" onClick={onUndo} className="btn btn-sm min-h-9 bg-bg text-fg hover:bg-bg/85">
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Tickets() {
  const registrations = useRegistrations()
  const reduceMotion = useReducedMotion()
  const [tab, setTab] = useState('upcoming')
  const [pendingCancel, setPendingCancel] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [toast, setToast] = useState(null)
  const dismissToast = useCallback(() => setToast(null), [])

  const { upcoming, past } = useMemo(() => {
    const withEvents = registrations
      .map((registration) => ({ registration, event: getEvent(registration.event) }))
      .filter((item) => item.event)
    const byStart = (a, b) => Date.parse(a.event.start) - Date.parse(b.event.start)
    return {
      upcoming: withEvents.filter((i) => !isPast(i.event)).sort(byStart),
      past: withEvents.filter((i) => isPast(i.event)).sort((a, b) => byStart(b, a)),
    }
  }, [registrations])

  const list = tab === 'upcoming' ? upcoming : past

  const cancel = (registration) => {
    store.remove(registration.id)
    setToast({ id: Date.now(), message: 'Registration cancelled.', undo: () => store.restore(registration) })
  }

  const clearAll = () => {
    const snapshot = [...registrations]
    store.clear()
    setToast({ id: Date.now(), message: 'All tickets removed.', undo: () => snapshot.forEach((r) => store.restore(r)) })
  }

  const exportJson = () => {
    const data = registrations.map((r) => ({ ...r, eventTitle: getEvent(r.event)?.title ?? r.event }))
    downloadFile('mela-tickets.json', JSON.stringify(data, null, 2), 'application/json')
  }

  return (
    <section className="wrap pt-8 lg:pt-14">
      <title>My tickets | mela</title>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <h1 className="display text-[clamp(3.75rem,10vw,9rem)] leading-[0.84]">My tickets</h1>
          <p className="mt-5 max-w-[34rem] text-[1.125rem] leading-relaxed text-muted">
            Saved on this device. Show the QR code at the entrance.
          </p>
        </div>
        <div role="group" aria-label="Show" className="flex rounded-full border-[1.5px] border-line-strong p-0.5">
          {[
            ['upcoming', 'Upcoming', upcoming.length],
            ['past', 'Past', past.length],
          ].map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 font-semibold transition-colors ${
                tab === id ? 'bg-fg text-bg' : 'text-muted hover:text-fg'
              }`}
            >
              {label}
              <span className="text-[0.875rem] opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-12 rounded-[20px] border-2 border-dashed border-line-strong px-6 py-16 text-center sm:px-12">
          <h2 className="display text-[2.5rem] leading-none">
            {tab === 'upcoming' ? 'No tickets yet.' : 'Nothing here yet.'}
          </h2>
          <p className="mx-auto mt-4 max-w-[28rem] text-[1.0625rem] text-muted">
            {tab === 'upcoming'
              ? 'When you register for an event, your ticket shows up here with a QR code for the door.'
              : 'Tickets for events that have finished move here.'}
          </p>
          {tab === 'upcoming' && (
            <Link to="/events" className="btn btn-primary mt-8">
              Browse events
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-12 space-y-10">
          <AnimatePresence initial={false}>
            {list.map(({ registration, event }) => (
              <motion.li
                key={registration.id}
                layout={!reduceMotion}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center lg:gap-10"
              >
                <div className={`ticket-shadow ${tab === 'past' ? 'opacity-70 grayscale' : ''}`}>
                  <TicketLandscape event={event} registration={registration} />
                </div>
                <div className="flex flex-wrap gap-x-2 gap-y-2 lg:flex-col lg:items-stretch">
                  {tab === 'upcoming' && (
                    <p className="w-full text-[0.9375rem] font-semibold lg:mb-1">{relativeStart(event.start, event.end)}</p>
                  )}
                  <Link to={`/events/${event.slug}`} className="btn btn-secondary btn-sm">
                    View event
                  </Link>
                  {tab === 'upcoming' && (
                    <>
                      <button type="button" onClick={() => downloadCalendarFile(event, registration)} className="btn btn-secondary btn-sm">
                        <CalendarPlus className="size-4" aria-hidden="true" />
                        Add to calendar
                      </button>
                      <button type="button" onClick={() => downloadTicketPdf(event, registration)} className="btn btn-secondary btn-sm">
                        <FileDown className="size-4" aria-hidden="true" />
                        Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingCancel({ registration, event })}
                        className="btn btn-quiet btn-sm text-danger hover:bg-danger/10"
                      >
                        Cancel registration
                      </button>
                    </>
                  )}
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {registrations.length > 0 && (
        <section aria-labelledby="your-data" className="mt-24 grid gap-6 border-t border-line pt-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h2 id="your-data" className="font-sans text-[1.0625rem] font-semibold">
              Your data
            </h2>
            <p className="mt-1 max-w-[40rem] text-[0.9375rem] text-muted">
              {registrations.length} registration{registrations.length === 1 ? ' is' : 's are'} stored in this browser’s local
              storage under <code className="rounded bg-sunken px-1.5 py-0.5 text-[0.875rem]">{STORAGE_KEY}</code>. Nothing
              is sent to a server, and clearing your browser data removes them.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportJson} className="btn btn-secondary btn-sm">
              <Download className="size-4" aria-hidden="true" />
              Download as JSON
            </button>
            <button type="button" onClick={() => setConfirmClear(true)} className="btn btn-quiet btn-sm text-danger hover:bg-danger/10">
              <Trash2 className="size-4" aria-hidden="true" />
              Remove all
            </button>
          </div>
        </section>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this registration?"
        confirmLabel="Cancel registration"
        danger
        onConfirm={() => cancel(pendingCancel.registration)}
        onClose={() => setPendingCancel(null)}
      >
        {pendingCancel && (
          <p>
            Your {pendingCancel.registration.seats === 1 ? 'seat' : `${pendingCancel.registration.seats} seats`} for{' '}
            <strong className="font-semibold text-fg">{pendingCancel.event.title}</strong> will go back on sale and the
            ticket will stop working.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmClear}
        title="Remove every ticket?"
        confirmLabel="Remove all"
        danger
        onConfirm={clearAll}
        onClose={() => setConfirmClear(false)}
      >
        <p>This deletes all {registrations.length} registrations saved on this device.</p>
      </ConfirmDialog>

      <Toast
        toast={toast}
        onUndo={() => {
          toast?.undo()
          setToast(null)
        }}
        onDismiss={dismissToast}
      />
    </section>
  )
}
