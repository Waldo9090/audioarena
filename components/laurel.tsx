interface LaurelProps {
  className?: string
  size?: number
}

// A stylised laurel wreath built from leaves placed along two mirrored arcs.
export function Laurel({ className, size = 24 }: LaurelProps) {
  const leaves = []
  const count = 7
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1) // 0 -> 1 bottom to top
    // angle sweeps from ~ -10deg (bottom) up around the side
    const angle = -8 + t * 150
    const rad = (angle * Math.PI) / 180
    const radius = 34
    const cx = 50 - Math.cos(rad) * radius
    const cy = 88 - Math.sin(rad) * radius
    const rot = angle + 100
    const scale = 0.85 + (1 - t) * 0.5
    // left leaf
    leaves.push(
      <g
        key={`l-${i}`}
        transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${scale})`}
      >
        <ellipse cx="0" cy="-6" rx="3.4" ry="7" />
      </g>,
    )
    // right leaf (mirror across x=50)
    leaves.push(
      <g
        key={`r-${i}`}
        transform={`translate(${100 - cx} ${cy}) rotate(${-rot}) scale(${scale})`}
      >
        <ellipse cx="0" cy="-6" rx="3.4" ry="7" />
      </g>,
    )
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      {leaves}
    </svg>
  )
}
