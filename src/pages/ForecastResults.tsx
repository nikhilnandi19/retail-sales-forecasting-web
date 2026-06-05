// Placeholder — full implementation coming in next phase.
// Will use: dashboard_forecast_output.csv + dashboard_actual_vs_forecast.csv

export default function ForecastResults() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="glass-card rounded-xl p-12 text-center max-w-lg">
        <span
          className="material-symbols-outlined text-primary-container mb-4 block"
          style={{ fontSize: 48 }}
        >
          trending_up
        </span>
        <h2 className="text-[24px] font-semibold tracking-tight text-on-surface mb-2">
          Forecast Results
        </h2>
        <p className="text-sm text-on-surface-variant/70 leading-relaxed">
          This tab will show the Actual vs Forecast line chart, model comparison
          chart, and forecast output table — driven by{' '}
          <span className="font-mono text-[12px] text-secondary">
            dashboard_forecast_output.csv
          </span>{' '}
          and{' '}
          <span className="font-mono text-[12px] text-secondary">
            dashboard_actual_vs_forecast.csv
          </span>
          .
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-primary-container/10 text-primary px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.05em] uppercase">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
          Implementation coming next
        </div>
      </div>
    </div>
  )
}
