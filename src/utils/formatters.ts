export function fmtSales(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 10_000) return `${(v / 1_000).toFixed(1)}K`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(2)}K`
  return v.toFixed(2)
}

export function fmtNum(v: number, decimals = 2): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return v.toFixed(decimals)
}

export function fmtDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}

export function fmtDateShort(s: string): string {
  if (!s) return ''
  return s.split(' ')[0]
}

export function fmtDateAxis(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr))
}
