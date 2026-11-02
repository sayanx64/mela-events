/**
 * Hand-drawn sketches of fair and festival things scattered behind every page.
 * Strokes "draw themselves" on load (stroke-dashoffset), a turbulence filter makes
 * the lines wobble like pen on paper, and each sketch drifts and turns at its own
 * speed as the page scrolls (CSS scroll-driven animations).
 */

const P = { pathLength: 1 }

const SKETCHES = {
  balloon: (
    <>
      <path {...P} d="M32 6 C 18 6, 12 18, 15 28 C 18 38, 28 44, 32 46 C 36 44, 46 38, 49 28 C 52 18, 46 6, 32 6 Z" className="tint" />
      <path {...P} d="M30 46 L34 46 L32 49 Z M32 49 C 28 53, 36 55, 31 59 C 28 61, 33 62, 32 63" />
      <path {...P} d="M22 16 C 20 20, 20 24, 22 27" />
    </>
  ),
  diya: (
    <>
      <path {...P} d="M8 38 C 14 52, 50 52, 56 38 C 44 42, 20 42, 8 38 Z" className="tint" />
      <path {...P} d="M47 37 C 52 34, 56 34, 58 36" />
      <path {...P} d="M32 36 C 26 30, 30 20, 33 14 C 35 22, 40 28, 32 36 Z" />
      <path {...P} d="M32 32 C 30 29, 31 25, 33 22" />
    </>
  ),
  kite: (
    <>
      <path {...P} d="M32 4 L52 26 L32 50 L12 26 Z" className="tint" />
      <path {...P} d="M32 4 L32 50 M12 26 L52 26" />
      <path {...P} d="M32 50 C 26 54, 38 56, 30 60 C 26 62, 34 63, 36 63" />
      <path {...P} d="M29 55 L25 53 L26 57 Z M34 59 L38 57 L37 61 Z" />
    </>
  ),
  chai: (
    <>
      <path {...P} d="M14 28 L18 56 C 19 59, 41 59, 42 56 L46 28 Z" className="tint" />
      <path {...P} d="M14 28 C 22 31, 38 31, 46 28" />
      <path {...P} d="M24 22 C 20 17, 28 14, 24 8 M32 22 C 28 17, 36 14, 32 8 M40 22 C 36 17, 44 14, 40 8" />
      <path {...P} d="M17 38 L43 38" strokeDasharray="0.04 0.04" />
    </>
  ),
  ticket: (
    <>
      <path {...P} d="M6 18 L58 18 L58 27 C 54 28, 54 36, 58 37 L58 46 L6 46 L6 37 C 10 36, 10 28, 6 27 Z" className="tint" />
      <path {...P} d="M44 20 L44 44" strokeDasharray="0.06 0.06" />
      <path {...P} d="M13 28 L35 28 M13 34 L30 34 M13 40 L24 40" />
    </>
  ),
  notes: (
    <>
      <path {...P} d="M20 46 L20 14 L50 8 L50 40" />
      <path {...P} d="M20 14 L50 8 M20 21 L50 15" />
      <path {...P} d="M20 46 C 20 52, 8 54, 9 47 C 10 41, 19 42, 20 46 Z" className="tint" />
      <path {...P} d="M50 40 C 50 46, 38 48, 39 41 C 40 35, 49 36, 50 40 Z" className="tint" />
    </>
  ),
  bunting: (
    <>
      <path {...P} d="M2 12 C 20 22, 44 22, 62 12" />
      <path {...P} d="M8 15 L12 30 L17 18 Z" className="tint" />
      <path {...P} d="M22 19 L26 34 L31 20 Z" />
      <path {...P} d="M36 20 L39 35 L45 19 Z" className="tint" />
      <path {...P} d="M50 17 L52 31 L57 14 Z" />
    </>
  ),
  star: (
    <path {...P} d="M32 6 L38 24 L57 24 L42 36 L48 55 L32 43 L16 55 L22 36 L7 24 L26 24 Z" className="tint" />
  ),
  mic: (
    <>
      <path {...P} d="M24 8 C 24 2, 40 2, 40 8 L40 26 C 40 32, 24 32, 24 26 Z" className="tint" />
      <path {...P} d="M24 14 L40 14 M24 20 L40 20" />
      <path {...P} d="M18 24 C 18 40, 46 40, 46 24 M32 38 L32 54 M22 56 C 28 54, 36 54, 42 56" />
    </>
  ),
  reel: (
    <>
      <circle {...P} cx="30" cy="32" r="22" className="tint" />
      <circle {...P} cx="30" cy="32" r="4" />
      <circle {...P} cx="30" cy="19" r="5" />
      <circle {...P} cx="42" cy="36" r="5" />
      <circle {...P} cx="19" cy="40" r="5" />
      <path {...P} d="M50 46 C 56 50, 58 56, 62 58" />
    </>
  ),
  wheel: (
    <>
      <circle {...P} cx="32" cy="27" r="19" />
      <circle {...P} cx="32" cy="27" r="13" />
      <path {...P} d="M13 27 L51 27 M32 8 L32 46 M19 14 L45 40 M45 14 L19 40" />
      <circle {...P} cx="51" cy="27" r="3.5" className="tint" />
      <circle {...P} cx="13" cy="27" r="3.5" className="tint" />
      <circle {...P} cx="32" cy="8" r="3.5" className="tint" />
      <circle {...P} cx="32" cy="46" r="3.5" className="tint" />
      <path {...P} d="M30 29 L16 62 M34 29 L48 62" />
    </>
  ),
  swirl: <path {...P} d="M32 32 C 34 30, 36 33, 34 36 C 31 40, 25 37, 26 31 C 27 24, 37 22, 41 29 C 45 37, 38 47, 28 45 C 16 43, 14 28, 22 20 C 30 12, 46 14, 52 26" />,
  sparkle: <path {...P} d="M32 6 C 33 24, 40 31, 58 32 C 40 33, 33 40, 32 58 C 31 40, 24 33, 6 32 C 24 31, 31 24, 32 6 Z" className="tint" />,
  lantern: (
    <>
      <path {...P} d="M32 2 L32 10 M22 10 L42 10 L46 18 C 52 30, 52 38, 46 48 L18 48 C 12 38, 12 30, 18 18 Z" className="tint" />
      <path {...P} d="M18 18 L46 18 M16 33 L48 33 M26 48 L24 60 M32 48 L32 62 M38 48 L40 60" />
    </>
  ),
}

