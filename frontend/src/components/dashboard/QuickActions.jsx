import { useNavigate } from 'react-router-dom'

const QUICK_ACTION_ITEMS = [
  {
    label: 'Corte Electrico',
    description: 'Cortocircuitos o iluminacion',
    category: 'Corte Electrico',
    color: 'bg-amber-50 border-amber-200 hover:border-amber-300',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    label: 'Incendio',
    description: 'Emergencias de fuego o humo',
    category: 'Incendio / Emergencia',
    color: 'bg-red-50 border-red-200 hover:border-red-300',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    label: 'Fuga de Agua',
    description: 'Tuberias o filtraciones',
    category: 'Fuga de Agua',
    color: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    label: 'Falla de Red',
    description: 'Problemas de internet o WiFi',
    category: 'Falla de Red / Internet',
    color: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
]

export default function QuickActions() {
  const navigate = useNavigate()

  function handleClick(category) {
    navigate('/requester/create-ticket', { state: { preselectedCategory: category } })
  }

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
        Acciones Rapidas
      </h3>
      <div className="space-y-3">
        {QUICK_ACTION_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => handleClick(item.category)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${item.color}`}
          >
            <div className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}>
              {/* Puedes reemplazar por el verdadero SVG segun tu diseño, aquí solo un placeholder estándar */}
              <svg className={`w-5 h-5 ${item.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              <p className="text-xs text-text-secondary">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
