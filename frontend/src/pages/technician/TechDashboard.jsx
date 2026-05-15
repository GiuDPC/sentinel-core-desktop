import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import KPICard from '../../components/dashboard/KPICard'
import LiveTracker from '../../components/dashboard/LiveTracker'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'
import { useAuth } from '../../Contexts/AuthContextObject'
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function TechDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState(null)
  const [assignedTickets, setAssignedTickets] = useState([])
  const [activeTicket, setActiveTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadDashboard() {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getTechnicianMetrics(user.id),
        ticketsApi.getAssigned(user.id),
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">
            Mi Panel Técnico
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Resumen de tu cola de trabajo y tareas asignadas
          </p>
        </div>
      </div>

      {/* KPIs Principal Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Asignados"
          value={metrics?.totalAssigned || 0}
          color="blue"
          icon={FileText}
        />
        <KPICard
          title="En Proceso"
          value={metrics?.inProgress || 0}
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
            priority={{
              LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica'
            }[activeTicket.priority]}
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
            <h4 className="text-lg font-bold text-slate-900">Sin tareas activas</h4>
            <p className="text-sm text-slate-500 mt-1">
              Excelente. Todas tus tareas han sido resueltas o están bajo control.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity Row */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        <RecentActivity
          title="Listado de Tareas Pendientes"
          tickets={assignedTickets}
          onViewAll={() => navigate('/technician/assigned')}
        />
      </div>
    </div>
  )
}
