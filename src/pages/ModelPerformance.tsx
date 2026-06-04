import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import type { ColDef } from '../components/DataTable'
import type { ModelMetrics } from '../types'
import { fmtNum, fmtDateShort, unique } from '../utils/formatters'

interface Props { metricsData: ModelMetrics[] }

const TOOLTIP_STYLE = {
  background: '#1a2035',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#dde4f0',
  fontSize: 13,
}

const BAR_COLORS = [
  '#38bdf8', '#4f8ef7', '#34d399', '#facc15', '#fb923c', '#f87171', '#a78bfa',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricTooltip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ color: '#8b96b0', marginBottom: 4, fontSize: 12 }}>{label}</div>
      <div style={{ color: '#38bdf8' }}>
        {fmtNum(payload[0].value)} {unit ?? ''}
      </div>
    </div>
  )
}

const METRICS_COLS: ColDef<ModelMetrics>[] = [
  { key: 'Model', label: 'Model' },
  { key: 'MAE', label: 'MAE', align: 'right', format: (v) => fmtNum(Number(v)) },
  { key: 'RMSE', label: 'RMSE', align: 'right', format: (v) => fmtNum(Number(v)) },
  { key: 'MAPE', label: 'MAPE (%)', align: 'right', format: (v) => fmtNum(Number(v)) },
  { key: 'Store_id', label: 'Store ID', dim: true },
  { key: 'Product_id', label: 'Product ID', dim: true },
  { key: 'Forecast_Frequency', label: 'Frequency', dim: true },
  { key: 'Forecast_Horizon', label: 'Horizon', align: 'right', dim: true },
  { key: 'Run_Timestamp', label: 'Run Timestamp', dim: true, format: (v) => fmtDateShort(String(v)) },
]

function HBarChart({
  data,
  metricKey,
  unit,
}: {
  data: { name: string; value: number }[]
  metricKey: string
  unit?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={data.length * 50 + 40}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 24, left: 10, bottom: 8 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          type="number"
          tick={{ fill: '#8b96b0', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
          label={{ value: metricKey, position: 'insideBottom', offset: -4, fill: '#8b96b0', fontSize: 11 }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fill: '#8b96b0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<MetricTooltip unit={unit} />}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {data.map((_, i) => (
            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function ModelPerformance({ metricsData }: Props) {
  const [storeFilter, setStoreFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')
  const [freqFilter, setFreqFilter] = useState('All')

  const stores = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Store_id)).sort()], [metricsData])
  const products = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Product_id)).sort()], [metricsData])
  const freqs = useMemo(() => ['All', ...unique(metricsData.map((d) => d.Forecast_Frequency)).sort()], [metricsData])

  const filtered = useMemo(
    () =>
      metricsData.filter(
        (d) =>
          (storeFilter === 'All' || d.Store_id === storeFilter) &&
          (productFilter === 'All' || d.Product_id === productFilter) &&
          (freqFilter === 'All' || d.Forecast_Frequency === freqFilter)
      ),
    [metricsData, storeFilter, productFilter, freqFilter]
  )

  const sortedByMAE = useMemo(() => [...filtered].sort((a, b) => a.MAE - b.MAE), [filtered])

  const bestMAE = sortedByMAE.length > 0 ? sortedByMAE[0].MAE : 0
  const bestRMSE =
    filtered.length > 0
      ? Math.min(...filtered.map((d) => d.RMSE))
      : 0
  const maxHorizon =
    filtered.length > 0
      ? Math.max(...filtered.map((d) => d.Forecast_Horizon))
      : 0
  const bestModelName = sortedByMAE.length > 0 ? sortedByMAE[0].Model : '—'
  const top3 = sortedByMAE.slice(0, 3)

  const maeData = sortedByMAE.map((d) => ({ name: d.Model, value: d.MAE }))
  const rmseData = [...filtered].sort((a, b) => a.RMSE - b.RMSE).map((d) => ({ name: d.Model, value: d.RMSE }))
  const mapeData = [...filtered].sort((a, b) => a.MAPE - b.MAPE).map((d) => ({ name: d.Model, value: d.MAPE }))

  return (
    <div className="page-content">
      {/* KPI Cards row — 5 cols: best-model spans 2, then 3 single KPI cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {/* Best Model card spans 2 columns */}
        <div className="best-model-card" style={{ gridColumn: 'span 2' }}>
          <div className="kpi-label">Best Models by MAE</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="kpi-value" style={{ fontSize: 28 }}>{bestModelName}</span>
            <span className="badge">Lowest MAE</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{ cursor: 'default' }}>Model</th>
                  <th style={{ cursor: 'default', textAlign: 'right' }}>MAE</th>
                </tr>
              </thead>
              <tbody>
                {top3.map((row) => (
                  <tr key={row.Model}>
                    <td>{row.Model}</td>
                    <td style={{ textAlign: 'right', color: row.Model === bestModelName ? 'var(--accent)' : 'var(--text)' }}>
                      {fmtNum(row.MAE)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <KPICard label="Forecast Horizon" value={maxHorizon.toString()} />
        <KPICard label="Lowest MAE" value={fmtNum(bestMAE)} />
        <KPICard label="Lowest RMSE" value={fmtNum(bestRMSE)} />
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

      {/* Bar charts — 2 col row then 1 full */}
      <div className="two-col" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="card-title">Model Comparison by MAE</div>
          <HBarChart data={maeData} metricKey="MAE" />
        </div>
        <div className="card">
          <div className="card-title">Model Comparison by RMSE</div>
          <HBarChart data={rmseData} metricKey="RMSE" />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Model Comparison by MAPE (%)</div>
        <HBarChart data={mapeData} metricKey="MAPE" unit="%" />
      </div>

      {/* Full metrics table */}
      <DataTable<ModelMetrics>
        title="Full Model Metrics Table"
        columns={METRICS_COLS}
        data={filtered}
        defaultSortKey="MAE"
        defaultSortDir="asc"
        pageSize={15}
      />
    </div>
  )
}
