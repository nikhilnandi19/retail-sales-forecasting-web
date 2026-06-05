import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { loadForecastOutput, loadActualVsForecast, loadModelMetrics } from '../utils/csvLoader'
import type { ForecastOutput, ActualVsForecast, ModelMetrics } from '../types'
import { fmtNum, fmtDateShort, unique } from '../utils/formatters'

// ── Status computation ────────────────────────────────────
function confidenceStatus(value: number, mean: number, std: number): string {
  const z = std > 0 ? Math.abs(value - mean) / std : 0
  if (z < 0.5) return 'High Confidence'
  if (z < 1.5) return 'Medium Confidence'
  return 'Anomaly Detected'
}

const STATUS_STYLE: Record<string, { pill: string; dot: string }> = {
  'High Confidence':   { pill: 'bg-tertiary-fixed/40 text-on-tertiary-fixed-variant', dot: 'bg-tertiary' },
  'Medium Confidence': { pill: 'bg-secondary-container/40 text-on-secondary-container', dot: 'bg-secondary' },
  'Anomaly Detected':  { pill: 'bg-error-container/40 text-on-error-container', dot: 'bg-error' },
}

// ── Chart tooltip ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(86,56,45,0.14)', borderRadius: 12,
      padding: '8px 12px', boxShadow: '0 4px 20px rgba(32,19,21,0.08)',
    }}>
      <p style={{ color: '#57423e', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </p>
      {payload.map((p: { name: string; value: number; color: string }) =>
        p.value != null && (
          <p key={p.name} style={{ color: p.color, fontSize: 12, fontFamily: '"JetBrains Mono"', fontWeight: 500, lineHeight: '20px' }}>
            {p.name}: {fmtNum(p.value)}
          </p>
        )
      )}
    </div>
  )
}

const PAGE_SIZE = 8

