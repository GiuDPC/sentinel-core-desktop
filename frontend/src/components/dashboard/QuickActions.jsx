import { useNavigate } from 'react-router-dom'

const QUICK_ACTION_ITEMS = [
  { label: 'Corte Eléctrico', icon: '⚡', category: 'Corte Eléctrico', color: 'bg-yellow-50 border-warning hover:bg-yellow-100' },
  { label: 'Falla de Red', icon: '🌐', category: 'Falla de Red / Internet', color: 'bg-blue-50 border-accent hover:bg-blue-100' },
  { label: 'Fuga de Agua', icon: '💧', category: 'Fuga de Agua', color: 'bg-cyan-50 border-cyan-400 hover:bg-cyan-100' },
  { label: 'Infraestructura', icon: '🏗', category: 'Infraestructura Física', color: 'bg-orange-50 border-orange-400 hover:bg-orange-100' },
]

/**
 * Tarjetas de acceso rápido para crear reportes por categoría.
 */
export default function QuickActions() {
  const navigate = useNavigate()

  function handleClick(category) {
    navigate('/requester/create-ticket', { state: { preselectedCategory: category } })
  }

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
        Acciones Rápidas
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTION_ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => handleClick(item.category)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${item.color}`}
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="text-sm font-medium text-text-primary">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
