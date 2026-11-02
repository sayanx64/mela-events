import { useNow } from '../hooks/useNow.js'
import { countdownLabel, splitDuration } from '../lib/dates.js'

const pad = (n) => String(n).padStart(2, '0')

/** Big ticking countdown: days, hours, minutes, seconds. */
export default function Countdown({ to, className = '' }) {
  const now = useNow()
  const ms = Date.parse(to) - now
  const { days, hours, minutes, seconds } = splitDuration(ms)
  const units = [
    [days, days === 1 ? 'day' : 'days'],
    [hours, 'hrs'],
    [minutes, 'mins'],
    [seconds, 'secs'],
  ]
  return (
    <div className={className}>
      <p className="sr-only">Starts in {countdownLabel(ms)}</p>
      <div aria-hidden="true" className="grid grid-cols-4 gap-1.5">
        {units.map(([value, label]) => (
          <div key={label} className="rounded-[8px] bg-ink/8 px-2 pt-1.5 pb-1 text-center">
            <span className="display tabular block text-[2.25rem] leading-none" style={{ fontStretch: '62%' }}>
              {label === 'days' || label === 'day' ? value : pad(value)}
            </span>
            <span className="text-[0.75rem] font-semibold">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
