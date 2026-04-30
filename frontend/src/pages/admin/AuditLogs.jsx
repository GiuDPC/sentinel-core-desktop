import { useState, useEffect, useCallback } from 'react'
import { auditApi } from '../../api/audit'

const ACTION_LABELS = {
  TICKET_CREATED: { label: 'Ticket Creado', color: 'bg-accent/10 text-accent' },
  STATUS_CHANGE: { label: 'Cambio de Estado', color: 'bg-warning/10 text-warning' },
  ASSIGNMENT: { label: 'Asignacion', color: 'bg-purple-100 text-purple-600' },
  RESOLUTION_NOTE: { label: 'Nota de Resolucion', color: 'bg-success/10 text-success' },
  RATING: { label: 'Calificacion', color: 'bg-orange-100 text-orange-600' },
  TICKET_REOPENED: { label: 'Reabierto', color: 'bg-danger/10 text-danger' },
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [filterAction, setFilterAction] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await auditApi.getAll({
        page: pagination.page,
        limit: 20,
        action: filterAction || undefined,
      })
      setLogs(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (err) {
      console.error('Error cargando audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filterAction])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Auditoria</h2>
          <p className="text-sm text-text-secondary mt-1">
            Registro detallado de todas las acciones del sistema
          </p>
        </div>
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value)
            setPagination(p => ({ ...p, page: 1 }))
          }}
          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Todas las acciones</option>
          <option value="TICKET_CREATED">Ticket Creado</option>
          <option value="STATUS_CHANGE">Cambio de Estado</option>
          <option value="ASSIGNMENT">Asignacion</option>
          <option value="RESOLUTION_NOTE">Nota de Resolucion</option>
          <option value="RATING">Calificacion</option>
          <option value="TICKET_REOPENED">Reabierto</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-secondary text-sm">No hay registros de auditoria</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary text-xs border-b border-border bg-background/50">
                <th className="px-6 py-4 font-medium">Fecha</th>
                <th className="px-6 py-4 font-medium">Ticket</th>
                <th className="px-6 py-4 font-medium">Usuario</th>
                <th className="px-6 py-4 font-medium">Accion</th>
                <th className="px-6 py-4 font-medium">Anterior</th>
                <th className="px-6 py-4 font-medium">Nuevo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' }
                return (
                  <tr key={log.id} className="hover:bg-background/30 transition-colors">
                    <td className="px-6 py-4 text-text-secondary text-xs">
                      {new Date(log.createdAt).toLocaleString('es-VE', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-accent">{log.ticket?.ticketCode || '—'}</span>
                      {log.ticket?.title && (
                        <p className="text-xs text-text-secondary truncate max-w-32">{log.ticket.title}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-primary text-xs">
                      {log.user?.firstName} {log.user?.lastName}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${actionConfig.color}`}>
                        {actionConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary text-xs font-mono">{log.oldValue || '—'}</td>
                    <td className="px-6 py-4 text-text-secondary text-xs font-mono max-w-40 truncate">{log.newValue || '—'}</td>
                  </tr>
                )
              })}
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
    </div>
  )
}
