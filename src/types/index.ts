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

export interface BacktestOutput {
  Store_id: string
  Product_id: string
  Forecast_Frequency: string
  Backtest_Date: string
  Actual_Sales: number
  Naive_Backtest: number
  Moving_Average_Backtest: number
  Seasonal_Naive_Backtest: number
  Trend_Backtest: number
  Linear_Regression_Backtest: number
  Random_Forest_Backtest: number
  Enhanced_Ensemble_Backtest: number
  Ensemble_Absolute_Error: number
  Ensemble_Percent_Error: number
  Backtest_Horizon: number
  Run_Timestamp: string
}
