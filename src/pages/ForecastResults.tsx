import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import {
  loadForecastOutput, loadActualVsForecast,
  loadModelMetrics, loadBacktestOutput,
} from '../utils/csvLoader'
import type { ForecastOutput, ActualVsForecast, ModelMetrics, BacktestOutput } from '../types'
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

function mapeLabel(mape: number): { text: string; cls: string } {
  if (mape < 15) return { text: 'Strong accuracy', cls: 'text-tertiary font-bold' }
  if (mape < 25) return { text: 'Moderate accuracy', cls: 'text-secondary font-bold' }
  return { text: 'High forecast error', cls: 'text-error font-bold' }
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
  const [forecastData,  setForecastData]  = useState<ForecastOutput[]>([])
  const [avfData,       setAvfData]       = useState<ActualVsForecast[]>([])
  const [metricsData,   setMetricsData]   = useState<ModelMetrics[]>([])
  const [backtestData,  setBacktestData]  = useState<BacktestOutput[]>([])
  const [loading,       setLoading]       = useState(true)

  const [storeFilter,   setStoreFilter]   = useState('S001')
  const [productFilter, setProductFilter] = useState('P001')
  const [freqFilter,    setFreqFilter]    = useState('weekly')

  // Forecast Output table state
  const [searchTerm, setSearchTerm] = useState('')
  const [page,       setPage]       = useState(1)

  // Backtest table state
  const [btPage, setBtPage] = useState(1)

  useEffect(() => {
    Promise.all([
      loadForecastOutput(),
      loadActualVsForecast(),
      loadModelMetrics(),
      loadBacktestOutput(),
    ]).then(([forecast, avf, metrics, backtest]) => {
      setForecastData(forecast)
      setAvfData(avf)
      setMetricsData(metrics)
      setBacktestData(backtest)
      setLoading(false)
    })
  }, [])

  // ── Filter options ────────────────────────────────────
  const stores   = useMemo(() => unique(forecastData.map((d) => d.Store_id)).sort(),   [forecastData])
  const products = useMemo(() => unique(forecastData.map((d) => d.Product_id)).sort(), [forecastData])
  const freqs    = useMemo(() => unique(forecastData.map((d) => d.Forecast_Frequency)).sort(), [forecastData])

  const setStore   = (v: string) => { setStoreFilter(v);   setPage(1); setBtPage(1) }
  const setProduct = (v: string) => { setProductFilter(v); setPage(1); setBtPage(1) }
  const setFreq    = (v: string) => { setFreqFilter(v);    setPage(1); setBtPage(1) }

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

  const filteredBacktest = useMemo(
    () => backtestData.filter(
      (d) => d.Store_id === storeFilter && d.Product_id === productFilter && d.Forecast_Frequency === freqFilter
    ),
    [backtestData, storeFilter, productFilter, freqFilter]
  )

  // ── Backtest KPIs ─────────────────────────────────────
  const backtestMAE = useMemo(() => {
    if (filteredBacktest.length === 0) return 0
    return filteredBacktest.reduce((s, d) => s + (d.Ensemble_Absolute_Error || 0), 0) / filteredBacktest.length
  }, [filteredBacktest])

  const backtestMAPE = useMemo(() => {
    if (filteredBacktest.length === 0) return 0
    return filteredBacktest.reduce((s, d) => s + (d.Ensemble_Percent_Error || 0), 0) / filteredBacktest.length
  }, [filteredBacktest])

  // ── Future forecast KPIs ──────────────────────────────
  const horizon       = filteredMetrics.length > 0 ? filteredMetrics[0].Forecast_Horizon : filtered.length || 8
  const totalEnsemble = filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0)

  // ── Combined chart: actual + backtest + future ────────
  const combinedChartData = useMemo(() => {
    const actualMap:   Record<string, number> = {}
    const backtestMap: Record<string, number> = {}
    const futureMap:   Record<string, number> = {}

    filteredAvf.forEach((d) => {
      if (d.Type === 'Actual') actualMap[fmtDateShort(d.Date)] = d.Sales
    })
    filteredBacktest.forEach((d) => {
      backtestMap[fmtDateShort(d.Backtest_Date)] = d.Enhanced_Ensemble_Backtest
    })
    ;[...filtered]
      .sort((a, b) => a.Forecast_Date.localeCompare(b.Forecast_Date))
      .forEach((d) => {
        futureMap[fmtDateShort(d.Forecast_Date)] = d.Enhanced_Ensemble_Forecast
      })

    const allDates = [...new Set([
      ...Object.keys(actualMap),
      ...Object.keys(backtestMap),
      ...Object.keys(futureMap),
    ])].sort()

    return allDates.map((date) => ({
      date,
      Actual:   actualMap[date]   ?? null,
      Backtest: backtestMap[date] ?? null,
      Future:   futureMap[date]   ?? null,
    }))
  }, [filteredAvf, filteredBacktest, filtered])

  const futureStartDate = useMemo(
    () => combinedChartData.find((d) => d.Future !== null)?.date ?? null,
    [combinedChartData]
  )

  // ── Forecast comparison chart (all model lines) ───────
  const modelChartData = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => a.Forecast_Date.localeCompare(b.Forecast_Date))
        .map((d) => ({
          date:             fmtDateShort(d.Forecast_Date),
          Naive:            d.Naive_Forecast,
          'Moving Avg':     d.Moving_Average_Forecast,
          'Seasonal Naive': d.Seasonal_Naive_Forecast,
          Trend:            d.Trend_Forecast,
          'Linear Reg':     d.Linear_Regression_Forecast,
          'Random Forest':  d.Random_Forest_Forecast,
          Ensemble:         d.Enhanced_Ensemble_Forecast,
        })),
    [filtered]
  )

  // ── Forecast comparison: avg value per model from forecast CSV ───
  const MODEL_KEYS = [
    { model: 'Enhanced Ensemble', key: 'Enhanced_Ensemble_Forecast' as keyof ForecastOutput },
    { model: 'Random Forest',     key: 'Random_Forest_Forecast'     as keyof ForecastOutput },
    { model: 'Seasonal Naive',    key: 'Seasonal_Naive_Forecast'    as keyof ForecastOutput },
    { model: 'Linear Regression', key: 'Linear_Regression_Forecast' as keyof ForecastOutput },
  ] as const

  const modelForecastAvg = useMemo(() => {
    if (filtered.length === 0) return []
    return MODEL_KEYS.map(({ model, key }) => ({
      model,
      avg: filtered.reduce((s, d) => s + ((d[key] as number) || 0), 0) / filtered.length,
    }))
  }, [filtered])

  // ── Forecast Output table ─────────────────────────────
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

  // ── Backtest table ────────────────────────────────────
  const backtestTableData = useMemo(
    () => [...filteredBacktest].sort((a, b) => a.Backtest_Date.localeCompare(b.Backtest_Date)),
    [filteredBacktest]
  )
  const btTotalPages = Math.max(1, Math.ceil(backtestTableData.length / PAGE_SIZE))
  const safeBtPage   = Math.min(btPage, btTotalPages)
  const btPageRows   = backtestTableData.slice((safeBtPage - 1) * PAGE_SIZE, safeBtPage * PAGE_SIZE)

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

  const accuracyLabel = mapeLabel(backtestMAPE)

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
          Retail Sales Forecast: 8-Week Horizon
        </h1>
      </section>

      {/* ── KPI row ────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          {
            label: 'Backtest MAE',
            icon: 'target',
            value: fmtNum(backtestMAE),
            sub: 'Avg absolute error (8-week holdout)',
          },
          {
            label: 'Backtest MAPE',
            icon: 'percent',
            value: `${fmtNum(backtestMAPE)}%`,
            sub: 'Avg % error vs actual sales',
          },
          {
            label: 'Forecast Horizon',
            icon: 'event_note',
            value: `${horizon}`,
            sub: 'Weeks ahead',
          },
          {
            label: 'Total Forecasted Sales',
            icon: 'analytics',
            value: totalEnsemble.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            sub: 'Aggregate ensemble units',
          },
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

        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>store</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">Store:</span>
          <select
            value={storeFilter}
            onChange={(e) => setStore(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {stores.map((s) => <option key={s} value={s} className="bg-surface-container-low">{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>inventory_2</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">Product:</span>
          <select
            value={productFilter}
            onChange={(e) => setProduct(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {products.map((p) => <option key={p} value={p} className="bg-surface-container-low">{p}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-white/40 rounded-lg border border-on-secondary-fixed/5">
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 17 }}>schedule</span>
          <span className="font-mono text-[11px] font-medium tracking-wide uppercase text-on-surface-variant/60">Frequency:</span>
          <select
            value={freqFilter}
            onChange={(e) => setFreq(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-on-surface cursor-pointer"
          >
            {freqs.map((f) => <option key={f} value={f} className="bg-surface-container-low">{f}</option>)}
          </select>
        </div>

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

      {/* ── Charts (8 / 4 bento) ──────────────────────── */}
      <section className="grid grid-cols-12 gap-6">

        {/* Combined chart (8/12) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-8 rounded-2xl">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-[18px] font-semibold leading-6 mb-1">
                Actual, Backtested Forecast &amp; Future Forecast
              </h3>
              <p className="text-on-surface-variant/70 text-xs">
                Holdout validation against the last 8 weeks, plus 8-week forward projection
              </p>
            </div>
            <div className="flex gap-5 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary inline-block" />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block"
                  style={{ width: 20, height: 3, background: '#E76D57',
                    backgroundImage: 'repeating-linear-gradient(90deg,#E76D57 0,#E76D57 8px,transparent 8px,transparent 12px)' }}
                />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">Backtest</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 inline-block" style={{ height: 3, background: '#E76D57', borderRadius: 2 }} />
                <span className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant">Future</span>
              </div>
            </div>
          </div>

          {combinedChartData.length === 0 ? (
            <div className="h-[360px] bg-white/10 rounded-lg border border-on-secondary-fixed/5 flex items-center justify-center text-sm text-on-surface-variant/50">
              No data for the selected filters.
            </div>
          ) : (
            <div className="h-[360px] w-full bg-white/10 rounded-lg border border-on-secondary-fixed/5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData} margin={{ top: 28, right: 20, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(32,19,21,0.05)" vertical={false} />

                  {/* Future forecast shaded region */}
                  {futureStartDate && (
                    <ReferenceArea x1={futureStartDate} fill="#E76D57" fillOpacity={0.05} />
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

                  {/* Future forecast start marker */}
                  {futureStartDate && (
                    <ReferenceLine
                      x={futureStartDate}
                      stroke="#E76D57"
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{
                        value: 'FUTURE FORECAST START',
                        position: 'insideTopRight',
                        fill: '#E76D57',
                        fontSize: 9,
                        fontFamily: '"JetBrains Mono"',
                        offset: 8,
                      }}
                    />
                  )}

                  {/* Actual Sales — carafe solid */}
                  <Line
                    type="monotone"
                    dataKey="Actual"
                    name="Actual Sales"
                    stroke="#56382D"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                  />
                  {/* Backtested Ensemble — salmon dashed */}
                  <Line
                    type="monotone"
                    dataKey="Backtest"
                    name="Backtested Ensemble"
                    stroke="#E76D57"
                    strokeWidth={2.5}
                    strokeDasharray="8 4"
                    dot={false}
                    connectNulls={false}
                  />
                  {/* Future Ensemble — salmon solid */}
                  <Line
                    type="monotone"
                    dataKey="Future"
                    name="Future Ensemble"
                    stroke="#E76D57"
                    strokeWidth={3.5}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right column: Forecast Comparison + Backtest Accuracy (4/12) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

          {/* Forecast Comparison */}
          <div className="glass-card p-6 rounded-2xl flex flex-col flex-1">
            <div className="mb-4">
              <h3 className="text-[16px] font-semibold leading-6 mb-1">Forecast Comparison</h3>
              <p className="text-on-surface-variant/70 text-xs">Variance across model architectures</p>
            </div>

            {modelChartData.length > 0 ? (
              <div className="mb-3" style={{ height: 150 }}>
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
                      <Line key={m} type="monotone" dataKey={m} stroke="#56382D"
                        strokeWidth={1} strokeOpacity={0.22} dot={false} />
                    ))}
                    <Line type="monotone" dataKey="Ensemble" stroke="#E76D57"
                      strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[150px] flex items-center justify-center text-xs text-on-surface-variant/40 mb-3">
                No forecast data
              </div>
            )}

            <div className="space-y-1.5 flex-1">
              {modelForecastAvg.length === 0 ? (
                <p className="text-xs text-on-surface-variant/50 text-center py-4">No forecast data</p>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant/50 mb-2">
                    Avg Forecast (units/week)
                  </p>
                  {modelForecastAvg.map((m, i) => (
                    <div
                      key={m.model}
                      className={[
                        'flex justify-between items-center p-2.5 rounded-lg text-sm',
                        i === 0
                          ? 'bg-primary-container/10 border border-primary/20'
                          : 'px-2.5 py-1 text-on-surface-variant/60',
                      ].join(' ')}
                    >
                      <span className={`flex items-center gap-2 ${i === 0 ? 'font-bold text-primary' : ''}`}>
                        <span className={`w-2 h-2 rounded-full inline-block ${i === 0 ? 'bg-primary' : 'bg-on-surface-variant/30'}`} />
                        {m.model}
                      </span>
                      <span className={`font-mono text-[11px] font-medium tracking-wide ${i === 0 ? 'text-on-surface' : ''}`}>
                        {fmtNum(m.avg)}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Backtest Accuracy panel */}
          <div className="glass-card p-6 rounded-2xl" style={{ borderLeft: '4px solid #E76D57' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>fact_check</span>
              <h3 className="text-[16px] font-semibold leading-6">Backtest Accuracy</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/30 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant/60 mb-1">Avg Abs Error</p>
                <p className="text-[20px] font-bold text-on-surface font-mono">{fmtNum(backtestMAE)}</p>
                <p className="text-[10px] text-on-surface-variant/50 mt-0.5">units</p>
              </div>
              <div className="bg-white/30 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant/60 mb-1">Avg % Error</p>
                <p className="text-[20px] font-bold text-on-surface font-mono">{fmtNum(backtestMAPE)}%</p>
                <p className={`text-[10px] mt-0.5 ${accuracyLabel.cls}`}>{accuracyLabel.text}</p>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant/60 leading-relaxed">
              The backtest compares the model's predictions against the last 8 weeks of known actual sales.
              Lower MAE and MAPE indicate a more reliable forecast.
            </p>
          </div>
        </div>
      </section>

      {/* ── Forecast Output Details table ──────────────── */}
      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-on-secondary-fixed/5 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h3 className="text-[18px] font-semibold leading-6 mb-1">Forecast Output Details</h3>
            <p className="text-on-surface-variant/70 text-xs">Future ensemble forecast values by date</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" style={{ fontSize: 16 }}>
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

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container/30">
              <tr>
                {['Store ID', 'Product ID', 'Frequency', 'Forecast Date', 'Ensemble Value', 'Status'].map((col) => (
                  <th key={col} className="px-8 py-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60 whitespace-nowrap">
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
                    <tr key={i} className="hover:bg-primary-container/5 transition-colors">
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">{row.Store_id}</td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">{row.Product_id}</td>
                      <td className="px-8 py-4 text-sm text-on-surface-variant/70">{row.Forecast_Frequency}</td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">{fmtDateShort(row.Forecast_Date)}</td>
                      <td className="px-8 py-4 font-bold text-primary">{fmtNum(row.Enhanced_Ensemble_Forecast)}</td>
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

      {/* ── Backtest Details table ──────────────────────── */}
      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-on-secondary-fixed/5 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h3 className="text-[18px] font-semibold leading-6 mb-1">Backtest Details</h3>
            <p className="text-on-surface-variant/70 text-xs">
              Ensemble predictions vs actual sales over the 8-week holdout window
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-secondary-container/40 text-on-secondary-container">
              {filteredBacktest.length} rows
            </span>
          </div>
        </div>

        <div className="overflow-x-auto scroll-hide">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container/30">
              <tr>
                {['Backtest Date', 'Actual Sales', 'Ensemble Backtest', 'Absolute Error', '% Error'].map((col) => (
                  <th key={col} className="px-8 py-4 text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant/60 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-on-secondary-fixed/5">
              {btPageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-sm text-on-surface-variant/50">
                    No backtest data for the selected filters.
                  </td>
                </tr>
              ) : (
                btPageRows.map((row, i) => {
                  const pctErr = row.Ensemble_Percent_Error || 0
                  const errCls = pctErr < 15 ? 'text-tertiary' : pctErr < 25 ? 'text-secondary' : 'text-error'
                  return (
                    <tr key={i} className="hover:bg-primary-container/5 transition-colors">
                      <td className="px-8 py-4 font-mono text-[12px] font-medium tracking-wide text-on-surface">
                        {fmtDateShort(row.Backtest_Date)}
                      </td>
                      <td className="px-8 py-4 font-mono text-[12px] font-bold text-on-surface">
                        {fmtNum(row.Actual_Sales)}
                      </td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium text-primary">
                        {fmtNum(row.Enhanced_Ensemble_Backtest)}
                      </td>
                      <td className="px-8 py-4 font-mono text-[12px] font-medium text-on-surface-variant">
                        {fmtNum(row.Ensemble_Absolute_Error)}
                      </td>
                      <td className={`px-8 py-4 font-mono text-[12px] font-bold ${errCls}`}>
                        {fmtNum(pctErr)}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-6 bg-surface-container/20 border-t border-on-secondary-fixed/5 flex justify-between items-center">
          <span className="text-xs text-on-surface-variant/60">
            Showing {btPageRows.length} of {backtestTableData.length} backtest intervals
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setBtPage((p) => Math.max(1, p - 1))}
              disabled={safeBtPage === 1}
              className="p-2 rounded-lg border border-on-secondary-fixed/5 hover:bg-white/40 disabled:opacity-20 transition-all"
            >
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>chevron_left</span>
            </button>
            <button
              onClick={() => setBtPage((p) => Math.min(btTotalPages, p + 1))}
              disabled={safeBtPage === btTotalPages}
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
