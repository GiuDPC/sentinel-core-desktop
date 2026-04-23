import { useState, useEffect } from 'react'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import notifications from '../../components/ui/Notifications'

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [filters, pagination.page])

  async function loadTickets() {
    setLoading(true)
    try {
      const data = await ticketsApi.getAll({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        page: pagination.page,
        limit: 15,
      })
      setTickets(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleAssign(ticketId) {
    const techId = prompt('ID del técnico a asignar:')
    if (!techId) return
    try {
      await ticketsApi.assignTechnician(ticketId, techId)
      notifications.success('Técnico asignado', '✅')
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Todos los Tickets</h2>
          <p className="text-sm text-text-secondary mt-1">
            Gestión completa de incidencias del centro comercial
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }))
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todos los estados</option>
            <option value="OPEN">Abierto</option>
            <option value="ASSIGNED">Asignado</option>
            <option value="IN_PROGRESS">En Proceso</option>
            <option value="RESOLVED">Resuelto</option>
            <option value="CLOSED">Cerrado</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters((f) => ({ ...f, priority: e.target.value }))
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todas las prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Código</th>
                <th className="px-6 py-4 font-medium">Título</th>
                <th className="px-6 py-4 font-medium">Solicitante</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Técnico</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-accent">{ticket.ticketCode}</td>
                  <td className="px-6 py-4 text-text-primary font-medium max-w-48 truncate">{ticket.title}</td>
                  <td className="px-6 py-4 text-text-secondary">
                    {ticket.creator?.firstName} {ticket.creator?.lastName}
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{ticket.category?.name}</td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {ticket.assignments?.[0]?.technician
                      ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => handleAssign(ticket.id)}
                        className="px-3 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
                      >
                        Asignar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 border-t border-border">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-background transition-colors cursor-pointer"
            >
              ← Anterior
            </button>
            <span className="text-sm text-text-secondary">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-background transition-colors cursor-pointer"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
