// Placeholder — full implementation coming in next phase.
// Will use: dashboard_model_metrics.csv

export default function ModelPerformance() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="glass-card rounded-xl p-12 text-center max-w-lg">
        <span
          className="material-symbols-outlined text-tertiary mb-4 block"
          style={{ fontSize: 48 }}
        >
          query_stats
        </span>
        <h2 className="text-[24px] font-semibold tracking-tight text-on-surface mb-2">
          Model Performance
        </h2>
        <p className="text-sm text-on-surface-variant/70 leading-relaxed">
          This tab will show MAE / RMSE / MAPE bar charts, best-model rankings,
          and the full model metrics table — driven by{' '}
          <span className="font-mono text-[12px] text-secondary">
            dashboard_model_metrics.csv
          </span>
          .
        </p>
        <div className="mt-6 inline-flex items-center gap-2 bg-tertiary/10 text-tertiary px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.05em] uppercase">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
          Implementation coming next
        </div>
      </div>
    </div>
  )
}
