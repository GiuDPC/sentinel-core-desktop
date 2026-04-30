import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'

export default function AssignedTickets() {
  const [tickets, setTickets] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getAssigned({
        status: statusFilter || undefined,
      })
      setTickets(data.data || [])
    } catch (error) {
      console.error('Error cargando tickets asignados:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  async function handleStatusChange(ticketId, newStatus) {
    try {
      await ticketsApi.updateStatus(ticketId, newStatus)
      loadTickets()
    } catch (error) {
      console.error('Error cambiando estado:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Tickets Asignados</h2>
          <p className="text-sm text-text-secondary mt-1">
            Gestiona tus tickets de mantenimiento
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Todos</option>
          <option value="ASSIGNED">Asignado</option>
          <option value="IN_PROGRESS">En Proceso</option>
          <option value="ON_HOLD">En Espera</option>
          <option value="RESOLVED">Resuelto</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="font-medium">No tienes tickets asignados</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-6 hover:bg-background/30 transition-colors cursor-pointer"
                onClick={() => navigate(`/technician/ticket/${ticket.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-accent">{ticket.ticketCode}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <h3 className="text-base font-medium text-text-primary mt-1">{ticket.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                      <span>{ticket.location}</span>
                      <span>{ticket.category?.name}</span>
                      <span>{ticket.creator?.firstName} {ticket.creator?.lastName}</span>
                    </div>
                  </div>

                  {/* Acciones rápidas de estado */}
                  <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    {ticket.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                        className="px-3 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
                      >
                        Iniciar
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(ticket.id, 'ON_HOLD')}
                          className="px-3 py-1 text-xs border border-border text-text-secondary rounded-lg hover:bg-background transition-colors cursor-pointer"
                        >
                          Pausar
                        </button>
                      </>
                    )}
                    {ticket.status === 'ON_HOLD' && (
                      <button
                        onClick={() => handleStatusChange(ticket.id, 'IN_PROGRESS')}
                        className="px-3 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
                      >
                        Reanudar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
