/**
 * Tarjeta KPI profesional — sin emojis, con indicador circular.
 * Diseño basado en los mockups de referencia.
 */
export default function KPICard({ title, value, subtitle, trend, trendValue, color = 'blue' }) {
  const colorMap = {
    blue: { dot: 'bg-accent', ring: 'ring-accent/20', border: 'border-accent/20' },
    green: { dot: 'bg-success', ring: 'ring-success/20', border: 'border-success/20' },
    yellow: { dot: 'bg-warning', ring: 'ring-warning/20', border: 'border-warning/20' },
    red: { dot: 'bg-danger', ring: 'ring-danger/20', border: 'border-danger/20' },
  }

  const trendColors = { up: 'text-success', down: 'text-danger', neutral: 'text-text-secondary' }
  const trendArrows = { up: '+', down: '-', neutral: '' }

  const c = colorMap[color] || colorMap.blue

  return (
    <div className={`bg-surface rounded-xl border ${c.border} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-2 font-display">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-2">{subtitle}</p>
          )}
          {trend && trendValue && (
            <p className={`text-xs mt-1 font-medium ${trendColors[trend]}`}>
              {trendArrows[trend]}{trendValue}
            </p>
          )}
        </div>
        <div className={`w-3 h-3 rounded-full ${c.dot} ring-4 ${c.ring} mt-1`} />
      </div>
    </div>
  )
}
