import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '../../components/dashboard/KPICard'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getDashboard(),
        ticketsApi.getAll({ limit: 5 }),
      ])
      setMetrics(metricsData)
      setRecentTickets(ticketsData.data || [])
    } catch (error) {
      console.error('Error cargando dashboard admin:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  const summary = metrics?.summary || {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">
          Panel de Administracion
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Vision general del centro comercial
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Tickets"
          value={summary.totalTickets || 0}
          subtitle={`${summary.ticketsThisMonth || 0} este mes`}
          color="blue"
        />
        <KPICard
          title="Tickets Abiertos"
          value={summary.openTickets || 0}
          color="yellow"
        />
        <KPICard
          title="SLA Vencidos"
          value={summary.slaBreached || 0}
          subtitle={`${summary.slaAtRisk || 0} en riesgo`}
          color={summary.slaBreached > 0 ? 'red' : 'green'}
        />
        <KPICard
          title="Tiempo Promedio"
          value={`${summary.avgResolutionHours || 0}h`}
          subtitle="Resolucion promedio"
          color="blue"
        />
      </div>

      {/* Estadisticas por categoria y estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
            Tickets por Categoria
          </h3>
          <div className="space-y-3">
            {(metrics?.ticketsByCategory || []).map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{item.category}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (item.count / (summary.totalTickets || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-primary w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary mb-4 font-display">
            Tickets por Estado
          </h3>
          <div className="space-y-3">
            {(metrics?.ticketsByStatus || []).map((item) => {
              const statusColors = {
                OPEN: 'bg-accent',
                ASSIGNED: 'bg-warning',
                IN_PROGRESS: 'bg-orange-400',
                ON_HOLD: 'bg-gray-400',
                RESOLVED: 'bg-success',
                CLOSED: 'bg-gray-300',
              }
              const statusLabels = {
                OPEN: 'Abierto',
                ASSIGNED: 'Asignado',
                IN_PROGRESS: 'En Proceso',
                ON_HOLD: 'En Espera',
                RESOLVED: 'Resuelto',
                CLOSED: 'Cerrado',
              }
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-sm text-text-primary">
                    {statusLabels[item.status] || item.status}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusColors[item.status] || 'bg-gray-300'}`}
                        style={{
                          width: `${Math.min(
                            (item.count / (summary.totalTickets || 1)) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-text-primary w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <RecentActivity
        tickets={recentTickets}
        onViewAll={() => navigate('/admin/tickets')}
      />
    </div>
  )
}
