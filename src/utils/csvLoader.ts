import Papa from 'papaparse'
import type { SalesOverview, ForecastOutput, ModelMetrics, ActualVsForecast, BacktestOutput } from '../types'

function loadCSV<T>(path: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(path, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    })
  })
}

export const loadSalesOverview = () =>
  loadCSV<SalesOverview>('/data/dashboard_sales_overview.csv')

export const loadForecastOutput = () =>
  loadCSV<ForecastOutput>('/data/dashboard_forecast_output.csv')

export const loadModelMetrics = () =>
  loadCSV<ModelMetrics>('/data/dashboard_model_metrics.csv')

export const loadActualVsForecast = () =>
  loadCSV<ActualVsForecast>('/data/dashboard_actual_vs_forecast.csv')

export const loadBacktestOutput = () =>
  loadCSV<BacktestOutput>('/data/dashboard_backtest_output.csv')
