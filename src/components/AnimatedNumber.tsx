import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function applyFormat(
  val: number,
  decimals: number,
  compact: boolean,
  prefix: string,
  suffix: string,
): string {
  if (!isFinite(val) || isNaN(val)) return '—'
  let s: string
  if (compact) {
    const abs = Math.abs(val)
    if (abs >= 1_000_000)      s = (val / 1_000_000).toFixed(1) + 'M'
    else if (abs >= 10_000)    s = (val / 1_000).toFixed(1) + 'K'
    else if (abs >= 1_000)     s = (val / 1_000).toFixed(2) + 'K'
    else                       s = val.toFixed(decimals)
  } else {
    s = val.toFixed(decimals)
  }
  return prefix + s + suffix
}

// Evaluated once at module load — stable for the component's lifetime
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  compact?: boolean
  /** Animation duration in ms. Default 900. */
  duration?: number
  className?: string
}

export default function AnimatedNumber({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  compact = false,
  duration = 900,
  className,
}: Props) {
  const [display, setDisplay] = useState(() =>
    applyFormat(value, decimals, compact, prefix, suffix)
  )
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!isFinite(value) || isNaN(value)) {
      setDisplay('—')
      return
    }

    // Skip animation if user prefers reduced motion
    if (reducedMotion) {
      setDisplay(applyFormat(value, decimals, compact, prefix, suffix))
      return
    }

    cancelAnimationFrame(rafRef.current)
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(t)
      setDisplay(applyFormat(eased * value, decimals, compact, prefix, suffix))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, decimals, compact, prefix, suffix, duration])

  return <span className={className}>{display}</span>
}
