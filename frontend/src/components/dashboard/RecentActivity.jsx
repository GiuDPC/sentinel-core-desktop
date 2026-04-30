import StatusBadge from './StatusBadge'

/**
 * Mini tabla de actividad reciente — últimos 5 tickets.
 * @param {Object} props
 * @param {Array} props.tickets — Array de tickets recientes
 * @param {Function} [props.onViewAll] — Callback para "Ver todo"
 */
export default function RecentActivity({ tickets = [], onViewAll }) {
  if (tickets.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 font-display uppercase tracking-wider">
          Actividad Reciente
        </h3>
        <p className="text-sm text-slate-400 text-center py-8">
          No hay tickets recientes
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-slate-400 font-display uppercase tracking-[0.2em]">
          Actividad Reciente
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-slate-600 hover:text-slate-800 font-medium transition-colors cursor-pointer"
          >
            Ver todo →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100">
              <th className="pb-3 font-bold">Código</th>
              <th className="pb-3 font-bold">Categoría</th>
              <th className="pb-3 font-bold">Estado</th>
              <th className="pb-3 font-bold">Prioridad</th>
              <th className="pb-3 font-bold">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.slice(0, 5).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="py-3">
                  <span className="font-mono text-[10px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100">
                    {ticket.ticketCode}
                  </span>
                </td>
                <td className="py-3 text-slate-900 font-bold text-xs">{ticket.category?.name || '—'}</td>
                <td className="py-3"><StatusBadge status={ticket.status} size="sm" /></td>
                <td className="py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-3 text-slate-500 text-[10px] font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const colors = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-warning/10 text-warning',
    HIGH: 'bg-orange-100 text-orange-600',
    CRITICAL: 'bg-danger/10 text-danger',
  }

  const labels = {
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.LOW}`}>
      {labels[priority] || priority}
    </span>
  )
}
