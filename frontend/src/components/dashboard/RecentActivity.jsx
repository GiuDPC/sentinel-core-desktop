import StatusBadge from './StatusBadge'

/**
 * Mini tabla de actividad reciente — últimos 5 tickets.
 * @param {Object} props
 * @param {Array} props.tickets — Array de tickets recientes
 * @param {Function} [props.onViewAll] — Callback para "Ver todo"
 */
export default function RecentActivity({ 
  tickets = [], 
  onViewAll, 
  title = "Actividad Reciente" 
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="text-xs font-bold text-slate-500 font-display uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Sin actividad reciente</p>
          <p className="text-xs text-slate-400 mt-1">No hay tickets registrados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
        <h3 className="text-xs font-bold text-slate-500 font-display uppercase tracking-wider">
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[10px] text-primary-600 hover:text-primary-700 font-medium cursor-pointer"
          >
            Ver Todo
          </button>
        )}
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface z-10">
            <tr className="text-left text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-3 font-semibold">Código</th>
              <th className="px-6 py-3 font-semibold">Incidencia</th>
              <th className="px-6 py-3 font-semibold">Estado</th>
              <th className="px-6 py-3 font-semibold text-right">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.slice(0, 5).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                <td className="px-6 py-3.5">
                  <span className="font-mono text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">
                    {ticket.ticketCode}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <p className="text-xs font-medium text-slate-700 truncate max-w-[180px]">{ticket.title}</p>
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={ticket.status} size="sm" />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <span className="text-slate-400 text-[10px]">
                    {new Date(ticket.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                  </span>
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
