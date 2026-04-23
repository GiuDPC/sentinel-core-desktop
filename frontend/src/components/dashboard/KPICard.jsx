/**
 * Tarjeta KPI reutilizable para dashboards.
 * @param {Object} props
 * @param {string} props.title — Título del KPI
 * @param {string|number} props.value — Valor principal
 * @param {string} [props.subtitle] — Texto secundario
 * @param {string} [props.trend] — Indicador de tendencia ('up' | 'down' | 'neutral')
 * @param {string} [props.trendValue] — Valor de la tendencia (ej: '+12%')
 * @param {string} [props.icon] — Emoji o ícono
 * @param {string} [props.color] — Color accent: 'blue' | 'green' | 'yellow' | 'red'
 */
export default function KPICard({ title, value, subtitle, trend, trendValue, icon, color = 'blue' }) {
  const colorMap = {
    blue: 'border-accent bg-accent-light text-accent',
    green: 'border-success bg-success/10 text-success',
    yellow: 'border-warning bg-warning/10 text-warning',
    red: 'border-danger bg-danger/10 text-danger',
  }

  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-text-secondary',
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }

  return (
    <div className={`bg-surface rounded-xl border-l-4 ${colorMap[color]?.split(' ')[0]} p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary font-medium">{title}</p>
          <p className="text-3xl font-bold text-text-primary mt-1 font-display">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-2">{subtitle}</p>
          )}
          {trend && trendValue && (
            <p className={`text-xs mt-1 font-medium ${trendColors[trend]}`}>
              {trendIcons[trend]} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <span className={`text-2xl p-2 rounded-lg ${colorMap[color]?.split(' ').slice(1).join(' ')}`}>
            {icon}
          </span>
        )}
      </div>
    </div>
  )
}
