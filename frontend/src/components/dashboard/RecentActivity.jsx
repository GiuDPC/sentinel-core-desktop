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
      <div className="bg-surface rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
          Actividad Reciente
        </h3>
        <p className="text-sm text-text-secondary text-center py-8">
          No hay tickets recientes
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary font-display">
          Actividad Reciente
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-accent hover:text-accent/80 font-medium transition-colors cursor-pointer"
          >
            Ver todo →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary text-xs border-b border-border">
              <th className="pb-3 font-medium">Código</th>
              <th className="pb-3 font-medium">Categoría</th>
              <th className="pb-3 font-medium">Estado</th>
              <th className="pb-3 font-medium">Prioridad</th>
              <th className="pb-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.slice(0, 5).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-background/50 transition-colors">
                <td className="py-3 font-mono text-xs text-accent">{ticket.ticketCode}</td>
                <td className="py-3 text-text-primary">{ticket.category?.name || '—'}</td>
                <td className="py-3"><StatusBadge status={ticket.status} /></td>
                <td className="py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="py-3 text-text-secondary text-xs">
                  {new Date(ticket.createdAt).toLocaleDateString('es-VE')}
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
