import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import KPICard from '../../components/dashboard/KPICard'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [])

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
          trend={summary.trendPercentage > 0 ? 'up' : summary.trendPercentage < 0 ? 'down' : 'neutral'}
          trendValue={`${Math.abs(summary.trendPercentage) || 0}%`}
          color="blue"
          icon={FileText}
        />
        <KPICard
          title="Tickets Abiertos"
          value={summary.openTickets || 0}
          color="yellow"
          icon={AlertCircle}
        />
        <KPICard
          title="Tiempo Vencido"
          value={summary.slaBreached || 0}
          subtitle={`${summary.slaAtRisk || 0} por vencer`}
          color={summary.slaBreached > 0 ? 'red' : 'green'}
          icon={Clock}
        />
        <KPICard
          title="Tiempo Promedio"
          value={`${summary.avgResolutionHours || 0}h`}
          subtitle="para resolver"
          color="blue"
          icon={CheckCircle}
        />
      </div>

      {/* Estadisticas por categoria y estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets por Categoria */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Tickets por Categoría</h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribución por tipo de incidencia</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xl font-bold text-slate-800">{summary.totalTickets || 0}</span>
              <p className="text-xs text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-4">
            {(metrics?.ticketsByCategory || []).map((item) => {
              const percentage = Math.min((item.count / (summary.totalTickets || 1)) * 100, 100)
              return (
                <div key={item.category} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600 truncate max-w-[160px]">{item.category}</span>
                    <span className="text-sm font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-700 rounded-full transition-all duration-700 ease-out group-hover:bg-slate-800"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {/* Espacios vacíos para igualar con estado si tiene menos categorías */}
            {Array.from({ length: Math.max(0, (metrics?.ticketsByStatus?.length || 0) - (metrics?.ticketsByCategory?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-[52px]" />
            ))}
          </div>
        </div>

        {/* Tickets por Estado */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Tickets por Estado</h3>
                <p className="text-xs text-slate-400 mt-0.5">Estado actual del sistema</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-slate-800">{summary.totalTickets || 0}</span>
              <p className="text-xs text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-4">
            {(metrics?.ticketsByStatus || []).map((item) => {
              const percentage = Math.min((item.count / (summary.totalTickets || 1)) * 100, 100)
              const statusLabels = {
                OPEN: 'Abierto',
                ASSIGNED: 'Asignado',
                IN_PROGRESS: 'En Proceso',
                ON_HOLD: 'En Espera',
                RESOLVED: 'Resuelto',
                CLOSED: 'Cerrado',
              }
              return (
                <div key={item.status} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">{statusLabels[item.status] || item.status}</span>
                    <span className="text-sm font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-700 rounded-full transition-all duration-700 ease-out group-hover:bg-slate-800"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {/* Espacios vacíos para igualar con categoría si tiene menos estados */}
            {Array.from({ length: Math.max(0, (metrics?.ticketsByCategory?.length || 0) - (metrics?.ticketsByStatus?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-[52px]" />
            ))}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <RecentActivity
          tickets={recentTickets}
          onViewAll={() => navigate('/admin/tickets')}
        />
      </div>
    </div>
  )
}