export default function ForecastResults() {
  const [forecastData, setForecastData] = useState<ForecastOutput[]>([])
  const [avfData,      setAvfData]      = useState<ActualVsForecast[]>([])
  const [metricsData,  setMetricsData]  = useState<ModelMetrics[]>([])
  const [loading,      setLoading]      = useState(true)

  const [storeFilter,   setStoreFilter]   = useState('S001')
  const [productFilter, setProductFilter] = useState('P001')
  const [freqFilter,    setFreqFilter]    = useState('weekly')
  const [searchTerm,    setSearchTerm]    = useState('')
  const [page,          setPage]          = useState(1)

  useEffect(() => {
    Promise.all([
      loadForecastOutput(),
      loadActualVsForecast(),
      loadModelMetrics(),
    ]).then(([forecast, avf, metrics]) => {
      setForecastData(forecast)
      setAvfData(avf)
      setMetricsData(metrics)
      setLoading(false)
    })
  }, [])

  // ── Filter options ────────────────────────────────────
  const stores   = useMemo(() => unique(forecastData.map((d) => d.Store_id)).sort(),   [forecastData])
  const products = useMemo(() => unique(forecastData.map((d) => d.Product_id)).sort(), [forecastData])
  const freqs    = useMemo(() => unique(forecastData.map((d) => d.Forecast_Frequency)).sort(), [forecastData])

  const setStore   = (v: string) => { setStoreFilter(v);   setPage(1) }
  const setProduct = (v: string) => { setProductFilter(v); setPage(1) }
  const setFreq    = (v: string) => { setFreqFilter(v);    setPage(1) }

  // ── Filtered slices ───────────────────────────────────
  const filtered = useMemo(
    () => forecastData.filter(
      (d) => d.Store_id === storeFilter && d.Product_id === productFilter && d.Forecast_Frequency === freqFilter
    ),
    [forecastData, storeFilter, productFilter, freqFilter]
  )

  const filteredAvf = useMemo(
    () => avfData.filter(
      (d) => d.Store_id === storeFilter && d.Product_id === productFilter && d.Forecast_Frequency === freqFilter
    ),
    [avfData, storeFilter, productFilter, freqFilter]
  )

  const filteredMetrics = useMemo(
    () => metricsData.filter(
      (d) => d.Store_id === storeFilter && d.Product_id === productFilter && d.Forecast_Frequency === freqFilter
    ),
    [metricsData, storeFilter, productFilter, freqFilter]
  )

  // ── KPIs ──────────────────────────────────────────────
  const horizon      = filteredMetrics.length > 0 ? filteredMetrics[0].Forecast_Horizon : 8
  const freq         = filtered.length > 0 ? filtered[0].Forecast_Frequency : freqFilter
  const avgEnsemble  = filtered.length > 0
    ? filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0) / filtered.length
    : 0
  const totalEnsemble = filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0)

  // ── Actual vs Forecast chart ──────────────────────────
  const avfChartData = useMemo(() => {
    const actualMap: Record<string, number>   = {}
    const forecastMap: Record<string, number> = {}
    filteredAvf.forEach((d) => {
      const key = fmtDateShort(d.Date)
      if (d.Type === 'Actual') actualMap[key]   = d.Sales
      else                     forecastMap[key] = d.Sales
    })
    const allDates = [...new Set(filteredAvf.map((d) => fmtDateShort(d.Date)))].sort()
    return allDates.map((date) => ({
      date,
      Actual:   actualMap[date]   ?? null,
      Forecast: forecastMap[date] ?? null,
    }))
  }, [filteredAvf])

  const forecastStartDate = useMemo(
    () => avfChartData.find((d) => d.Forecast !== null && d.Actual === null)?.date ?? null,
    [avfChartData]
  )

  // ── Forecast comparison chart (all model lines) ───────
  const modelChartData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => a.Forecast_Date.localeCompare(b.Forecast_Date))
        .map((d) => ({
          date:              fmtDateShort(d.Forecast_Date),
          Naive:             d.Naive_Forecast,
          'Moving Avg':      d.Moving_Average_Forecast,
          'Seasonal Naive':  d.Seasonal_Naive_Forecast,
          Trend:             d.Trend_Forecast,
          'Linear Reg':      d.Linear_Regression_Forecast,
          'Random Forest':   d.Random_Forest_Forecast,
          Ensemble:          d.Enhanced_Ensemble_Forecast,
        })),
    [filtered]
  )

  // ── Model accuracy ranking (sorted best first) ────────
  const modelAccuracy = useMemo(
    () =>
      [...filteredMetrics]
        .map((d) => ({ model: d.Model, accuracy: Math.max(0, 100 - d.MAPE) }))
        .sort((a, b) => b.accuracy - a.accuracy),
    [filteredMetrics]
  )
  const topModel    = modelAccuracy[0] ?? null
  const otherModels = modelAccuracy.slice(1, 4)

  // ── Table with stats for status badges ────────────────
  const { mean: tblMean, std: tblStd } = useMemo(() => {
    if (filtered.length === 0) return { mean: 0, std: 1 }
    const mean = filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0) / filtered.length
    const variance = filtered.reduce((s, d) => s + Math.pow((d.Enhanced_Ensemble_Forecast || 0) - mean, 2), 0) / filtered.length
    return { mean, std: Math.sqrt(variance) || 1 }
  }, [filtered])

  const tableData = useMemo(() => {
    const rows = [...filtered].sort((a, b) => a.Forecast_Date.localeCompare(b.Forecast_Date))
    const searched = searchTerm
      ? rows.filter((d) =>
          fmtDateShort(d.Forecast_Date).includes(searchTerm) ||
          d.Store_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.Product_id.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : rows
    return searched.map((d) => ({
      ...d,
      status: confidenceStatus(d.Enhanced_Ensemble_Forecast || 0, tblMean, tblStd),
    }))
  }, [filtered, searchTerm, tblMean, tblStd])

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const pageRows   = tableData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // ── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-sm text-on-surface-variant/70">Loading forecast data…</p>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ── Breadcrumb + title ─────────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-1.5 text-on-surface-variant/60 text-[11px] font-bold tracking-[0.05em] uppercase">
          <span>Dashboard</span>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>chevron_right</span>
          <span className="text-on-surface-variant">Forecast Results</span>
        </div>
        <h1 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-on-background">
          Retail Sales Forecast: Q3 2026
        </h1>
      </section>

      {/* ── KPI row ────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          { label: 'Forecast Frequency',     icon: 'update',     value: freq,                                                         sub: 'Reporting cycle' },
          { label: 'Forecast Horizon',        icon: 'event_note', value: horizon.toString(),                                            sub: 'Weeks ahead' },
          { label: 'Avg Ensemble Forecast',   icon: 'insights',   value: fmtNum(avgEnsemble),                                           sub: 'Units per week' },
          { label: 'Total Forecasted Sales',  icon: 'analytics',  value: totalEnsemble.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sub: 'Aggregate units' },
        ] as const).map(({ label, icon, value, sub }) => (
          <div key={label} className="glass-card p-6 rounded-xl flex flex-col justify-between h-[140px]">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">
                {label}
              </span>
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>{icon}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[24px] font-semibold leading-8 tracking-tight text-on-background block">
                {value}
              </span>
              <p className="text-on-surface-variant/70 text-xs">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Filters row ────────────────────────────────── */}
      <section className="glass-card p-4 rounded-xl flex flex-wrap gap-3 items-center">

        {/* Store pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>store</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">
            Store:
          </span>
          <select
            value={storeFilter}
            onChange={(e) => setStore(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {stores.map((s) => <option key={s} value={s} className="bg-surface-container-low">{s}</option>)}
          </select>
        </div>

        {/* Product pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>inventory_2</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">
            Product:
          </span>
          <select
            value={productFilter}
            onChange={(e) => setProduct(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {products.map((p) => <option key={p} value={p} className="bg-surface-container-low">{p}</option>)}
          </select>
        </div>

        {/* Frequency pill */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>schedule</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">
            Frequency:
          </span>
          <select
            value={freqFilter}
            onChange={(e) => setFreq(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {freqs.map((f) => <option key={f} value={f} className="bg-surface-container-low">{f}</option>)}
          </select>
        </div>

        {/* Action buttons */}
        <div className="ml-auto flex gap-3 flex-wrap">
          <button
            className="px-6 py-2 bg-primary text-on-primary rounded-full font-bold text-sm transition-transform active:scale-95"
            style={{ boxShadow: '0 4px 12px rgba(231,109,87,0.3)' }}
          >
            Update Forecast
          </button>
          <button className="px-6 py-2 border border-secondary text-secondary rounded-full font-bold hover:bg-surface-container/50 transition-colors text-sm">
            Export Data
          </button>
        </div>
      </section>

      {/* ── Charts (bento 8/4) ─────────────────────────── */}
      <section className="grid grid-cols-12 gap-6">

        {/* Actual vs Forecast (8/12) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-8 rounded-2xl">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-[18px] font-semibold leading-6 mb-1">Actual vs Forecast Sales</h3>
              <p className="text-on-surface-variant/70 text-xs">
                Historical performance compared to predictive ensemble modeling
              </p>
            </div>
            <div className="flex gap-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary inline-block" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary-container inline-block" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">Forecast</span>
              </div>
            </div>
          </div>

          {avfChartData.length === 0 ? (
            <div className="h-[360px] bg-white/10 rounded-lg border border-on-secondary-fixed/5 flex items-center justify-center text-sm text-on-surface-variant/50">
              No data for the selected filters.
            </div>
          ) : (
            <div className="h-[360px] w-full bg-white/10 rounded-lg border border-on-secondary-fixed/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avfChartData} margin={{ top: 28, right: 20, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,19,21,0.05)" vertical={false} />

                  {/* Forecast region shading */}
                  {forecastStartDate && (
                    <ReferenceArea x1={forecastStartDate} fill="#E76D57" fillOpacity={0.05} />
                  )}

                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#57423e', fontSize: 10, fontFamily: '"JetBrains Mono"', opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fill: '#57423e', fontSize: 10, opacity: 0.5 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip content={<ChartTooltip />} />

                  {/* Forecast start dashed line */}
                  {forecastStartDate && (
                    <ReferenceLine
                      x={forecastStartDate}
                      stroke="#E76D57"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{
                        value: 'FORECAST START',
                        position: 'insideTopRight',
                        fill: '#E76D57',
                        fontSize: 9,
                        fontFamily: '"JetBrains Mono"',
                        offset: 8,
                      }}
                    />
                  )}

                  {/* Actual — carafe */}
                  <Line
                    type="monotone"
                    dataKey="Actual"
                    stroke="#56382D"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                  />
                  {/* Forecast — salmon */}
                  <Line
                    type="monotone"
                    dataKey="Forecast"
                    stroke="#E76D57"
                    strokeWidth={4}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Forecast Comparison (4/12) */}
        <div className="col-span-12 lg:col-span-4 glass-card p-8 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-[18px] font-semibold leading-6 mb-1">Forecast Comparison</h3>
            <p className="text-on-surface-variant/70 text-xs">Variance across model architectures</p>
          </div>

          {/* Mini multi-model chart */}
          {modelChartData.length > 0 ? (
            <div className="mb-4" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={modelChartData} margin={{ top: 5, right: 5, left: -28, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="rgba(32,19,21,0.04)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis
                    tick={{ fill: '#57423e', fontSize: 9, opacity: 0.4 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  {(['Naive', 'Moving Avg', 'Seasonal Naive', 'Trend', 'Linear Reg', 'Random Forest'] as const).map((m) => (
                    <Line
                      key={m}
                      type="monotone"
                      dataKey={m}
                      stroke="#56382D"
                      strokeWidth={1}
                      strokeOpacity={0.22}
                      dot={false}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="Ensemble"
                    stroke="#E76D57"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-on-surface-variant/40 mb-4">
              No forecast data
            </div>
          )}

          {/* Accuracy rankings */}
          <div className="space-y-2 flex-1">
            {modelAccuracy.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 text-center py-4">No metrics data</p>
            ) : (
              <>
                {topModel && (
                  <div className="flex justify-between items-center bg-primary-container/10 p-3 rounded-lg border border-primary/20">
                    <span className="font-bold text-primary flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                      {topModel.model}
                    </span>
                    <span className="font-mono text-[11px] font-medium tracking-wide text-on-surface">
                      {topModel.accuracy.toFixed(1)}% Accuracy
                    </span>
                  </div>
                )}
                {otherModels.map((m) => (
                  <div key={m.model} className="flex justify-between items-center px-3 py-1 text-on-surface-variant/60 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-on-surface-variant/30 inline-block" />
                      {m.model}
                    </span>
                    <span className="font-mono text-[11px] font-medium tracking-wide">
                      {m.accuracy.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Forecast Output Details table ──────────────── */}
      <section className="glass-card rounded-2xl overflow-hidden">

        {/* Table header */}
        <div className="p-8 border-b border-on-secondary-fixed/5 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h3 className="text-[18px] font-semibold leading-6 mb-1">Forecast Output Details</h3>
            <p className="text-on-surface-variant/70 text-xs">Raw forecast values and confidence intervals by date</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40"
                style={{ fontSize: 16 }}
              >
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                placeholder="Search entries..."
                className="pl-9 pr-4 py-2 bg-white/40 border border-on-secondary-fixed/10 rounded-full text-xs focus:ring-1 focus:ring-primary focus:outline-none w-52 text-on-surface placeholder:text-on-surface-variant/40"
              />
            </div>
            <button className="p-2 border border-on-secondary-fixed/10 rounded-full hover:bg-surface-container/50 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container/30">
              <tr>
                {['Store ID', 'Product ID', 'Frequency', 'Forecast Date', 'Ensemble Value', 'Status'].map((col) => (
                  <th
                    key={col}
                    className="px-8 py-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-on-secondary-fixed/5">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-sm text-on-surface-variant/50">
                    No data for the selected filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => {
                  const s = STATUS_STYLE[row.status] ?? STATUS_STYLE['Medium Confidence']
                  return (
                    <tr key={i} className="hover:bg-primary-container/5 transition-colors group">
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                        {row.Store_id}
                      </td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                        {row.Product_id}
                      </td>
                      <td className="px-8 py-4 text-sm text-on-surface-variant/70">
                        {row.Forecast_Frequency}
                      </td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                        {fmtDateShort(row.Forecast_Date)}
                      </td>
                      <td className="px-8 py-4 font-bold text-primary">
                        {fmtNum(row.Enhanced_Ensemble_Forecast)}
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${s.pill}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="px-8 py-6 bg-surface-container/20 border-t border-on-secondary-fixed/5 flex justify-between items-center">
          <span className="text-xs text-on-surface-variant/60">
            Showing {pageRows.length} of {tableData.length} forecast intervals
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg border border-on-secondary-fixed/5 hover:bg-white/40 disabled:opacity-20 transition-all"
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg border border-on-secondary-fixed/5 hover:bg-white/40 disabled:opacity-20 transition-all"
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
