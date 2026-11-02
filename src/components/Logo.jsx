import { useId } from 'react'

// Cabins around the wheel, in the category colours.
const CABINS = ['#FF6B5B', '#FFD447', '#5CC8F2', '#59D88F', '#FF92C8', '#FFA03A', '#B6A4FF', '#E3C38F']

/**
 * Hand-drawn Ferris wheel, the ride every mela has. The wobble comes from an SVG
 * turbulence filter, so the lines look inked rather than drawn with a ruler.
 */
export function FerrisWheel({ className = '', spin = true }) {
  const id = useId().replace(/:/g, '')
  const cx = 32
  const cy = 27
  const r = 18
  const points = CABINS.map((_, i) => {
    const a = (i * Math.PI) / 4
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  })
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <defs>
        <filter id={`rough-${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="2.4" />
        </filter>
      </defs>
      <g filter={`url(#rough-${id})`} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {/* stand and ground */}
        <path d="M31 28 L17 58 M33 28 L47 58 M11 58.5 C 24 57.5, 40 59.5, 53 58" />
        <g className={spin ? 'wheel-spin' : ''} style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <circle cx={cx} cy={cy} r={r} />
          <circle cx={cx + 0.6} cy={cy - 0.4} r={r - 4.5} strokeWidth="1.4" />
          {points.map(([x, y], i) => (
            <path key={i} d={`M${cx} ${cy} L${x.toFixed(1)} ${y.toFixed(1)}`} strokeWidth="1.6" />
          ))}
          {points.map(([x, y], i) => (
            <circle key={`c${i}`} cx={x} cy={y} r="4" fill={CABINS[i]} strokeWidth="2" />
          ))}
          <circle cx={cx} cy={cy} r="2.6" fill="currentColor" />
        </g>
      </g>
    </svg>
  )
}

export default function Logo({ className = '' }) {
  return (
    <span className={`group inline-flex items-center gap-1.5 sm:gap-2 ${className}`}>
      <FerrisWheel className="size-8 transition-transform duration-500 group-hover:rotate-12 sm:size-10" />
      <span className="wordmark text-[1.5rem] sm:text-[1.9rem]">mela</span>
    </span>
  )
}
