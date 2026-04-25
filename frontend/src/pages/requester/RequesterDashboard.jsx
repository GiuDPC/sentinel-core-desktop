import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '../../components/dashboard/KPICard'
import LiveTracker from '../../components/dashboard/LiveTracker'
import QuickActions from '../../components/dashboard/QuickActions'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'

export default function RequesterDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getRequesterMetrics(),
        ticketsApi.getMyTickets({ limit: 5 }),
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">
          Mi Panel de Control
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Resumen de tus incidencias y reportes
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tickets Totales"
          value={metrics?.totalTickets || 0}
          color="blue"
        />
        <KPICard
          title="En Proceso"
          value={metrics?.inProgressTickets || 0}
          color="yellow"
        />
        <KPICard
          title="Resueltos"
          value={metrics?.resolvedTickets || 0}
          color="green"
        />
        <KPICard
          title="Cumplimiento SLA"
          value={`${metrics?.slaCompliance || 100}%`}
          subtitle={`Tiempo promedio: ${metrics?.avgResolutionHours || 0}h`}
          color={metrics?.slaCompliance >= 80 ? 'green' : 'red'}
        />
      </div>

      {/* Live Tracker + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeTicket ? (
          <LiveTracker
            ticketCode={activeTicket.ticketCode}
            title={activeTicket.title}
            currentStatus={activeTicket.status}
            priority={
              { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }[activeTicket.priority]
            }
            technicianName={
              activeTicket.assignments?.[0]?.technician
                ? `${activeTicket.assignments[0].technician.firstName} ${activeTicket.assignments[0].technician.lastName}`
                : null
            }
          />
        ) : (
          <div className="bg-surface rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-text-primary font-medium">Sin incidencias activas</p>
            <p className="text-sm text-text-secondary mt-1">
              Todos tus reportes han sido atendidos
            </p>
          </div>
        )}
        <QuickActions />
      </div>

      <RecentActivity
        tickets={recentTickets}
        onViewAll={() => navigate('/requester/my-tickets')}
      />
    </div>
  )
}
