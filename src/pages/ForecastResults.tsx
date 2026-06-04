import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import type { ColDef } from '../components/DataTable'
import type { ForecastOutput, ActualVsForecast } from '../types'
import { fmtSales, fmtNum, fmtDateShort, fmtDateAxis, unique } from '../utils/formatters'

interface Props {
  forecastData: ForecastOutput[]
  avfData: ActualVsForecast[]
}

const TOOLTIP_STYLE = {
  background: '#1a2035',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#dde4f0',
  fontSize: 13,
}

const MODEL_COLORS: Record<string, string> = {
  Naive: '#38bdf8',
  'Moving Avg': '#facc15',
  'Seasonal Naive': '#34d399',
  Trend: '#f87171',
  'Linear Reg': '#a78bfa',
  'Random Forest': '#f472b6',
  Ensemble: '#4f8ef7',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AvfTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ color: '#8b96b0', marginBottom: 4, fontSize: 12 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {fmtNum(p.value)}
        </div>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ModelTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 220 }}>
      <div style={{ color: '#8b96b0', marginBottom: 6, fontSize: 12 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {fmtNum(p.value)}
        </div>
      ))}
    </div>
  )
}

const FORECAST_COLS: ColDef<ForecastOutput>[] = [
  { key: 'Store_id', label: 'Store ID' },
  { key: 'Product_id', label: 'Product ID' },
  { key: 'Forecast_Frequency', label: 'Frequency', dim: true },
  { key: 'Forecast_Date', label: 'Forecast Date', format: (v) => fmtDateShort(String(v)) },
  { key: 'Enhanced_Ensemble_Forecast', label: 'Enhanced Ensemble', align: 'right', format: (v) => fmtNum(Number(v)) },
  { key: 'Naive_Forecast', label: 'Naive', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
  { key: 'Moving_Average_Forecast', label: 'Moving Avg', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
  { key: 'Seasonal_Naive_Forecast', label: 'Seasonal Naive', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
  { key: 'Trend_Forecast', label: 'Trend', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
  { key: 'Linear_Regression_Forecast', label: 'Linear Reg', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
  { key: 'Random_Forest_Forecast', label: 'Random Forest', align: 'right', dim: true, format: (v) => fmtNum(Number(v)) },
]

export default function ForecastResults({ forecastData, avfData }: Props) {
  const [storeFilter, setStoreFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [freqFilter, setFreqFilter] = useState('All')

  const stores = useMemo(() => ['All', ...unique(forecastData.map((d) => d.Store_id)).sort()], [forecastData])
  const products = useMemo(() => ['All', ...unique(forecastData.map((d) => d.Product_id)).sort()], [forecastData])
  const freqs = useMemo(() => ['All', ...unique(forecastData.map((d) => d.Forecast_Frequency)).sort()], [forecastData])

  const filtered = useMemo(
    () =>
      forecastData.filter(
        (d) =>
          (storeFilter === 'All' || d.Store_id === storeFilter) &&
          (productFilter === 'All' || d.Product_id === productFilter) &&
          (freqFilter === 'All' || d.Forecast_Frequency === freqFilter)
      ),
    [forecastData, storeFilter, productFilter, freqFilter]
  )

  const freq = filtered.length > 0 ? filtered[0].Forecast_Frequency : '—'
  const horizon = filtered.length
  const avgEnsemble =
    filtered.length > 0
      ? filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0) / filtered.length
      : 0
  const totalEnsemble = filtered.reduce((s, d) => s + (d.Enhanced_Ensemble_Forecast || 0), 0)

  // Actual vs forecast line chart data
  const avfChartData = useMemo(() => {
    const actualMap: Record<string, number> = {}
    const forecastMap: Record<string, number> = {}
    avfData.forEach((d) => {
      const key = fmtDateShort(d.Date)
      if (d.Type === 'Actual') actualMap[key] = d.Sales
      else forecastMap[key] = d.Sales
    })
    const allDates = [...new Set(avfData.map((d) => fmtDateShort(d.Date)))].sort()
    return allDates.map((date) => ({
      date,
      Actual: actualMap[date] ?? null,
      Forecast: forecastMap[date] ?? null,
    }))
  }, [avfData])

  // Forecast comparison data
  const modelChartData = useMemo(
    () =>
      filtered.map((d) => ({
        date: fmtDateShort(d.Forecast_Date),
        Naive: d.Naive_Forecast,
        'Moving Avg': d.Moving_Average_Forecast,
        'Seasonal Naive': d.Seasonal_Naive_Forecast,
        Trend: d.Trend_Forecast,
        'Linear Reg': d.Linear_Regression_Forecast,
        'Random Forest': d.Random_Forest_Forecast,
        Ensemble: d.Enhanced_Ensemble_Forecast,
      })),
    [filtered]
  )

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Forecast Frequency" value={freq} />
        <KPICard label="Forecast Horizon" value={horizon.toString()} />
        <KPICard label="Avg Ensemble Forecast" value={fmtNum(avgEnsemble)} />
        <KPICard label="Total Forecasted Sales" value={fmtSales(totalEnsemble)} />
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="filter-group">
          <span className="filter-label">Store Filter</span>
          <select className="filter-select" value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)}>
            {stores.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Product Filter</span>
          <select className="filter-select" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            {products.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">Frequency Filter</span>
          <select className="filter-select" value={freqFilter} onChange={(e) => setFreqFilter(e.target.value)}>
            {freqs.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Two charts */}
      <div className="two-col">
        {/* Actual vs Forecast */}
        <div className="card">
          <div className="card-title">Actual vs Forecast Sales</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={avfChartData} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8b96b0', fontSize: 10 }}
                tickFormatter={(v: string) => fmtDateAxis(v)}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                interval="preserveStartEnd"
                label={{ value: 'Date', position: 'insideBottom', offset: -14, fill: '#8b96b0', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#8b96b0', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                label={{ value: 'Sales', angle: -90, position: 'insideLeft', offset: 10, fill: '#8b96b0', fontSize: 11 }}
              />
              <Tooltip content={<AvfTooltip />} />
              <Legend
                iconType="plainline"
                formatter={(v: string) => <span style={{ fontSize: 12, color: '#8b96b0' }}>{v}</span>}
              />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="Forecast"
                stroke="#facc15"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                strokeDasharray="6 3"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model comparison */}
        <div className="card">
          <div className="card-title">Forecast Comparison by Model</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={modelChartData} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#8b96b0', fontSize: 10 }}
                tickFormatter={(v: string) => fmtDateAxis(v)}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                label={{ value: 'Forecast Date', position: 'insideBottom', offset: -14, fill: '#8b96b0', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: '#8b96b0', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                label={{ value: 'Values', angle: -90, position: 'insideLeft', offset: 10, fill: '#8b96b0', fontSize: 11 }}
              />
              <Tooltip content={<ModelTooltip />} />
              <Legend
                iconType="plainline"
                formatter={(v: string) => <span style={{ fontSize: 11, color: '#8b96b0' }}>{v}</span>}
              />
              {Object.entries(MODEL_COLORS).map(([name, color]) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={color}
                  strokeWidth={name === 'Ensemble' ? 2.5 : 1.5}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Forecast output table */}
      <DataTable<ForecastOutput>
        title="Forecast Output Details"
        columns={FORECAST_COLS}
        data={filtered}
        defaultSortKey="Forecast_Date"
        defaultSortDir="asc"
        pageSize={10}
      />
    </div>
  )
}
