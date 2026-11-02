import { useMemo } from 'react'
import { encode } from 'uqr'

/** Renders a real, scannable QR code as a single SVG path (runs of dark modules merged per row). */
export default function QrCode({ value, size = 88, className = '' }) {
  const { path, modules } = useMemo(() => {
    const { data, size: n } = encode(value, { ecc: 'M', border: 0 })
    let d = ''
    data.forEach((row, y) => {
      let x = 0
      while (x < n) {
        if (!row[x]) {
          x++
          continue
        }
        let run = 1
        while (x + run < n && row[x + run]) run++
        d += `M${x} ${y}h${run}v1h-${run}z`
        x += run
      }
    })
    return { path: d, modules: n }
  }, [value])

  return (
    <svg
      viewBox={`-1 -1 ${modules + 2} ${modules + 2}`}
      width={size}
      height={size}
      role="img"
      aria-label={`QR code for ticket ${value}`}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect x="-1" y="-1" width={modules + 2} height={modules + 2} fill="#fff" rx="1" />
      <path d={path} fill="#17143a" />
    </svg>
  )
}
