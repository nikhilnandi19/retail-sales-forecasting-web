import AnimatedNumber from './AnimatedNumber'

interface Props {
  icon: string
  iconBg: string
  iconColor: string
  badge?: string
  label: string
  /** Plain text value (non-numeric). Fades on change via React key. */
  value?: string
  /** Numeric value — triggers AnimatedNumber counter instead of static text. */
  rawValue?: number
  decimals?: number
  compact?: boolean
  /** Suffix appended after the animated number (e.g. "%" or "K"). */
  numSuffix?: string
  unit?: string
  description: string
}

export default function KPICard({
  icon, iconBg, iconColor, badge,
  label, value, rawValue, decimals = 2, compact = false, numSuffix = '',
  unit, description,
}: Props) {
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

      {/* Value — animated if rawValue provided, fading text otherwise */}
      <div className="flex items-baseline gap-2">
        {rawValue !== undefined ? (
          <AnimatedNumber
            value={rawValue}
            decimals={decimals}
            compact={compact}
            suffix={numSuffix}
            className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface"
          />
        ) : (
          // key forces remount → CSS animation plays on every value change
          <span
            key={value}
            className="text-[24px] font-semibold leading-8 tracking-tight text-on-surface animate-fade-in"
          >
            {value ?? '—'}
          </span>
        )}
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
