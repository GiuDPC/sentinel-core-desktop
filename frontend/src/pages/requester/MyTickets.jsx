import { useState, useEffect } from 'react'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
]

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTickets()
  }, [statusFilter, pagination.page])

  async function loadTickets() {
    setLoading(true)
    try {
      const data = await ticketsApi.getMyTickets({
        status: statusFilter || undefined,
        page: pagination.page,
      })
      setTickets(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Mis Tickets</h2>
          <p className="text-sm text-text-secondary mt-1">
            Historial completo de tus reportes de incidencias
          </p>
        </div>

        {/* Filtro por estado */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPagination((p) => ({ ...p, page: 1 }))
          }}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="font-medium">No tienes tickets aún</p>
            <p className="text-sm mt-1">Crea un nuevo reporte desde las acciones rápidas</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Código</th>
                <th className="px-6 py-4 font-medium">Título</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Prioridad</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-accent">{ticket.ticketCode}</td>
                  <td className="px-6 py-4 text-text-primary font-medium">{ticket.title}</td>
                  <td className="px-6 py-4 text-text-secondary">{ticket.category?.name || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium ${
                      ticket.priority === 'CRITICAL' ? 'text-danger' :
                      ticket.priority === 'HIGH' ? 'text-orange-500' :
                      ticket.priority === 'MEDIUM' ? 'text-warning' :
                      'text-text-secondary'
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString('es-VE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Paginación */}
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
