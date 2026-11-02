import { AlertCircle, ArrowLeft, CalendarPlus, FileDown, LoaderCircle, Ticket as TicketIcon } from 'lucide-react'
import { motion, useAnimate, useReducedMotion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { TicketPortrait } from '../components/Ticket.jsx'
import { EVENTS } from '../data/events.js'
import { useRegistrations } from '../hooks/useRegistrations.js'
import { downloadCalendarFile } from '../lib/calendar.js'
import { downloadTicketPdf } from '../lib/pdf.js'
import { formatMonthYear, formatShortDate } from '../lib/dates.js'
import { formatPrice, getEvent, isPast, seatsLeft } from '../lib/events.js'
import { registrations as store, StorageUnavailableError } from '../lib/store.js'
import {
  formatPhone,
  MAX_SEATS_PER_REGISTRATION,
  suggestEmail,
  validateEmail,
  validateEventChoice,
  validateName,
  validatePhone,
  validateRegistration,
  validateSeats,
} from '../lib/validation.js'

const FIELD_ORDER = ['event', 'name', 'email', 'phone', 'seats']
const FIELD_LABELS = { event: 'Event', name: 'Full name', email: 'Email address', phone: 'Mobile number', seats: 'Seats' }

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-[0.9375rem] font-medium text-danger">
      <AlertCircle className="mt-0.5 size-4 flex-none" aria-hidden="true" />
      {message}
    </p>
  )
}

