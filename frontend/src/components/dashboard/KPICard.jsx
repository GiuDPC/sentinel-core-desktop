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
            <div className={`flex items-center gap-1 mt-1 ${trendColors[trend]}`}> 
              {trend === 'up' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25m0-11.25h-11.25" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25h-11.25" />
                </svg>
              )}
              <span className="text-xs font-bold">{trendValue}</span>
              <span className="text-xs">vs mes anterior</span>
            </div>
          )}
        </div>
        <div className={`w-3 h-3 rounded-full ${c.dot} ring-4 ${c.ring} mt-1`} />
      </div>
    </div>
  )
}
