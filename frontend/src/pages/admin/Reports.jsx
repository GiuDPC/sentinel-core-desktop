import { useState, useEffect } from 'react'
import { metricsApi } from '../../api/metrics'

export default function Reports() {
  const [metrics, setMetrics] = useState(null)
  const [slaBreached, setSlaBreached] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadReports() }, [])

  async function loadReports() {
    try {
      const [m, sla] = await Promise.all([
        metricsApi.getDashboard(),
        metricsApi.getSlaBreached(),
      ])
      setMetrics(m)
      setSlaBreached(sla.tickets || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const s = metrics?.summary || {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">Reportes</h2>
        <p className="text-sm text-text-secondary mt-1">Analíticas del centro comercial</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-accent font-display">{s.totalTickets || 0}</p>
          <p className="text-sm text-text-secondary mt-1">Tickets Totales</p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-success font-display">{s.avgResolutionHours || 0}h</p>
          <p className="text-sm text-text-secondary mt-1">Resolución Promedio</p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className={`text-3xl font-bold font-display ${s.slaBreached > 0 ? 'text-danger' : 'text-success'}`}>
            {s.slaBreached || 0}
          </p>
          <p className="text-sm text-text-secondary mt-1">SLA Vencidos</p>
        </div>
      </div>

      {/* Por prioridad */}
      <div className="bg-surface rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">Tickets por Prioridad</h3>
        <div className="space-y-3">
          {(metrics?.ticketsByPriority || []).map((item) => {
            const colors = { LOW: 'bg-gray-300', MEDIUM: 'bg-warning', HIGH: 'bg-orange-400', CRITICAL: 'bg-danger' }
            return (
              <div key={item.priority} className="flex items-center justify-between">
                <span className="text-sm text-text-primary w-20">{item.priority}</span>
                <div className="flex-1 mx-4 h-3 bg-border rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${colors[item.priority] || 'bg-gray-300'}`}
                    style={{ width: `${Math.min((item.count / (s.totalTickets || 1)) * 100, 100)}%` }} />
                </div>
                <span className="text-sm font-bold text-text-primary w-8 text-right">{item.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* SLA Vencidos */}
      {slaBreached.length > 0 && (
        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-danger mb-4 font-display">⚠️ Tickets con SLA Vencido</h3>
          <div className="space-y-3">
            {slaBreached.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-danger/5 rounded-lg">
                <div>
                  <span className="font-mono text-xs text-danger">{t.ticketCode}</span>
                  <p className="text-sm text-text-primary">{t.title || t.category?.name}</p>
                </div>
                <span className="text-xs text-danger font-medium">
                  Venció: {new Date(t.dueDate).toLocaleDateString('es-VE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
