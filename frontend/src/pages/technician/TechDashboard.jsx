import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '../../components/dashboard/KPICard'
import LiveTracker from '../../components/dashboard/LiveTracker'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'

export default function TechDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [assignedTickets, setAssignedTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getTechnicianMetrics(),
        ticketsApi.getAssigned(),
      ])
      setMetrics(metricsData)
      setAssignedTickets(ticketsData.data || [])

      const active = ticketsData.data?.find(
        (t) => t.status === 'IN_PROGRESS'
      ) || ticketsData.data?.find(
        (t) => t.status === 'ASSIGNED'
      )
      setActiveTicket(active || null)
    } catch (error) {
      console.error('Error cargando dashboard tecnico:', error)
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
          Panel del Tecnico
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Tus tickets asignados y rendimiento
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Mis Tickets"
          value={metrics?.totalAssigned || 0}
          color="blue"
        />
        <KPICard
          title="En Proceso"
          value={metrics?.inProgress || 0}
          color="yellow"
        />
        <KPICard
          title="Resueltos"
          value={metrics?.resolved || 0}
          color="green"
        />
        <KPICard
          title="Tiempo Vencido"
          value={metrics?.slaBreached || 0}
          subtitle={`${metrics?.slaAtRisk || 0} por vencer`}
          color={metrics?.slaBreached > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Tiempo promedio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KPICard
          title="Tiempo Promedio"
          value={`${metrics?.avgResolutionHours || 0}h`}
          subtitle="para resolver"
          color="blue"
        />
      </div>

      {/* Live Tracker */}
      {activeTicket && (
        <LiveTracker
          ticketCode={activeTicket.ticketCode}
          title={activeTicket.title}
          currentStatus={activeTicket.status}
          eta={activeTicket.dueDate ? new Date(activeTicket.dueDate).toLocaleString('es-VE') : null}
        />
      )}

      <RecentActivity
        tickets={assignedTickets}
        onViewAll={() => navigate('/technician/assigned')}
      />
    </div>
  )
}