// Where each sketch sits, how big, its tint, and how strongly it reacts to scroll.
const PLACED = [
  { s: 'balloon', top: 8, left: 4, size: 92, tint: '#FF6B5B', drift: -40, spin: 18 },
  { s: 'star', top: 5, left: 46, size: 46, tint: '#FFD447', drift: -70, spin: 160 },
  { s: 'kite', top: 14, left: 88, size: 96, tint: '#5CC8F2', drift: -30, spin: -24 },
  { s: 'notes', top: 34, left: 92, size: 70, tint: '#B6A4FF', drift: -55, spin: 30 },
  { s: 'diya', top: 40, left: 2, size: 84, tint: '#FFA03A', drift: -25, spin: -12 },
  { s: 'swirl', top: 58, left: 50, size: 70, tint: 'none', drift: -80, spin: 220 },
  { s: 'ticket', top: 62, left: 86, size: 100, tint: '#FF92C8', drift: -45, spin: -40 },
  { s: 'chai', top: 76, left: 8, size: 78, tint: '#E3C38F', drift: -60, spin: 20 },
  { s: 'bunting', top: 2, left: 20, size: 150, tint: '#59D88F', drift: -20, spin: 0 },
  { s: 'sparkle', top: 88, left: 40, size: 44, tint: '#FFD447', drift: -90, spin: 180 },
  { s: 'mic', top: 84, left: 72, size: 72, tint: '#5CC8F2', drift: -35, spin: -30 },
  { s: 'reel', top: 26, left: 28, size: 64, tint: '#E3C38F', drift: -65, spin: 270 },
  { s: 'wheel', top: 50, left: 70, size: 110, tint: '#FF6B5B', drift: -30, spin: 360 },
  { s: 'lantern', top: 70, left: 28, size: 70, tint: '#FF6B5B', drift: -50, spin: 14 },
  { s: 'sparkle', top: 20, left: 64, size: 34, tint: '#B6A4FF', drift: -100, spin: -200 },
  { s: 'star', top: 94, left: 92, size: 40, tint: '#59D88F', drift: -75, spin: 140 },
]

export default function Doodles() {
  return (
    <div className="doodles" aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="2.6" />
        </filter>
      </svg>
      {PLACED.map((d, i) => (
        <div
          key={i}
          className="doodle"
          style={{
            top: `${d.top}%`,
            left: `${d.left}%`,
            width: d.size,
            '--drift': `${d.drift}vh`,
            '--spin': `${d.spin}deg`,
            '--tint': d.tint === 'none' ? 'none' : d.tint,
            '--delay': `${i * 0.12}s`,
          }}
        >
          <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <g filter="url(#pencil)">{SKETCHES[d.s]}</g>
          </svg>
        </div>
      ))}
    </div>
  )
}
