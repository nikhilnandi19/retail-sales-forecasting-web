import { useEffect, useState } from 'react'
import Overview from './pages/Overview'
import ForecastResults from './pages/ForecastResults'
import ModelPerformance from './pages/ModelPerformance'
import { loadSalesOverview, loadForecastOutput, loadModelMetrics, loadActualVsForecast } from './utils/csvLoader'
import type { SalesOverview, ForecastOutput, ModelMetrics, ActualVsForecast } from './types'

const TABS = ['Overview', 'Forecast Results', 'Model Performance']

export default function App() {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<SalesOverview[]>([])
  const [forecastData, setForecastData] = useState<ForecastOutput[]>([])
  const [metricsData, setMetricsData] = useState<ModelMetrics[]>([])
  const [avfData, setAvfData] = useState<ActualVsForecast[]>([])

  useEffect(() => {
    Promise.all([
      loadSalesOverview(),
      loadForecastOutput(),
      loadModelMetrics(),
      loadActualVsForecast(),
    ]).then(([sales, forecast, metrics, avf]) => {
      setSalesData(sales)
      setForecastData(forecast)
      setMetricsData(metrics)
      setAvfData(avf)
      setLoading(false)
    })
  }, [])

  return (
    <div>
      {/* Header */}
      <header className="app-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <h1>Retail Sales Forecasting Dashboard</h1>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
          Task 4 · Databricks Forecasting Pipeline
        </span>
      </header>

      {/* Tabs */}
      <nav className="tab-bar">
        {TABS.map((name, i) => (
          <button
            key={name}
            className={`tab-btn ${tab === i ? 'active' : ''}`}
            onClick={() => setTab(i)}
          >
            {name}
          </button>
        ))}
      </nav>

      {/* Content */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <span>Loading dashboard data…</span>
        </div>
      ) : (
        <>
          {tab === 0 && <Overview data={salesData} />}
          {tab === 1 && <ForecastResults forecastData={forecastData} avfData={avfData} />}
          {tab === 2 && <ModelPerformance metricsData={metricsData} />}
        </>
      )}
    </div>
  )
}
