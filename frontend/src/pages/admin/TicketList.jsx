import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import AnimatedModal from '../../components/ui/AnimatedModal'
import notifications from '../../components/ui/Notifications'

const PRIORITY_LABELS = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }
const PRIORITY_COLORS = {
  LOW: 'text-text-secondary', MEDIUM: 'text-warning',
  HIGH: 'text-orange-500', CRITICAL: 'text-danger',
}

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' })
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  // Modal de asignacion inteligente
  const [assignModal, setAssignModal] = useState(false)
  const [assignTicketId, setAssignTicketId] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [suggested, setSuggested] = useState(null)
  const [loadingTechs, setLoadingTechs] = useState(false)

  // Debounced search
  const searchTimerRef = useRef(null)

  // Leer search de URL al montar
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setFilters(f => ({ ...f, search: urlSearch }))
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [filters.status, filters.priority, pagination.page])

  // Debounce search 400ms
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadTickets()
    }, 400)
    return () => clearTimeout(searchTimerRef.current)
  }, [filters.search])

  async function loadTickets() {
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
  }

  async function openAssignModal(ticketId) {
    setAssignTicketId(ticketId)
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
      await ticketsApi.assignTechnician(assignTicketId, techId)
      notifications.success('Tecnico asignado correctamente', 'Asignacion exitosa')
      setAssignModal(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  const handleSearchChange = useCallback((e) => {
    setFilters(f => ({ ...f, search: e.target.value }))
    setPagination(p => ({ ...p, page: 1 }))
  }, [])

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
          {/* Busqueda con icono + placeholder descriptivo */}
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
                <th className="px-6 py-4 font-medium">Tecnico</th>
                <th className="px-6 py-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-background/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-accent font-bold">{ticket.ticketCode}</td>
                  <td className="px-6 py-4 text-text-primary font-medium max-w-48 truncate" title={ticket.title}>
                    {ticket.title}
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
                  <td className="px-6 py-4 text-text-secondary text-xs">
                    {ticket.assignments?.[0]?.technician
                      ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                      : '\u2014'}
                  </td>
                  <td className="px-6 py-4">
                    {ticket.status === 'OPEN' && (
                      <button
                        onClick={() => openAssignModal(ticket.id)}
                        className="px-3 py-1.5 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 transition-all hover:shadow-md cursor-pointer"
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

      {/* Modal Asignacion Inteligente con animacion */}
      <AnimatedModal show={assignModal} onClose={() => setAssignModal(false)}>
        <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-text-primary font-display">Asignar Tecnico</h3>
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
    </div>
  )
}
