import { motion as Motion } from 'framer-motion'

export default function KPICard({ title, value, subtitle, trend, trendValue, icon: Icon }) {
  const trendColors = {
    up: 'text-emerald-600 bg-emerald-50',
    down: 'text-rose-600 bg-rose-50',
    neutral: 'text-slate-500 bg-slate-50'
  }

  return (
    <Motion.div 
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full justify-between group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-3xl font-bold text-slate-900 font-display tabular-nums leading-none">{value}</h3>
            {trend && trendValue && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendColors[trend]} flex items-center gap-0.5 shrink-0`}>
                {trend === 'up' ? '↑' : '↓'}{trendValue}
              </span>
            )}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-slate-100 transition-colors shrink-0">
          {Icon ? <Icon size={18} className="text-slate-500" strokeWidth={2} /> : <div className="w-2 h-2 rounded-full bg-slate-400" />}
        </div>
      </div>
      <div className="mt-3">
        <p className={`text-[11px] font-medium ${subtitle ? 'text-slate-500' : 'text-transparent select-none'}`}>
          {subtitle || '-'}
        </p>
      </div>
    </Motion.div>
  )
}