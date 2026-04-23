import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import LiveTracker from '../../components/dashboard/LiveTracker'
import notifications from '../../components/ui/Notifications'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTicket()
  }, [id])

  async function loadTicket() {
    try {
      const data = await ticketsApi.getById(id)
      setTicket(data.ticket || data)
    } catch (error) {
      console.error('Error cargando ticket:', error)
      notifications.error('No se pudo cargar el ticket', 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await ticketsApi.updateStatus(id, newStatus)
      notifications.success('Estado actualizado', '✅')
      loadTicket()
    } catch (error) {
      notifications.error(error.message || 'Error al cambiar estado', 'Error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary">Ticket no encontrado</p>
        <button
          onClick={() => navigate('/technician/assigned')}
          className="mt-4 text-accent hover:underline cursor-pointer"
        >
          ← Volver a tickets asignados
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/technician/assigned')}
            className="text-sm text-text-secondary hover:text-text-primary mb-2 inline-block cursor-pointer"
          >
            ← Volver a tickets
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-text-primary font-display">{ticket.ticketCode}</h2>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="text-lg text-text-primary mt-1">{ticket.title}</p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {ticket.status === 'ASSIGNED' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
            >
              ▶ Iniciar Trabajo
            </button>
          )}
          {ticket.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors cursor-pointer"
              >
                ✓ Marcar Resuelto
              </button>
              <button
                onClick={() => handleStatusChange('ON_HOLD')}
                className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-background transition-colors cursor-pointer"
              >
                ⏸ Pausar
              </button>
            </>
          )}
          {ticket.status === 'ON_HOLD' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors cursor-pointer"
            >
              ▶ Reanudar
            </button>
          )}
        </div>
      </div>

      {/* Stepper */}
      <LiveTracker currentStatus={ticket.status} />

      {/* Detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-text-primary font-display">Detalles</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Categoría</span>
              <span className="text-text-primary font-medium">{ticket.category?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Ubicación</span>
              <span className="text-text-primary font-medium">{ticket.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Prioridad</span>
              <span className="text-text-primary font-medium">{ticket.priority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Reportado por</span>
              <span className="text-text-primary font-medium">
                {ticket.creator?.firstName} {ticket.creator?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Fecha de creación</span>
              <span className="text-text-primary font-medium">
                {new Date(ticket.createdAt).toLocaleString('es-VE')}
              </span>
            </div>
            {ticket.dueDate && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Vencimiento SLA</span>
                <span className={`font-medium ${
                  new Date(ticket.dueDate) < new Date() ? 'text-danger' : 'text-success'
                }`}>
                  {new Date(ticket.dueDate).toLocaleString('es-VE')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-3 font-display">Descripción</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{ticket.description}</p>
        </div>
      </div>

      {/* Historial de cambios */}
      {ticket.auditLogs && ticket.auditLogs.length > 0 && (
        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
            Historial de Cambios
          </h3>
          <div className="space-y-3">
            {ticket.auditLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-text-secondary w-40">
                  {new Date(log.createdAt).toLocaleString('es-VE')}
                </span>
                <span className="text-text-primary">
                  <strong>{log.user?.firstName} {log.user?.lastName}</strong> — {log.action}
                  {log.oldValue && log.newValue && (
                    <span className="text-text-secondary">
                      {' '}({log.oldValue} → {log.newValue})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comentarios */}
      {ticket.comments && ticket.comments.length > 0 && (
        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
            Comentarios
          </h3>
          <div className="space-y-4">
            {ticket.comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                  {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(comment.createdAt).toLocaleString('es-VE')}
                    </span>
                    {comment.isInternal && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                        Interno
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
