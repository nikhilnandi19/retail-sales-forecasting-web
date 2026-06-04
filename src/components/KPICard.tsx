interface Props {
  label: string
  value: string
  wide?: boolean
}

export default function KPICard({ label, value, wide }: Props) {
  const isLong = value.length > 12
  const isVeryLong = value.length > 22

  return (
    <div className="kpi-card" style={wide ? { gridColumn: 'span 2' } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${isVeryLong ? 'xs' : isLong ? 'sm' : ''}`}>{value}</div>
    </div>
  )
}
