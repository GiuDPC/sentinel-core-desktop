import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '../../components/dashboard/KPICard'
import LiveTracker from '../../components/dashboard/LiveTracker'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'
import { Ticket, Activity, AlertCircle } from 'lucide-react'

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
      const sortedTickets = (ticketsData.data || []).sort((a, b) => {
        const priorityMap = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
        if (a.status === 'IN_PROGRESS' && b.status !== 'IN_PROGRESS') return -1
        if (b.status === 'IN_PROGRESS' && a.status !== 'IN_PROGRESS') return 1
        return (priorityMap[a.priority] || 4) - (priorityMap[b.priority] || 4)
      })

      setAssignedTickets(sortedTickets)

      const active = sortedTickets.find((t) => t.status === 'IN_PROGRESS') || 
                     sortedTickets.find((t) => t.status === 'ASSIGNED')
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
          Cola de Trabajo
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Tickets asignados priorizados por urgencia
        </p>
      </div>

      {/* KPIs Operativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Asignados"
          value={metrics?.totalAssigned || 0}
          color="blue"
          icon={Ticket}
        />
        <KPICard
          title="En Proceso"
          value={metrics?.inProgress || 0}
          color="yellow"
          icon={Activity}
        />
        <KPICard
          title="Urgentes / Vencidos"
          value={metrics?.slaBreached || 0}
          subtitle={`${metrics?.slaAtRisk || 0} en riesgo crítico`}
          color={metrics?.slaBreached > 0 ? 'red' : 'orange'}
          icon={AlertCircle}
        />
      </div>

      {/* Acción Inmediata: Live Tracker */}
      {activeTicket && (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <LiveTracker 
            ticketCode={activeTicket.ticketCode}
            title={activeTicket.title}
            currentStatus={activeTicket.status}
            technicianName={`${activeTicket.assignments?.[0]?.technician?.firstName} ${activeTicket.assignments?.[0]?.technician?.lastName}`}
            priority={activeTicket.priority}
          />
        </div>
      )}

      {/* Contenedor de Cola de Tareas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <RecentActivity
          title="Listado de Tareas Pendientes"
          tickets={assignedTickets}
          onViewAll={() => navigate('/technician/assigned')}
        />
      </div>
    </div>
  )
}
