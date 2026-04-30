/**
 * Tarjeta KPI profesional — sin emojis, con indicador circular.
 * Diseño basado en los mockups de referencia.
 */
export default function KPICard({ title, value, subtitle, trend, trendValue, color = 'blue', icon: Icon }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100' },
    yellow: { bg: 'bg-amber-50/50', text: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-rose-50/50', text: 'text-rose-600', border: 'border-rose-100' },
  }

  const trendColors = { up: 'text-emerald-600', down: 'text-rose-600', neutral: 'text-slate-500' }
  const c = colorMap[color] || colorMap.blue

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
          {Icon ? <Icon size={24} strokeWidth={1.5} /> : <div className="w-2 h-2 rounded-full bg-current" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{title}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <h3 className="text-xl font-bold text-blue-950 font-display tabular-nums leading-none">{value}</h3>
            {trend && trendValue && (
              <span className={`text-[10px] font-bold ${trendColors[trend]} flex items-center gap-0.5`}>
                {trend === 'up' ? '↑' : '↓'}{trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
