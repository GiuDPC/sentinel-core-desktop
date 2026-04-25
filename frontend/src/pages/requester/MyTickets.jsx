import { useState, useEffect } from 'react'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import AnimatedModal from '../../components/ui/AnimatedModal'
import notifications from '../../components/ui/Notifications'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'AWAITING_CONFIRMATION', label: 'Esperando Confirmacion' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
]

const PRIORITY_LABELS = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }
const PRIORITY_COLORS = {
  LOW: 'text-text-secondary', MEDIUM: 'text-warning',
  HIGH: 'text-orange-500', CRITICAL: 'text-danger',
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal confirmacion
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { loadTickets() }, [statusFilter, pagination.page])

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

  function openConfirmModal(ticket) {
    setSelectedTicket(ticket)
    setRating(0)
    setHoverRating(0)
    setRatingComment('')
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await ticketsApi.confirmTicket(selectedTicket.id, {
        confirmed: true,
        rating: rating || undefined,
        ratingComment: ratingComment || undefined,
      })
      notifications.success('Ticket cerrado exitosamente', 'Confirmacion exitosa')
      setShowConfirm(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReopen(ticket) {
    const { isConfirmed, value } = await notifications.confirm({
      title: 'Reabrir ticket',
      text: 'Describe por que la solucion no fue satisfactoria:',
      confirmText: 'Reabrir',
      cancelText: 'Cancelar',
      type: 'warning',
    })
    if (!isConfirmed) return

    try {
      await ticketsApi.confirmTicket(ticket.id, {
        confirmed: false,
        ratingComment: 'Reabierto por el solicitante',
      })
      notifications.success('Ticket reabierto para atencion', 'Reabierto')
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Mis Tickets</h2>
          <p className="text-sm text-text-secondary mt-1">
            Historial completo de tus reportes de incidencias
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
          className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16 text-text-secondary">
            <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
            <p className="font-medium">No tienes tickets aun</p>
            <p className="text-sm mt-1">Crea un nuevo reporte desde el menu lateral</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Codigo</th>
                <th className="px-6 py-4 font-medium">Titulo</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Ubicacion</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Prioridad</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-accent font-bold">{ticket.ticketCode}</td>
                  <td className="px-6 py-4 text-text-primary font-medium max-w-44 truncate" title={ticket.title}>{ticket.title}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs">{ticket.category?.name || '\u2014'}</td>
                  <td className="px-6 py-4 text-text-secondary text-xs max-w-28 truncate" title={ticket.location}>{ticket.location || '\u2014'}</td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] || 'text-text-secondary'}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {new Date(ticket.createdAt).toLocaleDateString('es-VE')}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.status === 'AWAITING_CONFIRMATION' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openConfirmModal(ticket)}
                          className="px-3 py-1.5 text-xs bg-success text-white rounded-lg hover:bg-success/90 transition-all hover:shadow-md cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => handleReopen(ticket)}
                          className="px-3 py-1.5 text-xs border border-danger/30 text-danger rounded-lg hover:bg-danger/10 transition-all cursor-pointer"
                        >
                          Reabrir
                        </button>
                      </div>
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
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-background transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-sm text-text-secondary">
              Pagina {pagination.page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm rounded-lg border border-border disabled:opacity-50 hover:bg-background transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmacion con animacion */}
      <AnimatedModal show={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary font-display">Confirmar Resolucion</h3>
            <p className="text-xs text-text-secondary mt-1">
              Ticket {selectedTicket?.ticketCode}
            </p>
          </div>

          {selectedTicket?.resolutionNote && (
            <div className="px-6 py-4 bg-success/5 border-b border-border">
              <p className="text-xs font-semibold text-text-primary mb-1">Nota del tecnico:</p>
              <p className="text-sm text-text-secondary leading-relaxed">{selectedTicket.resolutionNote}</p>
            </div>
          )}

          <div className="p-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-text-primary mb-3">Califica el servicio</p>
              <div className="flex gap-1.5 items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="w-9 h-9 cursor-pointer transition-transform hover:scale-110"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill={star <= (hoverRating || rating) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className={`w-full h-full transition-colors ${
                        star <= (hoverRating || rating) ? 'text-warning' : 'text-gray-300'
                      }`}
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-xs text-text-secondary ml-2">
                    {['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'][rating]}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary block mb-1.5">Comentario (opcional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Comparte tu experiencia con el servicio..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-background/50 flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm bg-success text-white rounded-lg hover:bg-success/90 disabled:opacity-50 transition-all hover:shadow-md cursor-pointer font-medium"
            >
              {submitting ? 'Confirmando...' : 'Confirmar y Cerrar'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2.5 text-sm text-text-secondary border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  )
}
