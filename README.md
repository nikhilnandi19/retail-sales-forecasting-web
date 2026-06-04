# Retail Sales Forecasting Dashboard

A standalone web dashboard that recreates the Databricks retail sales forecasting pipeline output as an interactive frontend application. No backend, no API — purely CSV-driven.

## Project Overview

This is **Task 4** of the Datacrew internship: *Forecasting in Databricks*. The goal was to build a retail sales forecasting pipeline on Databricks and surface the results in a polished dashboard.

## Dataset

**Store Item Demand Forecasting Dataset** — daily sales data for 10 stores × 50 products from 2013 to 2017.

| CSV File | Description |
|---|---|
| `dashboard_sales_overview.csv` | Per store-product summary stats |
| `dashboard_forecast_output.csv` | Forecasts from all models |
| `dashboard_model_metrics.csv` | MAE, RMSE, MAPE per model |
| `dashboard_actual_vs_forecast.csv` | Actual sales + best-model forecast |

## Databricks Pipeline Summary

1. **Bronze layer** — raw CSV upload to Delta table
2. **Silver layer** — cleaned data, date features, lag features
3. **Aggregation** — weekly and monthly sales rollups
4. **Forecasting models trained:**
   - Naive Forecast
   - Moving Average Forecast
   - Seasonal Naive Forecast
   - Trend Forecast
   - Spark Linear Regression
   - Spark Random Forest
   - Enhanced Ensemble (weighted blend)
5. **Metrics computed** — MAE, RMSE, MAPE against a held-out test window
6. **Delta tables** — forecast output and model metrics saved as dashboard-ready tables
7. **Dashboard** — three-tab Databricks dashboard, now reproduced here

## Dashboard Pages

### Overview
Key metrics (total sales, avg daily sales, store-product pairs, date range), top-10 bar chart, full sortable/paginated sales table. Filter by store and product.

### Forecast Results
Forecast KPIs, actual vs enhanced-ensemble line chart, multi-model comparison line chart, full forecast output table. Filter by store, product, and frequency.

### Model Performance
Best-model card, MAE/RMSE/MAPE horizontal bar charts (sorted ascending), full metrics table. Filter by store, product, and frequency.

## Tech Stack

- **Vite** — build tool
- **React 18** — UI framework
- **TypeScript** — type safety
- **Tailwind CSS** — utility-first styling
- **Recharts** — charts
- **PapaParse** — CSV parsing

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
```

The app opens at **http://localhost:5173**.

CSV files are served from `public/data/` — no backend needed.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```
