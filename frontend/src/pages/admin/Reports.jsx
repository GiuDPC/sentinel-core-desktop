import { useState, useEffect } from 'react'
import { metricsApi } from '../../api/metrics'
import * as XLSX from 'xlsx'
import { Download, Calendar, FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

const DATE_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'all', label: 'Todo' },
]

// Componente KPI estilo minimalista
// eslint-disable-next-line no-unused-vars
function KPICard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 font-display tabular-nums mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon size={22} className="text-slate-500" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [metrics, setMetrics] = useState(null)
  const [slaBreached, setSlaBreached] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all')
  const [openDateFilter, setOpenDateFilter] = useState(null)

  async function loadReports() {
    setLoading(true)
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

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports() 
  }, [dateRange])

  function exportToExcel() {
    const summary = metrics?.summary || {}
    const resumenData = [['Métrica', 'Valor'], ['Total Tickets', summary.totalTickets || 0], ['Tickets Abiertos', summary.openTickets || 0], ['Tickets En Proceso', summary.inProgressTickets || 0], ['Tickets Resueltos', summary.resolvedTickets || 0], ['Tickets Cerrados', summary.closedTickets || 0], ['SLA Vencidos', summary.slaBreached || 0], ['SLA En Riesgo', summary.slaAtRisk || 0], ['Tiempo Promedio Resolución (h)', summary.avgResolutionHours || 0], ['Tickets Este Mes', summary.ticketsThisMonth || 0]]
    const categoriaData = [['Categoría', 'Cantidad'], ...(metrics?.ticketsByCategory || []).map(i => [i.category, i.count])]
    const prioridadData = [['Prioridad', 'Cantidad'], ...(metrics?.ticketsByPriority || []).map(i => [i.priority, i.count])]
    const estadoLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Proceso', ON_HOLD: 'En Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Esperando Confirmación', CLOSED: 'Cerrado' }
    const estadoData = [['Estado', 'Cantidad'], ...(metrics?.ticketsByStatus || []).map(i => [estadoLabels[i.status] || i.status, i.count])]
    const slaData = [['Código', 'Título', 'Categoría', 'Fecha Vencimiento'], ...slaBreached.map(t => [t.ticketCode, t.title || t.category?.name, t.category?.name, new Date(t.dueDate).toLocaleDateString('es-VE')])]
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet(resumenData)
    const ws2 = XLSX.utils.aoa_to_sheet(categoriaData)
    const ws3 = XLSX.utils.aoa_to_sheet(prioridadData)
    const ws4 = XLSX.utils.aoa_to_sheet(estadoData)
    const ws5 = XLSX.utils.aoa_to_sheet(slaData)
    const colWidths = [{ wch: 35 }, { wch: 20 }]
    ws1['!cols'] = colWidths; ws2['!cols'] = colWidths; ws3['!cols'] = colWidths; ws4['!cols'] = colWidths; ws5['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General'); XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoría'); XLSX.utils.book_append_sheet(wb, ws3, 'Por Prioridad'); XLSX.utils.book_append_sheet(wb, ws4, 'Por Estado'); XLSX.utils.book_append_sheet(wb, ws5, 'SLA Vencidos')
    const fecha = new Date().toLocaleDateString('es-VE').replace(/\//g, '-')
    XLSX.writeFile(wb, `SentinelCore_Reporte_${fecha}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Reportes...</p>
      </div>
    )
  }

  const s = metrics?.summary || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Reportes</h2>
          <p className="text-sm text-slate-500 mt-1">Analíticas del centro comercial</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button onClick={() => setOpenDateFilter(openDateFilter === 'date' ? null : 'date')} className='h-10 px-4 border border-slate-200 rounded-lg flex items-center gap-2 text-sm font-medium bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm'>
              <Calendar className='h-4 w-4' />
              {DATE_RANGES.find(r => r.value === dateRange)?.label || 'Todo'}
            </button>
            {openDateFilter === 'date' && (
              <div className='absolute right-0 mt-2 z-50 w-40 p-2 border border-slate-200 rounded-md shadow-lg bg-white'>
                {DATE_RANGES.map((opt) => (
                  <div key={opt.value} onClick={() => { setDateRange(opt.value); setOpenDateFilter(null) }} className={`px-3 py-2 rounded-sm text-sm cursor-pointer hover:bg-slate-50 ${dateRange === opt.value ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-600'}`}>
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportToExcel} className="h-10 px-4 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-all shadow-sm cursor-pointer flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs estilo minimalista */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Tickets" value={s.totalTickets || 0} subtitle={`${s.ticketsThisMonth || 0} este mes`} icon={FileText} />
        <KPICard title="Abiertos" value={s.openTickets || 0} icon={Clock} />
        <KPICard title="SLA Vencidos" value={s.slaBreached || 0} subtitle={`${s.slaAtRisk || 0} por vencer`} icon={AlertTriangle} />
        <KPICard title="Tiempo Promedio" value={`${s.avgResolutionHours || 0}h`} icon={CheckCircle} />
      </div>

      {/* Tickets por Estado - Estilo minimalista */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Tickets por Estado</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {(metrics?.ticketsByStatus || []).map((item) => {
            const statusLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'Proceso', ON_HOLD: 'Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Confirmar', CLOSED: 'Cerrado' }
            return (
              <div key={item.status} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center hover:bg-slate-100 transition-colors">
                <p className="text-xl font-bold text-slate-800">{item.count}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">{statusLabels[item.status] || item.status}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tickets por Prioridad - Estilo minimalista */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Tickets por Prioridad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(metrics?.ticketsByPriority || []).map((item) => {
            const priorityLabels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' }
            return (
              <div key={item.priority} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-center hover:bg-slate-100 transition-colors">
                <p className="text-xl font-bold text-slate-800">{item.count}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-1">{priorityLabels[item.priority] || item.priority}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tickets por Categoría - Barras minimalistas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">Tickets por Categoría</h3>
        <div className="space-y-3">
          {(metrics?.ticketsByCategory || []).map((item) => {
            const maxCount = Math.max(...(metrics?.ticketsByCategory || []).map(i => i.count), 1)
            const barWidth = Math.round((item.count / maxCount) * 100)
            return (
              <div key={item.category} className="flex items-center gap-4">
                <div className="w-32 text-xs font-medium text-slate-600 truncate text-right">{item.category}</div>
                <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
                  <div className="h-full bg-slate-400 rounded transition-all duration-500" style={{ width: `${barWidth}%` }} />
                </div>
                <div className="w-12 text-xs font-bold text-slate-700 text-right">{item.count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SLA Vencidos - Estilo minimalista sin rojo fuerte */}
      {slaBreached.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-base font-semibold text-slate-800 font-display">Tickets con SLA Vencido</h3>
            <p className="text-xs text-slate-500 mt-0.5">Requiere atención</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {slaBreached.slice(0, 6).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">{t.ticketCode}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{t.title || t.category?.name}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{t.category?.name || '—'}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(t.dueDate).toLocaleDateString('es-VE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {slaBreached.length > 6 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <p className="text-xs text-slate-400">Y {slaBreached.length - 6} tickets más</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}