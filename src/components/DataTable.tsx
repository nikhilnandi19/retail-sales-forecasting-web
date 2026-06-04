import { useState, useMemo } from 'react'

export interface ColDef<T> {
  key: keyof T
  label: string
  format?: (v: unknown, row: T) => string
  align?: 'left' | 'right'
  dim?: boolean
}

interface Props<T extends object> {
  title: string
  columns: ColDef<T>[]
  data: T[]
  defaultSortKey?: keyof T
  defaultSortDir?: 'asc' | 'desc'
  pageSize?: number
}

type SortDir = 'asc' | 'desc'

export default function DataTable<T extends object>({
  title,
  columns,
  data,
  defaultSortKey,
  defaultSortDir = 'desc',
  pageSize = 15,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultSortKey ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir)
  const [page, setPage] = useState(1)

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = (a as Record<keyof T, unknown>)[sortKey]
      const bv = (b as Record<keyof T, unknown>)[sortKey]
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const slice = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  function handleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  function pageNums(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums: (number | '…')[] = [1]
    if (safePage > 3) nums.push('…')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) {
      nums.push(i)
    }
    if (safePage < totalPages - 2) nums.push('…')
    nums.push(totalPages)
    return nums
  }

  const from = (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, sorted.length)

  return (
    <div className="table-wrap">
      <div className="table-header-bar">
        <span>{title}</span>
        <small>
          {sorted.length > 0 ? `${from}–${to} of ${sorted.length}` : '0 rows'}
        </small>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => handleSort(col.key)}
                  style={{ textAlign: col.align ?? 'left' }}
                >
                  {col.label}
                  {sortKey === col.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '32px 0' }}>
                  No data
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => {
                    const raw = (row as Record<keyof T, unknown>)[col.key]
                    const display = col.format ? col.format(raw, row) : String(raw ?? '—')
                    return (
                      <td
                        key={String(col.key)}
                        className={col.dim ? 'dim' : ''}
                        style={{ textAlign: col.align ?? 'left' }}
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

      {totalPages > 1 && (
        <div className="table-pagination">
          <small>Page {safePage} of {totalPages}</small>
          <div className="page-btns">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              ‹
            </button>
            {pageNums().map((n, i) =>
              n === '…' ? (
                <span key={`e${i}`} style={{ color: 'var(--text-3)', padding: '0 4px', fontSize: 12 }}>…</span>
              ) : (
                <button
                  key={n}
                  className={`page-btn ${safePage === n ? 'active' : ''}`}
                  onClick={() => setPage(n as number)}
                >
                  {n}
                </button>
              )
            )}
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
