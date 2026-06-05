export interface SalesOverview {
  Store_id: string
  Product_id: string
  total_days: number
  start_date: string
  end_date: string
  avg_daily_sales: number
  total_sales: number
}

export interface ForecastOutput {
  Store_id: string
  Product_id: string
  Forecast_Frequency: string
  Forecast_Date: string
  Naive_Forecast: number
  Moving_Average_Forecast: number
  Seasonal_Naive_Forecast: number
  Trend_Forecast: number
  Linear_Regression_Forecast: number
  Random_Forest_Forecast: number
  Enhanced_Ensemble_Forecast: number
}

export interface ModelMetrics {
  Model: string
  MAE: number
  RMSE: number
  MAPE: number
  Store_id: string
  Product_id: string
  Forecast_Frequency: string
  Forecast_Horizon: number
  Run_Timestamp: string
}

export interface ActualVsForecast {
  Store_id: string
  Product_id: string
  Forecast_Frequency: string
  Date: string
  Sales: number
  Type: string
  Forecast_Method: string
}
