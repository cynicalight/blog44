import clsx from 'clsx'
import type { ReactNode } from 'react'

// Shared building blocks of the lunar pixel language. Server-safe (no hooks).

export function MoonPhaseIcon({ phase, className }: { phase: number; className?: string }) {
  const cells: ReactNode[] = []
  const size = 11
  const terminatorScale = Math.cos(phase * Math.PI * 2)
  for (let row = 0; row < size; row++) {
    const v = (row + 0.5 - size / 2) / (size / 2)
    for (let column = 0; column < size; column++) {
      const u = (column + 0.5 - size / 2) / (size / 2)
      if (u * u + v * v > 1) continue
      const terminator = terminatorScale * Math.sqrt(1 - v * v)
      const lit = phase < 0.5 ? u > terminator : u < -terminator
      cells.push(
        <rect
          key={`${row}:${column}`}
          x={column}
          y={row}
          width={1}
          height={1}
          opacity={lit ? 1 : 0.2}
        />
      )
    }
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={clsx('h-[11px] w-[11px] shrink-0', className)}
    >
      {cells}
    </svg>
  )
}

/** One-pixel dotted rule, the horizon line of the design. */
export function PixelRule({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={clsx(
        'h-px bg-[repeating-linear-gradient(90deg,currentColor_0_1px,transparent_1px_4px)] text-gray-400 opacity-50 dark:text-gray-500',
        className
      )}
    />
  )
}

/** Small uppercase pixel-font label with a moon-phase glyph. */
export function PixelEyebrow({
  children,
  phase = 0.5,
  className,
}: {
  children: ReactNode
  phase?: number
  className?: string
}) {
  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 whitespace-nowrap font-pixel text-[11px] uppercase tracking-[0.25em] text-gray-500',
        className
      )}
    >
      <MoonPhaseIcon phase={phase} />
      {children}
    </div>
  )
}

/**
 * Translucent sheet that keeps long-form text readable over the starfield while
 * letting the backdrop show at the edges.
 */
export function ReadingSurface({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'relative border border-dashed border-gray-300/80 bg-[#f5f4ef]/85 backdrop-blur-[2px]',
        'dark:border-white/10 dark:bg-[#08080b]/80',
        '-mx-4 px-4 py-8 sm:mx-0 sm:px-8 md:px-10',
        className
      )}
    >
      {children}
    </div>
  )
}
