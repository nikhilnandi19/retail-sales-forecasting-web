import { useState, useMemo } from 'react'

export interface ColDef<T> {
  key: keyof T
  label: string
  format?: (v: unknown, row: T) => string
  align?: 'left' | 'right'
  /** Render value in JetBrains Mono (for IDs, dates) */
  mono?: boolean
  /** Render in muted colour */
  dim?: boolean
}

interface Props<T extends object> {
  title: string
  subtitle?: string
  columns: ColDef<T>[]
  data: T[]
  defaultSortKey?: keyof T
  defaultSortDir?: 'asc' | 'desc'
  pageSize?: number
}

type SortDir = 'asc' | 'desc'

export default function DataTable<T extends object>({
  title,
  subtitle,
  columns,
  data,
  defaultSortKey,
  defaultSortDir = 'desc',
  pageSize = 10,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = (a as Record<keyof T, unknown>)[sortKey]
      const bv = (b as Record<keyof T, unknown>)[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const slice      = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handleSort(key: keyof T) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  function pageNums(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums: (number | '…')[] = [1]
    if (safePage > 3) nums.push('…')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) nums.push(i)
    if (safePage < totalPages - 2) nums.push('…')
    nums.push(totalPages)
    return nums
  }

  const from = (safePage - 1) * pageSize + 1
  const to   = Math.min(safePage * pageSize, sorted.length)

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-on-secondary-fixed/10 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
          {subtitle && (
            <p className="text-sm text-on-surface-variant/60 mt-0.5">{subtitle}</p>
          )}
        </div>
        {sorted.length > 0 && (
          <span className="text-xs text-on-surface-variant/50 font-mono">
            {from}–{to} of {sorted.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto scroll-hide">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container/30 border-b border-on-secondary-fixed/5">
              {columns.map((col) => {
                const active = sortKey === col.key
                return (
                  <th
                    key={String(col.key)}
                    onClick={() => handleSort(col.key)}
                    className={[
                      'px-6 py-4 text-[11px] font-bold tracking-[0.05em] uppercase cursor-pointer select-none',
                      'whitespace-nowrap transition-colors',
                      active ? 'text-primary' : 'text-on-surface-variant/60 hover:text-on-surface-variant',
                      col.align === 'right' ? 'text-right' : 'text-left',
                    ].join(' ')}
                  >
                    {col.label}
                    {active && (
                      <span className="ml-1 opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-on-secondary-fixed/5">
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-on-surface-variant/50"
                >
                  No data
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr key={i} className="hover:bg-white/20 transition-colors">
                  {columns.map((col) => {
                    const raw     = (row as Record<keyof T, unknown>)[col.key]
                    const display = col.format ? col.format(raw, row) : String(raw ?? '—')
                    return (
                      <td
                        key={String(col.key)}
                        className={[
                          'px-6 py-4 text-sm whitespace-nowrap',
                          col.mono  ? 'font-mono text-[12px] font-medium tracking-wide' : '',
                          col.dim   ? 'text-on-surface-variant/60' : 'text-on-surface',
                          col.align === 'right' ? 'text-right' : '',
                        ].join(' ')}
                      >
                        {display}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 bg-surface-container/30 border-t border-on-secondary-fixed/5 flex justify-center">
          <nav className="flex gap-2 items-center">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            {pageNums().map((n, idx) =>
              n === '…' ? (
                <span key={`e${idx}`} className="w-8 h-8 flex items-center justify-center text-on-surface-variant/40 text-sm">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className={[
                    'w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all',
                    safePage === n
                      ? 'bg-white border border-outline-variant text-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container',
                  ].join(' ')}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
