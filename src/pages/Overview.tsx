import { useEffect, useMemo, useState } from 'react'
import KPICard from '../components/KPICard'
import { loadSalesOverview } from '../utils/csvLoader'
import type { SalesOverview } from '../types'
import { fmtSales, fmtNum, fmtDateShort, unique } from '../utils/formatters'

// ── Helpers ───────────────────────────────────────────────
function yearOf(dateStr: string): string {
  if (!dateStr) return '—'
  return dateStr.substring(0, 4)
}

function paginate(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

const PAGE_SIZE = 8

export default function Overview() {
  const [data,      setData]      = useState<SalesOverview[]>([])
  const [loading,   setLoading]   = useState(true)
  const [storeFilter,   setStoreFilter]   = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadSalesOverview().then((rows) => {
      setData(rows)
      setLoading(false)
    })
  }, [])

  // ── Filter options (dynamic from CSV) ──────────────────
  const stores   = useMemo(() => ['All', ...unique(data.map((d) => d.Store_id)).sort()],   [data])
  const products = useMemo(() => ['All', ...unique(data.map((d) => d.Product_id)).sort()], [data])

  // ── Filtered dataset ───────────────────────────────────
  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          (storeFilter   === 'All' || d.Store_id   === storeFilter) &&
          (productFilter === 'All' || d.Product_id === productFilter)
      ),
    [data, storeFilter, productFilter]
  )

  // ── KPIs ───────────────────────────────────────────────
  const totalSales = filtered.reduce((s, d) => s + (d.total_sales || 0), 0)
  const avgDaily   =
    filtered.length > 0
      ? filtered.reduce((s, d) => s + (d.avg_daily_sales || 0), 0) / filtered.length
      : 0
  const pairCount  = filtered.length
  const minDate    =
    filtered.length > 0
      ? filtered.reduce(
          (mn, d) => (fmtDateShort(d.start_date) < mn ? fmtDateShort(d.start_date) : mn),
          fmtDateShort(filtered[0].start_date)
        )
      : ''
  const maxDate    =
    filtered.length > 0
      ? filtered.reduce(
          (mx, d) => (fmtDateShort(d.end_date) > mx ? fmtDateShort(d.end_date) : mx),
          fmtDateShort(filtered[0].end_date)
        )
      : ''
  const dateRange  =
    minDate && maxDate
      ? yearOf(minDate) === yearOf(maxDate)
        ? yearOf(minDate)
        : `${yearOf(minDate)}–${yearOf(maxDate)}`
      : '—'

  // ── Top 10 bar chart ───────────────────────────────────
  const top10 = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10)
        .map((d) => ({ label: `${d.Store_id}-${d.Product_id}`, value: d.total_sales })),
    [filtered]
  )
  const maxSales = top10.length > 0 ? top10[0].value : 1

  // ── Table pagination ───────────────────────────────────
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.total_sales - a.total_sales),
    [filtered]
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageRows   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const handleStore   = (v: string) => { setStoreFilter(v);   setPage(1) }
  const handleProduct = (v: string) => { setProductFilter(v); setPage(1) }

  // ── Loading screen ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant/70">Loading dashboard data…</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Page header ──────────────────────────────────── */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-primary mb-2 block">
            QUARTERLY REPORT
          </span>
          <h1 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-background">
            Enterprise Dashboard
          </h1>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-end flex-wrap">
          {/* Store */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60">
              STORE SELECTION
            </span>
            <div className="relative">
              <select
                value={storeFilter}
                onChange={(e) => handleStore(e.target.value)}
                className="glass-card appearance-none pr-10 pl-4 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer min-w-[140px]"
              >
                {stores.map((s) => (
                  <option key={s} value={s} className="bg-surface-container-low">
                    {s === 'All' ? 'All Stores' : s}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                style={{ fontSize: 20 }}
              >
                expand_more
              </span>
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60">
              PRODUCT LINE
            </span>
            <div className="relative">
              <select
                value={productFilter}
                onChange={(e) => handleProduct(e.target.value)}
                className="glass-card appearance-none pr-10 pl-4 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer min-w-[140px]"
              >
                {products.map((p) => (
                  <option key={p} value={p} className="bg-surface-container-low">
                    {p === 'All' ? 'All Products' : p}
                  </option>
                ))}
              </select>
              <span
                className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
                style={{ fontSize: 20 }}
              >
                expand_more
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── KPI row ──────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard
          icon="payments"
          iconBg="bg-primary-container/10"
          iconColor="text-primary"
          badge="+12.4%"
          label="Total Sales"
          value={fmtSales(totalSales)}
          unit="USD"
          description="Aggregate performance across all global outlets."
        />
        <KPICard
          icon="analytics"
          iconBg="bg-secondary/10"
          iconColor="text-secondary"
          label="Avg Daily Sales"
          value={fmtNum(avgDaily)}
          unit="Units"
          description="Mean unit distribution per operating cycle."
        />
        <KPICard
          icon="inventory_2"
          iconBg="bg-tertiary/10"
          iconColor="text-tertiary"
          label="Store-Product Pairs"
          value={pairCount.toString()}
          unit="Active SKU/Loc"
          description="Mapped distribution (10 stores × 50 products)."
        />
        <KPICard
          icon="calendar_today"
          iconBg="bg-on-surface/5"
          iconColor="text-on-surface"
          label="Dataset Range"
          value={dateRange}
          description="Reporting window from Jan 2013 to Dec 2017."
        />
      </section>

      {/* ── Main content grid ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left col: Bar chart + CTA (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* Top store-product pairs */}
          <div className="glass-card p-8 rounded-xl">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-[18px] font-semibold leading-6 text-on-surface">
                Top Store-Product Pairs
              </h2>
              <button className="text-primary hover:underline text-[11px] font-bold tracking-[0.05em] uppercase">
                VIEW RANKINGS
              </button>
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-on-surface-variant/60 py-8 text-center">
                No data for the selected filters.
              </p>
            ) : (
              <div className="space-y-8">
                {top10.map((item) => (
                  <div key={item.label} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-[12px] font-medium tracking-wide text-secondary uppercase">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        {fmtSales(item.value)}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary-container h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.max(4, (item.value / maxSales) * 95)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forecast Ready CTA card */}
          <div
            className="bg-primary-container p-8 rounded-xl text-on-primary flex flex-col justify-between min-h-[200px]"
            style={{ boxShadow: '0 4px 20px rgba(231,109,87,0.3)' }}
          >
            <div>
              <h4 className="text-[18px] font-semibold leading-6 mb-2">Forecast Ready</h4>
              <p className="text-sm opacity-90 leading-relaxed">
                Our latest ML models have processed 5 years of historical data.
                Seasonal trends are now available for Store 002.
              </p>
            </div>
            <button className="bg-white text-primary-container px-6 py-3 rounded-lg font-bold text-[11px] tracking-[0.05em] uppercase hover:bg-surface-bright transition-colors self-start mt-4">
              RUN NEW SIMULATION
            </button>
          </div>
        </div>

        {/* Right col: Sales table (7/12) */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-xl overflow-hidden">
            {/* Table card header */}
            <div className="p-8 border-b border-on-secondary-fixed/10 flex justify-between items-center">
              <div>
                <h2 className="text-[18px] font-semibold leading-6 text-on-surface">
                  Sales Overview Table
                </h2>
                <p className="text-sm text-on-surface-variant/60 mt-0.5">
                  Comprehensive performance breakdown by Store and Product ID.
                </p>
              </div>
              <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
                  filter_list
                </span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container/30 border-b border-on-secondary-fixed/5">
                    {[
                      { label: 'STORE ID',    align: 'left'  },
                      { label: 'PROD ID',     align: 'left'  },
                      { label: 'TOTAL SALES', align: 'right' },
                      { label: 'AVG DAILY',   align: 'right' },
                      { label: 'TOTAL DAYS',  align: 'right' },
                      { label: 'START DATE',  align: 'left'  },
                      { label: 'END DATE',    align: 'left'  },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-6 py-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60 whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-on-secondary-fixed/5">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-on-surface-variant/60">
                        No data for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr key={`${row.Store_id}-${row.Product_id}`} className="hover:bg-white/20 transition-colors">
                        <td className="px-6 py-5 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                          {row.Store_id}
                        </td>
                        <td className="px-6 py-5 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                          {row.Product_id}
                        </td>
                        <td className="px-6 py-5 text-sm text-right font-semibold text-on-surface">
                          {fmtSales(row.total_sales)}
                        </td>
                        <td className="px-6 py-5 text-sm text-right text-on-surface">
                          {fmtNum(row.avg_daily_sales)}
                        </td>
                        <td className="px-6 py-5 text-sm text-right text-on-surface-variant/60">
                          {row.total_days}
                        </td>
                        <td className="px-6 py-5 font-mono text-[12px] font-medium tracking-wide text-on-surface-variant/60">
                          {fmtDateShort(row.start_date)}
                        </td>
                        <td className="px-6 py-5 font-mono text-[12px] font-medium tracking-wide text-on-surface-variant/60">
                          {fmtDateShort(row.end_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 bg-surface-container/30 border-t border-on-secondary-fixed/5 flex justify-center">
              <nav className="flex gap-2 items-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-all disabled:opacity-30"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                </button>

                {paginate(safePage, totalPages).map((n, idx) =>
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
          </div>
        </div>
      </div>
    </div>
  )
}
