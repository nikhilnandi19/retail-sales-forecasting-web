import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import KPICard from '../components/KPICard'
import DataTable from '../components/DataTable'
import type { ColDef } from '../components/DataTable'
import type { SalesOverview } from '../types'
import { fmtSales, fmtNum, fmtDate, fmtDateShort, unique } from '../utils/formatters'

interface Props { data: SalesOverview[] }

const TOOLTIP_STYLE = {
  background: '#1a2035',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#dde4f0',
  fontSize: 13,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ color: '#8b96b0', marginBottom: 4, fontSize: 12 }}>{label}</div>
      <div style={{ color: '#38bdf8' }}>
        {fmtSales(payload[0].value)} total sales
      </div>
    </div>
  )
}

const COLS: ColDef<SalesOverview>[] = [
  { key: 'Store_id', label: 'Store ID' },
  { key: 'Product_id', label: 'Product ID' },
  { key: 'total_sales', label: 'Total Sales', align: 'right', format: (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  { key: 'avg_daily_sales', label: 'Avg Daily Sales', align: 'right', format: (v) => fmtNum(Number(v)) },
  { key: 'total_days', label: 'Total Days', align: 'right', dim: true },
  { key: 'start_date', label: 'Start Date', dim: true, format: (v) => fmtDate(String(v)) },
  { key: 'end_date', label: 'End Date', dim: true, format: (v) => fmtDate(String(v)) },
]

export default function Overview({ data }: Props) {
  const [storeFilter, setStoreFilter] = useState('All')
  const [productFilter, setProductFilter] = useState('All')

  const stores = useMemo(() => ['All', ...unique(data.map((d) => d.Store_id)).sort()], [data])
  const products = useMemo(() => ['All', ...unique(data.map((d) => d.Product_id)).sort()], [data])

  const filtered = useMemo(() => {
    return data.filter(
      (d) =>
        (storeFilter === 'All' || d.Store_id === storeFilter) &&
        (productFilter === 'All' || d.Product_id === productFilter)
    )
  }, [data, storeFilter, productFilter])

  const totalSales = filtered.reduce((s, d) => s + (d.total_sales || 0), 0)
  const avgDaily =
    filtered.length > 0
      ? filtered.reduce((s, d) => s + (d.avg_daily_sales || 0), 0) / filtered.length
      : 0

  const minDate = filtered.length > 0
    ? filtered.reduce((mn, d) => (fmtDateShort(d.start_date) < mn ? fmtDateShort(d.start_date) : mn), fmtDateShort(filtered[0].start_date))
    : '—'
  const maxDate = filtered.length > 0
    ? filtered.reduce((mx, d) => (fmtDateShort(d.end_date) > mx ? fmtDateShort(d.end_date) : mx), fmtDateShort(filtered[0].end_date))
    : '—'

  const top10 = useMemo(
    () =>
      [...filtered]
        .sort((a, b) => b.total_sales - a.total_sales)
        .slice(0, 10)
        .map((d) => ({ name: `${d.Store_id} - ${d.Product_id}`, value: d.total_sales })),
    [filtered]
  )

  return (
    <div className="page-content">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard label="Total Sales" value={fmtSales(totalSales)} />
        <KPICard label="Avg Daily Sales" value={fmtNum(avgDaily)} />
        <KPICard label="Store-Product Pairs" value={filtered.length.toString()} />
        <KPICard label="Dataset Date Range" value={`${minDate} to ${maxDate}`} />
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
      </div>

      {/* Chart + Table */}
      <div className="two-col" style={{ alignItems: 'start' }}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-title">Top Store-Product Pairs by Total Sales</div>
          <ResponsiveContainer width="100%" height={top10.length * 46 + 40}>
            <BarChart
              layout="vertical"
              data={top10}
              margin={{ top: 0, right: 20, left: 10, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number"
                tickFormatter={(v: number) => fmtSales(v)}
                tick={{ fill: '#8b96b0', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                label={{ value: 'Total Sales', position: 'insideBottom', offset: -4, fill: '#8b96b0', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: '#8b96b0', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {top10.map((_, i) => (
                  <Cell key={i} fill="#38bdf8" fillOpacity={1 - i * 0.055} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <DataTable<SalesOverview>
          title="Sales Overview Table"
          columns={COLS}
          data={filtered}
          defaultSortKey="total_sales"
          defaultSortDir="desc"
          pageSize={12}
        />
      </div>
    </div>
  )
}
