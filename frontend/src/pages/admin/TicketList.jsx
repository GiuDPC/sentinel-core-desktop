import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { PRIORITY_LABELS, PRIORITY_COLORS, AUDIT_ACTION_LABELS } from '../../constants/ticket'
import StatusBadge from '../../components/dashboard/StatusBadge'
import AnimatedModal from '../../components/ui/AnimatedModal'
import notifications from '../../components/ui/Notifications'

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  // Modal de asignacion/reasignacion inteligente
  const [assignModal, setAssignModal] = useState(false)
  const [assignTicketId, setAssignTicketId] = useState(null)
  const [isReassign, setIsReassign] = useState(false)
  const [technicians, setTechnicians] = useState([])
  const [suggested, setSuggested] = useState(null)
  const [loadingTechs, setLoadingTechs] = useState(false)

  // Panel detalle de ticket
  const [detailModal, setDetailModal] = useState(false)
  const [detailTicket, setDetailTicket] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Debounced search — single ref to avoid double fetch
  const searchTimerRef = useRef(null)
  const isInitialMount = useRef(true)

  // Leer search de URL al montar
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setFilters(f => ({ ...f, search: urlSearch }))
    }
    // Carga inicial explícita
    loadTickets()
    isInitialMount.current = false
  }, [loadTickets, searchParams])

  // Solo se dispara por cambios en filtros de select (no search, no mount)
  useEffect(() => {
    if (isInitialMount.current) return
    loadTickets()
  }, [filters.status, filters.priority, pagination.page, loadTickets])

  // Debounce search 400ms — separado de los otros filtros
  useEffect(() => {
    if (isInitialMount.current) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadTickets()
    }, 400)
    return () => clearTimeout(searchTimerRef.current)
  }, [filters.search, loadTickets])

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getAll({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
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
  }, [filters.status, filters.priority, filters.search, pagination.page])

  async function openAssignModal(ticketId, reassign = false) {
    setAssignTicketId(ticketId)
    setIsReassign(reassign)
    setAssignModal(true)
    setLoadingTechs(true)
    try {
      const data = await ticketsApi.getTechniciansWorkload()
      setTechnicians(data.technicians || [])
      setSuggested(data.suggested)
    } catch {
      notifications.error('Error cargando tecnicos', 'Error')
    } finally {
      setLoadingTechs(false)
    }
  }

  async function handleAssign(techId) {
    try {
      if (isReassign) {
        await ticketsApi.reassignTechnician(assignTicketId, techId)
        notifications.success('Tecnico reasignado correctamente', 'Reasignacion exitosa')
      } else {
        await ticketsApi.assignTechnician(assignTicketId, techId)
        notifications.success('Tecnico asignado correctamente', 'Asignacion exitosa')
      }
      setAssignModal(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  async function openDetailModal(ticketId) {
    setDetailModal(true)
    setLoadingDetail(true)
    try {
      const data = await ticketsApi.getById(ticketId)
      setDetailTicket(data.ticket || data)
    } catch {
      notifications.error('Error cargando detalle', 'Error')
      setDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSearchChange = useCallback((e) => {
    setFilters(f => ({ ...f, search: e.target.value }))
    setPagination(p => ({ ...p, page: 1 }))
  }, [])

  // Determina si un ticket puede ser reasignado (tiene asignación y no está cerrado)
  function canReassign(ticket) {
    return ticket.assignments?.length > 0 && ticket.status !== 'CLOSED'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Todos los Tickets</h2>
          <p className="text-sm text-text-secondary mt-1">
            Gestion completa de incidencias
            {pagination.total > 0 && (
              <span className="ml-1 text-accent font-medium">({pagination.total} resultados)</span>
            )}
          </p>
        </div>

        <div className="flex gap-3">
          {/* Busqueda */}
          <div className="relative">
            <input
              type="text"
              placeholder="Codigo, titulo, ubicacion..."
              value={filters.search}
              onChange={handleSearchChange}
              className="w-56 pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all focus:w-72"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            {filters.search && (
              <button
                onClick={() => { setFilters(f => ({ ...f, search: '' })); setPagination(p => ({ ...p, page: 1 })) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPagination(p => ({ ...p, page: 1 })) }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todos los estados</option>
            <option value="OPEN">Abierto</option>
            <option value="ASSIGNED">Asignado</option>
            <option value="IN_PROGRESS">En Proceso</option>
            <option value="ON_HOLD">En Espera</option>
            <option value="AWAITING_CONFIRMATION">Esperando Confirmacion</option>
            <option value="RESOLVED">Resuelto</option>
            <option value="CLOSED">Cerrado</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => { setFilters(f => ({ ...f, priority: e.target.value })); setPagination(p => ({ ...p, page: 1 })) }}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            <option value="">Todas las prioridades</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Critica</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
            <p className="text-text-secondary font-medium">No se encontraron tickets</p>
            {filters.search && (
              <p className="text-text-secondary/70 text-sm mt-1">Intenta con otros terminos de busqueda</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Codigo</th>
                <th className="px-6 py-4 font-medium">Titulo</th>
                <th className="px-6 py-4 font-medium">Solicitante</th>
                <th className="px-6 py-4 font-medium">Ubicacion</th>
                <th className="px-6 py-4 font-medium">Prioridad</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">SLA</th>
                <th className="px-6 py-4 font-medium">Tecnico</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => {
                const isSlaBreached = ticket.dueDate && new Date(ticket.dueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(ticket.status);
                const isSlaAtRisk = ticket.dueDate && !isSlaBreached && new Date(ticket.dueDate) < new Date(Date.now() + 2 * 60 * 60 * 1000);
                return (
                <tr key={ticket.id} className="hover:bg-background/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-accent font-bold">
                    <button
                      onClick={() => openDetailModal(ticket.id)}
                      className="hover:underline cursor-pointer"
                    >
                      {ticket.ticketCode}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-text-primary font-medium max-w-48 truncate" title={ticket.title}>
                    <button
                      onClick={() => openDetailModal(ticket.id)}
                      className="hover:text-accent cursor-pointer text-left transition-colors"
                    >
                      {ticket.title}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {ticket.creator?.firstName} {ticket.creator?.lastName}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs max-w-32 truncate" title={ticket.location}>
                    {ticket.location || '\u2014'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[ticket.priority] || 'text-text-secondary'}`}>
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-6 py-4">
                    {ticket.dueDate && !['RESOLVED', 'CLOSED'].includes(ticket.status) ? (
                      <span className={`flex items-center gap-1 text-xs ${isSlaBreached ? 'text-danger font-semibold' : isSlaAtRisk ? 'text-warning font-medium' : 'text-text-secondary'}`}>
                        {isSlaBreached && (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                        )}
                        {new Date(ticket.dueDate).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : '\u2014'}
                  </td>
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {ticket.assignments?.[0]?.technician
                      ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                      : '\u2014'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {ticket.status === 'OPEN' && (
                        <button
                          onClick={() => openAssignModal(ticket.id, false)}
                          className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 transition-all hover:shadow-md cursor-pointer"
                        >
                          Asignar
                        </button>
                      )}
                      {canReassign(ticket) && (
                        <button
                          onClick={() => openAssignModal(ticket.id, true)}
                          className="px-3 py-1.5 text-xs border border-accent/30 text-accent rounded-lg hover:bg-accent/10 transition-all cursor-pointer"
                        >
                          Reasignar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
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

      {/* Modal Asignacion/Reasignacion Inteligente */}
      <AnimatedModal show={assignModal} onClose={() => setAssignModal(false)}>
        <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary font-display">
              {isReassign ? 'Reasignar Tecnico' : 'Asignar Tecnico'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">Selecciona el tecnico con menor carga de trabajo</p>
          </div>

          <div className="p-6 max-h-80 overflow-y-auto">
            {loadingTechs ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            ) : technicians.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">No hay tecnicos disponibles</p>
            ) : (
              <div className="space-y-2">
                {technicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => handleAssign(tech.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                      tech.id === suggested
                        ? 'border-accent bg-accent/5 hover:bg-accent/10 shadow-sm'
                        : 'border-border hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                        {tech.firstName?.[0]}{tech.lastName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-text-primary">
                          {tech.firstName} {tech.lastName}
                        </p>
                        <p className="text-xs text-text-secondary">{tech.department || 'Sin departamento'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="text-xs text-text-secondary block">{tech.activeTickets} tickets</span>
                        <div className="w-16 h-1.5 bg-border rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${tech.activeTickets > 5 ? 'bg-danger' : tech.activeTickets > 3 ? 'bg-warning' : 'bg-success'}`}
                            style={{ width: `${Math.min((tech.activeTickets / 8) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      {tech.id === suggested && (
                        <span className="px-2 py-0.5 text-xs bg-accent text-white rounded-full font-medium">
                          Sugerido
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border bg-background/50">
            <button
              onClick={() => setAssignModal(false)}
              className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg hover:bg-surface transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Modal Detalle de Ticket (Admin) */}
      <AnimatedModal show={detailModal} onClose={() => setDetailModal(false)}>
        <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] overflow-y-auto">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : detailTicket ? (
            <>
              <div className="px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-text-primary font-display">{detailTicket.ticketCode}</h3>
                    <StatusBadge status={detailTicket.status} />
                  </div>
                  <button
                    onClick={() => setDetailModal(false)}
                    className="text-text-secondary hover:text-text-primary cursor-pointer p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-text-primary mt-1">{detailTicket.title}</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Info general */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary text-xs block">Solicitante</span>
                    <span className="text-text-primary font-medium">
                      {detailTicket.creator?.firstName} {detailTicket.creator?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs block">Categoria</span>
                    <span className="text-text-primary font-medium">{detailTicket.category?.name}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs block">Ubicacion</span>
                    <span className="text-text-primary font-medium">{detailTicket.location}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs block">Prioridad</span>
                    <span className={`font-semibold ${PRIORITY_COLORS[detailTicket.priority]}`}>
                      {PRIORITY_LABELS[detailTicket.priority]}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs block">Tecnico Asignado</span>
                    <span className="text-text-primary font-medium">
                      {detailTicket.assignments?.[0]?.technician
                        ? `${detailTicket.assignments[0].technician.firstName} ${detailTicket.assignments[0].technician.lastName}`
                        : 'Sin asignar'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-secondary text-xs block">Creado</span>
                    <span className="text-text-primary font-medium">
                      {new Date(detailTicket.createdAt).toLocaleString('es-VE')}
                    </span>
                  </div>
                  {detailTicket.dueDate && (
                    <div>
                      <span className="text-text-secondary text-xs block">SLA Vencimiento</span>
                      <span className={`font-medium ${new Date(detailTicket.dueDate) < new Date() ? 'text-danger' : 'text-success'}`}>
                        {new Date(detailTicket.dueDate).toLocaleString('es-VE')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Descripcion */}
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Descripcion</h4>
                  <p className="text-sm text-text-primary leading-relaxed bg-background/50 p-3 rounded-lg">{detailTicket.description}</p>
                </div>

                {/* Nota de resolucion */}
                {detailTicket.resolutionNote && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Nota de Resolucion</h4>
                    <p className="text-sm text-text-primary leading-relaxed bg-success/5 p-3 rounded-lg border border-success/20">{detailTicket.resolutionNote}</p>
                  </div>
                )}

                {/* Historial */}
                {detailTicket.auditLogs?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Historial</h4>
                    <div className="space-y-2">
                      {detailTicket.auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 text-xs">
                          <span className="text-text-secondary w-32 shrink-0">
                            {new Date(log.createdAt).toLocaleString('es-VE')}
                          </span>
                          <span className="text-text-primary">
                            <strong>{log.user?.firstName} {log.user?.lastName}</strong>
                            {' — '}
                            {AUDIT_ACTION_LABELS[log.action] || log.action}
                            {log.oldValue && log.newValue && (
                              <span className="text-text-secondary"> ({log.oldValue} → {log.newValue})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comentarios */}
                {detailTicket.comments?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Comentarios</h4>
                    <div className="space-y-3">
                      {detailTicket.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-7 h-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                            {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-text-primary">
                                {comment.user?.firstName} {comment.user?.lastName}
                              </span>
                              <span className="text-[10px] text-text-secondary">
                                {new Date(comment.createdAt).toLocaleString('es-VE')}
                              </span>
                              {comment.isInternal && (
                                <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded-full">Interno</span>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </AnimatedModal>
    </div>
  )
}
