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
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-400 mt-1">No hay tareas pendientes en este momento.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
        <h3 className="text-[10px] font-bold text-slate-400 font-display uppercase tracking-[0.2em]">
          {title}
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[10px] bg-white border border-slate-200 px-3 py-1 rounded-md text-slate-600 hover:text-blue-950 font-bold uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            Ver Todo →
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 bg-slate-50/10">
              <th className="px-6 py-3 font-bold">Código</th>
              <th className="px-6 py-3 font-bold">Incidencia</th>
              <th className="px-6 py-3 font-bold">Estado</th>
              <th className="px-6 py-3 font-bold">Prioridad</th>
              <th className="px-6 py-3 font-bold text-right text-indigo-900/40">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.slice(0, 5).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                <td className="px-6 py-4">
                  <span className="font-mono text-[10px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100 shadow-sm group-hover:bg-indigo-100 transition-colors">
                    {ticket.ticketCode}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{ticket.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ticket.category?.name || 'General'}</p>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={ticket.status} size="sm" />
                </td>
                <td className="px-6 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
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
