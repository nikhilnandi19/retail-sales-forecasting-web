import { useEffect, useMemo, useState } from 'react'
import { loadModelMetrics } from '../utils/csvLoader'
import type { ModelMetrics } from '../types'
import { fmtNum, unique } from '../utils/formatters'
import AnimatedNumber from '../components/AnimatedNumber'

// ── Model type badge mapping ──────────────────────────────
const MODEL_TYPE: Record<string, { label: string; cls: string }> = {
  'Random Forest':     { label: 'ML',          cls: 'bg-primary-container/20 text-on-primary-container border border-primary-container/30' },
  'Enhanced Ensemble': { label: 'ENSEMBLE',    cls: 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40' },
  'Linear Regression': { label: 'STATISTICAL', cls: 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40' },
  'Seasonal Naive':    { label: 'STATISTICAL', cls: 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40' },
  'Trend':             { label: 'STATISTICAL', cls: 'bg-secondary-container/30 text-on-secondary-container border border-secondary-container/40' },
  'Naive':             { label: 'BASELINE',    cls: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant' },
  'Moving Average':    { label: 'BASELINE',    cls: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant' },
}

function statusForRank(rank: number) {
  if (rank === 0) return { text: 'Recommended', primary: true }
  if (rank === 1) return { text: 'Secondary',   primary: false }
  if (rank === 2) return { text: 'Standard',    primary: false }
  return              { text: 'Fallback',       primary: false }
}

// ── CSS bar chart row ─────────────────────────────────────
function BarRow({
  label, value, unit = '', maxVal, isLeader, height = 'h-3',
}: {
  label: string; value: number; unit?: string; maxVal: number; isLeader: boolean; height?: string
}) {
  const pct = maxVal > 0 ? Math.max(6, (value / maxVal) * 88) : 6
  return (
    <div className="space-y-2">
      <div className="flex justify-between font-mono text-[12px] font-medium tracking-wide text-on-surface-variant">
        <span>{label}</span>
        <span>{fmtNum(value)}{unit}</span>
      </div>
      <div className={`w-full bg-surface-container-highest ${height} rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLeader ? 'bg-tertiary' : 'bg-secondary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function ModelPerformance() {
  const [metricsData, setMetricsData] = useState<ModelMetrics[]>([])
  const [loading,     setLoading]     = useState(true)
  const [storeFilter,   setStoreFilter]   = useState('S001')
  const [productFilter, setProductFilter] = useState('P001')
  const [freqFilter,    setFreqFilter]    = useState('weekly')

  useEffect(() => {
    loadModelMetrics().then((data) => { setMetricsData(data); setLoading(false) })
  }, [])

  const stores   = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Store_id)).sort()],           [metricsData])
  const products = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Product_id)).sort()],         [metricsData])
  const freqs    = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Forecast_Frequency)).sort()], [metricsData])

  const filtered = useMemo(
    () => metricsData.filter((d) =>
      (storeFilter   === 'All' || d.Store_id           === storeFilter) &&
      (productFilter === 'All' || d.Product_id         === productFilter) &&
      (freqFilter    === 'All' || d.Forecast_Frequency === freqFilter)
    ),
    [metricsData, storeFilter, productFilter, freqFilter]
  )

  const filtersActive = storeFilter !== 'S001' || productFilter !== 'P001' || freqFilter !== 'weekly'
  const handleReset   = () => { setStoreFilter('S001'); setProductFilter('P001'); setFreqFilter('weekly') }

  const sortedByMAE  = useMemo(() => [...filtered].sort((a, b) => a.MAE  - b.MAE),  [filtered])
  const sortedByRMSE = useMemo(() => [...filtered].sort((a, b) => a.RMSE - b.RMSE), [filtered])
  const sortedByMAPE = useMemo(() => [...filtered].sort((a, b) => a.MAPE - b.MAPE), [filtered])

  const bestModel   = sortedByMAE[0]
  const lowestMAE   = bestModel?.MAE  ?? 0
  const lowestRMSE  = sortedByRMSE[0]?.RMSE ?? 0
  const horizon     = filtered[0]?.Forecast_Horizon ?? 8

  const maxMAE  = sortedByMAE[sortedByMAE.length   - 1]?.MAE  ?? 1
  const maxRMSE = sortedByRMSE[sortedByRMSE.length - 1]?.RMSE ?? 1
  const maxMAPE = sortedByMAPE[sortedByMAPE.length - 1]?.MAPE ?? 1

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant/70">Loading model metrics…</p>
        </div>
      </div>
    )
  }

  const selectCls =
    'bg-white/40 border border-outline-variant rounded-lg px-4 py-2 text-sm ' +
    'focus:ring-2 focus:ring-primary outline-none transition-all text-on-surface cursor-pointer'

  return (
    <div className="space-y-8">

      {/* ── Header + Filters ─────────────────────────────── */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div>
            <h1 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-surface">
              Model Performance
            </h1>
            <p className="text-on-surface-variant mt-1 text-sm">
              Deep dive into retail forecasting accuracy and benchmarking.
            </p>
          </div>

          {/* Filter dropdowns — outlined, Stitch Model Performance style */}
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-secondary-fixed-variant">
                Store
              </label>
              <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} className={selectCls}>
                {stores.map((s) => (
                  <option key={s} value={s} className="bg-surface-container-low">
                    {s === 'All' ? 'All Stores' : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-secondary-fixed-variant">
                Product
              </label>
              <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={selectCls}>
                {products.map((p) => (
                  <option key={p} value={p} className="bg-surface-container-low">
                    {p === 'All' ? 'Category: All' : p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-secondary-fixed-variant">
                Frequency
              </label>
              <select value={freqFilter} onChange={(e) => setFreqFilter(e.target.value)} className={selectCls}>
                {freqs.map((f) => (
                  <option key={f} value={f} className="bg-surface-container-low">
                    {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset filters */}
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 self-end pb-2 text-[11px] font-bold tracking-[0.05em] uppercase transition-colors duration-200 ${
                filtersActive
                  ? 'text-primary opacity-100 cursor-pointer hover:opacity-75'
                  : 'text-on-surface-variant opacity-20 pointer-events-none'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>restart_alt</span>
              Reset
            </button>
          </div>
        </div>

        {/* ── 4 KPI Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Best Model by MAE — text value fades on filter change via key */}
          <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[120px]">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
              Best Model by MAE
            </span>
            <div className="mt-4">
              {filtered.length === 0 ? (
                <span className="text-on-surface-variant/50 text-sm">No data</span>
              ) : (
                <>
                  <span
                    key={bestModel.Model}
                    className="text-[18px] font-semibold leading-6 block text-on-surface animate-fade-in"
                  >
                    {bestModel.Model}
                  </span>
                  <div className="mt-2">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight">
                      Model Optimal
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lowest MAE */}
          <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[120px]">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
              Lowest MAE
            </span>
            <div className="mt-4 flex items-baseline gap-2 flex-wrap">
              <AnimatedNumber
                value={lowestMAE}
                decimals={2}
                className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-surface"
              />
              <span className="text-tertiary font-medium text-sm flex items-center gap-0.5">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_down</span>
                -2.4%
              </span>
            </div>
          </div>

          {/* Lowest RMSE */}
          <div className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[120px]">
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
              Lowest RMSE
            </span>
            <div className="mt-4">
              <AnimatedNumber
                value={lowestRMSE}
                decimals={2}
                className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-surface"
              />
            </div>
          </div>

          {/* Forecast Horizon — salmon left accent border */}
          <div
            className="glass-card p-6 rounded-xl flex flex-col justify-between min-h-[120px] border-l-4"
            style={{ borderLeftColor: '#a43c2a' }}
          >
            <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
              Forecast Horizon
            </span>
            <div className="mt-4">
              <AnimatedNumber
                value={horizon}
                decimals={0}
                className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-surface"
              />
              <span className="text-sm text-on-surface-variant ml-1">Weeks</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Comparison Charts ─────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MAE */}
        <div className="glass-card p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-semibold leading-6">Model Comparison by MAE</h3>
            <span className="font-mono text-[12px] font-medium tracking-wide text-on-surface-variant/70">
              Lower is better
            </span>
          </div>
          {sortedByMAE.length === 0 ? (
            <p className="text-sm text-on-surface-variant/50 py-8 text-center">No data for selected filters.</p>
          ) : (
            <div className="space-y-6">
              {sortedByMAE.map((d, i) => (
                <BarRow key={d.Model} label={d.Model} value={d.MAE} maxVal={maxMAE} isLeader={i === 0} height="h-3" />
              ))}
            </div>
          )}
        </div>

        {/* RMSE */}
        <div className="glass-card p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-semibold leading-6">Model Comparison by RMSE</h3>
            <span className="font-mono text-[12px] font-medium tracking-wide text-on-surface-variant/70">
              Standard deviation of errors
            </span>
          </div>
          {sortedByRMSE.length === 0 ? (
            <p className="text-sm text-on-surface-variant/50 py-8 text-center">No data for selected filters.</p>
          ) : (
            <div className="space-y-6">
              {sortedByRMSE.map((d, i) => (
                <BarRow key={d.Model} label={d.Model} value={d.RMSE} maxVal={maxRMSE} isLeader={i === 0} height="h-3" />
              ))}
            </div>
          )}
        </div>

        {/* MAPE — full width */}
        <div className="glass-card p-8 rounded-xl lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[18px] font-semibold leading-6">Model Comparison by MAPE</h3>
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-tertiary" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                  Leading Model
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                  Benchmarks
                </span>
              </div>
            </div>
          </div>
          {sortedByMAPE.length === 0 ? (
            <p className="text-sm text-on-surface-variant/50 py-8 text-center">No data for selected filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {sortedByMAPE.map((d, i) => (
                <BarRow key={d.Model} label={d.Model} value={d.MAPE} unit="%" maxVal={maxMAPE} isLeader={i === 0} height="h-4" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Full Model Metrics Table ──────────────────────── */}
      <section>
        <div className="glass-card rounded-xl overflow-hidden">

          {/* Table header */}
          <div className="px-8 py-6 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-[18px] font-semibold leading-6">Full Model Metrics Table</h3>
            <button className="flex items-center gap-2 text-primary font-bold hover:opacity-80 transition-opacity">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download</span>
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase">Export CSV</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto scroll-hide">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  {['Model Name', 'Type', 'MAE', 'RMSE', 'MAPE (%)', 'Status'].map((col) => (
                    <th
                      key={col}
                      className="px-8 py-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-secondary-fixed-variant border-b border-outline-variant whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {sortedByMAE.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-sm text-on-surface-variant/50">
                      No data for the selected filters.
                    </td>
                  </tr>
                ) : (
                  sortedByMAE.map((row, i) => {
                    const { text: statusText, primary: isTop } = statusForRank(i)
                    const typeInfo = MODEL_TYPE[row.Model] ?? {
                      label: 'OTHER',
                      cls: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant',
                    }
                    return (
                      <tr
                        key={row.Model}
                        className={
                          i === 0
                            ? 'bg-tertiary/5 hover:bg-tertiary/10 transition-colors'
                            : 'hover:bg-surface-container/30 transition-colors'
                        }
                      >
                        <td className={`px-8 py-4 ${i === 0 ? 'font-bold text-on-surface' : 'text-on-surface'}`}>
                          {row.Model}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${typeInfo.cls}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide">
                          {fmtNum(row.MAE)}
                        </td>
                        <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide">
                          {fmtNum(row.RMSE)}
                        </td>
                        <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide">
                          {fmtNum(row.MAPE)}%
                        </td>
                        <td className="px-8 py-4">
                          {isTop ? (
                            <span className="text-tertiary flex items-center gap-1 font-bold text-xs uppercase">
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                              Recommended
                            </span>
                          ) : (
                            <span className="text-on-surface-variant italic text-xs">{statusText}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
