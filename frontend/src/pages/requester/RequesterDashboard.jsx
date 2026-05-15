import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import KPICard from '../../components/dashboard/KPICard'
import LiveTracker from '../../components/dashboard/LiveTracker'
import QuickActions from '../../components/dashboard/QuickActions'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'
import { PRIORITY_LABELS } from '../../constants/ticket'
import { useAuth } from '../../Contexts/AuthContextObject'

export default function RequesterDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadDashboard = useCallback(async () => {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getRequesterMetrics(user.id),
        ticketsApi.getMyTickets(user.id, { limit: 5 }),
      ])
      setMetrics(metricsData)
      setRecentTickets(ticketsData.data || [])

      const active = ticketsData.data?.find(
        (t) => !['RESOLVED', 'CLOSED'].includes(t.status)
      )
      setActiveTicket(active || null)
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-950 tracking-tight font-display">
            Mi Panel de Control
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Resumen en tiempo real de tus incidencias y reportes
          </p>
        </div>
      </div>

      {/* KPIs Principal Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Mis Reportes"
          value={metrics?.totalTickets || 0}
          color="blue"
          icon={FileText}
          trend="up"
          trendValue="12%"
        />
        <KPICard
          title="En Proceso"
          value={metrics?.inProgressTickets || 0}
          color="yellow"
          icon={Clock}
        />
        <KPICard
          title="Resueltos"
          value={metrics?.resolvedTickets || 0}
          color="green"
          icon={CheckCircle}
        />
        <KPICard
          title="Tiempo Vencido"
          value={metrics?.slaBreached || 0}
          subtitle={`${metrics?.slaAtRisk || 0} por vencer`}
          color={metrics?.slaBreached > 0 ? 'red' : 'green'}
          icon={AlertCircle}
        />
      </div>

      {/* Live Tracker - Full Width */}
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {activeTicket ? (
          <LiveTracker
            ticketCode={activeTicket.ticketCode}
            title={activeTicket.title}
            currentStatus={activeTicket.status}
            priority={PRIORITY_LABELS[activeTicket.priority]}
            technicianName={
              activeTicket.assignments?.[0]?.technician
                ? `${activeTicket.assignments[0].technician.firstName} ${activeTicket.assignments[0].technician.lastName}`
                : null
            }
            eta={activeTicket.eta || '2h 45m'}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px]">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Sin incidencias activas</h4>
            <p className="text-sm text-slate-500 mt-1">
              Excelente. Todos tus reportes han sido resueltos o están bajo control.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions & Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
          <RecentActivity
            tickets={recentTickets}
            onViewAll={() => navigate('/requester/my-tickets')}
          />
        </div>
      </div>
    </div>
  )
}
