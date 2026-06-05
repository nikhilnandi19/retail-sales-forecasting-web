// Stitch "Warm Glass Analytics" KPI card
interface Props {
  /** Material Symbol icon name */
  icon: string
  /** Tailwind bg class for the icon pill, e.g. "bg-primary-container/10" */
  iconBg: string
  /** Tailwind text class for the icon color, e.g. "text-primary" */
  iconColor: string
  /** Optional small badge text (e.g. "+12.4%") */
  badge?: string
  label: string
  value: string
  unit?: string
  description: string
}

export default function KPICard({ icon, iconBg, iconColor, badge, label, value, unit, description }: Props) {
  return (
    <div className="glass-card p-6 rounded-xl hover:border-primary-container/40 transition-all group cursor-default">
      {/* Icon row */}
      <div className="flex justify-between items-start mb-4">
        <span
          className={`p-2 rounded-lg material-symbols-outlined ${iconBg} ${iconColor}`}
          style={{ fontSize: 22 }}
        >
          {icon}
        </span>
        {badge && (
          <span className="font-mono text-[11px] font-medium tracking-wide text-primary bg-primary-container/10 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>

      {/* Label */}
      <h3 className="text-[11px] font-bold tracking-[0.05em] uppercase text-on-surface-variant mb-1">
        {label}
      </h3>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-on-surface-variant/60">{unit}</span>
        )}
      </div>

      {/* Description */}
      <p className="mt-4 text-sm text-on-surface-variant/70 leading-snug">
        {description}
      </p>
    </div>
  )
}