function Field({ name, label, hint, error, children }) {
  const hintId = `${name}-hint`
  const errorId = `${name}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={name} className="block text-[1rem] font-semibold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-0.5 text-[0.9375rem] text-muted">
          {hint}
        </p>
      )}
      <div className="mt-2">{children({ id: name, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}</div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}

/** Upcoming events grouped by month for the <select>. */
function useEventOptions(registrations) {
  return useMemo(() => {
    const groups = []
    const upcoming = EVENTS.filter((e) => !isPast(e)).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    for (const event of upcoming) {
      const label = formatMonthYear(event.start)
      if (groups.at(-1)?.label !== label) groups.push({ label, events: [] })
      groups.at(-1).events.push({ event, full: seatsLeft(event, registrations) === 0 })
    }
    return groups
  }, [registrations])
}

function Stamp() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="pointer-events-none absolute top-[40%] right-10 z-10"
      initial={reduceMotion ? false : { scale: 2.4, opacity: 0, rotate: -22 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.8, delay: 0.15 }}
      aria-hidden="true"
    >
      <span className="stamp">Confirmed</span>
    </motion.div>
  )
}

function Confirmation({ registration, event, onAnother }) {
  const headingRef = useRef(null)
  useEffect(() => headingRef.current?.focus(), [])
  const firstName = registration.name.split(' ')[0]
  return (
    <div role="status" aria-live="polite">
      <h2 ref={headingRef} tabIndex={-1} className="display text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.9] outline-none">
        You’re in, {firstName}.
      </h2>
      <p className="mt-5 max-w-[34rem] text-[1.125rem] leading-relaxed">
        Your ticket for <strong className="font-semibold">{event.title}</strong> on {formatShortDate(event.start)} is saved on
        this device. Show the QR code at the entrance.
      </p>
      <dl className="mt-8 grid max-w-[34rem] grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-5 text-[0.9375rem]">
        <div>
          <dt className="text-muted">Ticket number</dt>
          <dd className="ticket__serial mt-0.5 font-semibold">{registration.id}</dd>
        </div>
        <div>
          <dt className="text-muted">Seats</dt>
          <dd className="mt-0.5 font-semibold">{registration.seats}</dd>
        </div>
        <div>
          <dt className="text-muted">Name</dt>
          <dd className="mt-0.5 font-semibold">{registration.name}</dd>
        </div>
        <div>
          <dt className="text-muted">Total</dt>
          <dd className="mt-0.5 font-semibold">{event.price ? formatPrice(event.price * registration.seats) : 'Free'}</dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/tickets" className="btn btn-primary">
          <TicketIcon className="size-5" aria-hidden="true" />
          View my tickets
        </Link>
        <button type="button" onClick={() => downloadCalendarFile(event, registration)} className="btn btn-secondary">
          <CalendarPlus className="size-5" aria-hidden="true" />
          Add to calendar
        </button>
        <button type="button" onClick={() => downloadTicketPdf(event, registration)} className="btn btn-secondary">
          <FileDown className="size-5" aria-hidden="true" />
          Download PDF
        </button>
      </div>
      <p className="mt-6 text-[0.9375rem] text-muted">
        <button type="button" onClick={onAnother} className="link font-semibold text-fg">
          Register someone else
        </button>{' '}
        or{' '}
        <Link to="/events" className="link font-semibold text-fg">
          find another event
        </Link>
        .
      </p>
    </div>
  )
}

const EMPTY_FORM = { name: '', email: '', phone: '', seats: '1' }

export default function Register() {
  const [params] = useSearchParams()
  const registrations = useRegistrations()
  const eventOptions = useEventOptions(registrations)
  const summaryRef = useRef(null)
  const formId = useId()
  const [ticketRef, animateTicket] = useAnimate()
  const reduceMotion = useReducedMotion()

  const initialEvent = (() => {
    const slug = params.get('event') ?? ''
    const event = getEvent(slug)
    return event && !isPast(event) ? slug : ''
  })()

  const [values, setValues] = useState({ ...EMPTY_FORM, event: initialEvent })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | saving | done
  const [saved, setSaved] = useState(null)
  const [storageError, setStorageError] = useState('')

  const event = getEvent(values.event)
  const left = event ? seatsLeft(event, registrations) : 0
  const context = {
    event,
    seatsLeft: left,
    isPast: event ? isPast(event) : false,
    alreadyRegistered: Boolean(event && values.email && store.findByEventAndEmail(event.slug, values.email)),
  }

  // Validate a single field the same way the full check does.
  const fieldError = (field) => {
    switch (field) {
      case 'name':
        return validateName(values.name)
      case 'email':
        return validateEmail(values.email) || (validateRegistration(values, context).email ?? '')
      case 'phone':
        return validatePhone(values.phone)
      case 'event':
        return validateEventChoice(values.event, context)
      case 'seats':
        return validateSeats(values.seats, context)
      default:
        return ''
    }
  }

  const visibleError = (field) => (submitted || touched[field] ? fieldError(field) : '')
  const allErrors = validateRegistration(values, context)
  const errorList = FIELD_ORDER.filter((f) => allErrors[f]).map((f) => ({ field: f, message: allErrors[f] }))
  const emailSuggestion = !validateEmail(values.email) || touched.email ? suggestEmail(values.email) : null

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  const blur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }))
    if (field === 'phone' && !validatePhone(values.phone)) {
      setValues((v) => ({ ...v, phone: formatPhone(v.phone).replace(/^\+91 /, '') }))
    }
  }


  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setStorageError('')
    if (errorList.length) {
      // Move focus to the summary so keyboard and screen reader users hear what to fix.
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setStatus('saving')
    // A short pause so the save reads as an action, not a flicker.
    await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 450))
    try {
      const record = store.add({
        event: values.event,
        name: values.name,
        email: values.email,
        phone: formatPhone(values.phone),
        seats: Number(values.seats),
      })
      setSaved(record)
      setStatus('done')
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
      if (!reduceMotion && ticketRef.current) {
        // The stamp lands, the ticket takes the hit.
        setTimeout(() => {
          animateTicket(ticketRef.current, { x: [0, -5, 4, -2, 0], rotate: [0, -0.6, 0.4, 0] }, { duration: 0.35 })
        }, 330)
      }
    } catch (error) {
      setStatus('idle')
      setStorageError(
        error instanceof StorageUnavailableError
          ? 'Your browser blocked saving the ticket on this device. Turn off private browsing or allow site data, then try again.'
          : 'Something went wrong while saving. Try again.',
      )
      requestAnimationFrame(() => summaryRef.current?.focus())
    }
  }

  const registerAnother = () => {
    setValues((v) => ({ ...EMPTY_FORM, event: v.event }))
    setTouched({})
    setSubmitted(false)
    setSaved(null)
    setStatus('idle')
  }

  const done = status === 'done' && saved
  const seatOptions = Array.from({ length: MAX_SEATS_PER_REGISTRATION }, (_, i) => i + 1)
  const total = event ? event.price * Number(values.seats || 1) : 0
  const showSummary = submitted && (errorList.length > 0 || storageError)

  return (
    <section className="wrap pt-6 lg:pt-10">
      <title>{done ? 'You’re registered | mela' : 'Register | mela'}</title>
      <Link to={event ? `/events/${event.slug}` : '/events'} className="btn btn-quiet btn-sm -ml-3">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {event ? `Back to ${event.title}` : 'All events'}
      </Link>

      <div className="mt-6 grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className={`lg:col-span-7 xl:col-span-6 ${done ? 'order-2 lg:order-none' : ''}`}>
          {done ? (
            <Confirmation registration={saved} event={getEvent(saved.event)} onAnother={registerAnother} />
          ) : (
            <>
              <h1 className="display text-[clamp(3.25rem,8vw,6.5rem)] leading-[0.86]">Save your seat</h1>
              <p className="mt-5 max-w-[32rem] text-[1.125rem] leading-relaxed text-muted">
                Takes about a minute. Your ticket is saved on this device and shows up in My tickets.
              </p>

              {showSummary && (
                <div
                  ref={summaryRef}
                  tabIndex={-1}
                  role="alert"
                  className="mt-8 rounded-[14px] border-2 border-danger p-5 outline-none focus-visible:ring-4 focus-visible:ring-danger/25"
                >
                  {storageError ? (
                    <p className="font-semibold text-danger">{storageError}</p>
                  ) : (
                    <>
                      <p className="font-semibold text-danger">
                        Fix {errorList.length === 1 ? 'this' : `these ${errorList.length} things`} to register:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {errorList.map(({ field, message }) => (
                          <li key={field}>
                            <a href={`#${field === 'seats' ? 'seats-1' : field}`} className="link text-[0.9375rem]">
                              {FIELD_LABELS[field]}: {message}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              <form id={formId} noValidate onSubmit={onSubmit} className="mt-10 space-y-7" aria-label="Event registration">
                <Field name="event" label="Event" error={visibleError('event')}>
                  {(a11y) => (
                    <select {...a11y} name="event" value={values.event} onChange={(e) => {
                        const next = getEvent(e.target.value)
                        const max = next ? Math.max(1, Math.min(seatsLeft(next, registrations), MAX_SEATS_PER_REGISTRATION)) : MAX_SEATS_PER_REGISTRATION
                        setValues((v) => ({ ...v, event: e.target.value, seats: String(Math.min(Number(v.seats), max)) }))
                      }} onBlur={blur('event')} className="field-input">
                      <option value="">Choose an event</option>
                      {eventOptions.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.events.map(({ event: e, full }) => (
                            <option key={e.slug} value={e.slug} disabled={full}>
                              {formatShortDate(e.start)}: {e.title}, {e.city}
                              {full ? ' (sold out)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </Field>

                <Field name="name" label="Full name" hint="As it should appear on your ticket." error={visibleError('name')}>
                  {(a11y) => (
                    <input
                      {...a11y}
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={values.name}
                      onChange={set('name')}
                      onBlur={blur('name')}
                      className="field-input"
                    />
                  )}
                </Field>

                <div>
                  <Field name="email" label="Email address" hint="We use this to spot duplicate registrations." error={visibleError('email')}>
                    {(a11y) => (
                      <input
                        {...a11y}
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={values.email}
                        onChange={set('email')}
                        onBlur={blur('email')}
                        className="field-input"
                      />
                    )}
                  </Field>
                  {emailSuggestion && (
                    <p className="mt-2 text-[0.9375rem]">
                      Did you mean{' '}
                      <button
                        type="button"
                        className="link font-semibold text-accent"
                        onClick={() => setValues((v) => ({ ...v, email: emailSuggestion }))}
                      >
                        {emailSuggestion}
                      </button>
                      ?
                    </p>
                  )}
                </div>

                <Field name="phone" label="Mobile number" hint="10 digits. We add +91 for you." error={visibleError('phone')}>
                  {(a11y) => (
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-muted" aria-hidden="true">
                        +91
                      </span>
                      <input
                        {...a11y}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="98765 43210"
                        value={values.phone}
                        onChange={set('phone')}
                        onBlur={blur('phone')}
                        className="field-input pl-14"
                      />
                    </div>
                  )}
                </Field>

                <fieldset aria-describedby={visibleError('seats') ? 'seats-error' : undefined}>
                  <legend className="text-[1rem] font-semibold">Seats</legend>
                  <p className="mt-0.5 text-[0.9375rem] text-muted">
                    Up to {MAX_SEATS_PER_REGISTRATION} per registration
                    {event && left > 0 && left < MAX_SEATS_PER_REGISTRATION ? `. Only ${left} left for this event.` : '.'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {seatOptions.map((n) => {
                      const disabled = Boolean(event) && n > left
                      return (
                        <label
                          key={n}
                          className={`relative grid size-14 place-items-center rounded-[12px] border-[1.5px] text-[1.125rem] font-semibold transition-colors has-checked:border-fg has-checked:bg-fg has-checked:text-bg has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
                            disabled ? 'cursor-not-allowed border-line text-muted opacity-50' : 'cursor-pointer border-line-strong hover:border-fg'
                          }`}
                        >
                          <input
                            type="radio"
                            name="seats"
                            id={`seats-${n}`}
                            value={n}
                            checked={Number(values.seats) === n}
                            disabled={disabled}
                            onChange={set('seats')}
                            className="sr-only"
                          />
                          {n}
                        </label>
                      )
                    })}
                  </div>
                  <FieldError id="seats-error" message={visibleError('seats')} />
                </fieldset>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-line pt-7">
                  <button
                    type="submit"
                    className="btn btn-primary h-14 px-8 text-[1.0625rem]"
                    disabled={status === 'saving'}
                    // Keep focus in the field on mousedown: blurring it would show its error,
                    // shift the layout, and make the click miss the button.
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {status === 'saving' ? (
                      <>
                        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                        Saving your seat
                      </>
                    ) : (
                      'Register'
                    )}
                  </button>
                  {event && (
                    <p className="text-[1rem]">
                      {event.price ? (
                        <>
                          Total <span className="font-semibold">{formatPrice(total)}</span>
                          <span className="text-muted">, paid at the venue</span>
                        </>
                      ) : (
                        <span className="font-semibold">Free entry</span>
                      )}
                    </p>
                  )}
                </div>
              </form>
            </>
          )}
        </div>

        <div className={`lg:col-span-5 xl:col-span-5 xl:col-start-8 ${done ? 'order-1 lg:order-none' : ''}`}>
          <div className="lg:sticky lg:top-24">
            {event || done ? (
              <div className="mx-auto w-full max-w-[23rem] lg:ml-auto lg:mr-0">
                <div ref={ticketRef} className="ticket-shadow">
                  <TicketPortrait
                    event={done ? getEvent(saved.event) : event}
                    registration={done ? saved : undefined}
                    name={values.name.trim().replace(/\s+/g, ' ')}
                    seats={values.seats}
                    stamp={done ? <Stamp /> : null}
                    headingLevel={2}
                  />
                </div>
                {!done && (
                  <p className="mt-6 text-center text-[0.9375rem] text-muted">Your ticket fills in as you type.</p>
                )}
              </div>
            ) : (
              <div className="mx-auto hidden aspect-[3/4.4] w-full max-w-[23rem] place-items-center lg:grid rounded-[18px] border-2 border-dashed border-line-strong p-8 text-center text-muted lg:mr-0 lg:ml-auto">
                <p>Choose an event and your ticket will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
