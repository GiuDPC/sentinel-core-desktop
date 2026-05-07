import { useNavigate } from 'react-router-dom'
import { Zap, Flame, Droplets, WifiOff, ArrowRight } from 'lucide-react'
import { motion as Motion } from 'framer-motion'

const QUICK_ACTION_ITEMS = [
  {
    label: 'Corte Eléctrico',
    description: 'Fallas de luz o cortocircuitos',
    category: 'Corte Electrico',
    icon: Zap,
    color: 'amber',
  },
  {
    label: 'Incendio',
    description: 'Emergencias de fuego o humo',
    category: 'Incendio / Emergencia',
    icon: Flame,
    color: 'red',
  },
  {
    label: 'Fuga de Agua',
    description: 'Filtraciones o rotura de caños',
    category: 'Fuga de Agua',
    icon: Droplets,
    color: 'cyan',
  },
  {
    label: 'Falla de Red',
    description: 'Problemas de internet o WiFi',
    category: 'Falla de Red / Internet',
    icon: WifiOff,
    color: 'indigo',
  },
]

export default function QuickActions() {
  const navigate = useNavigate()

  function handleClick(category) {
    navigate('/requester/create-ticket', { state: { preselectedCategory: category } })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-display">
          Acciones Rápidas
        </h3>
      </div>

      <div className="flex flex-col gap-2.5 flex-1">
        {QUICK_ACTION_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Motion.button
              key={item.label}
              onClick={() => handleClick(item.category)}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group flex items-center gap-4 p-3.5 rounded-xl border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/30 transition-colors cursor-pointer relative overflow-hidden"
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 text-slate-600 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900">
                <Icon size={20} strokeWidth={2} />
              </div>
              
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-blue-900 transition-colors">
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1.5 uppercase tracking-wider">
                  {item.description}
                </p>
              </div>

              <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <ArrowRight size={12} className="text-slate-400" />
              </div>
            </Motion.button>
          )
        })}
      </div>
    </div>
  )
}