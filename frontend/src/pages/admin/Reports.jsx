import { useState, useEffect } from 'react'
import { metricsApi } from '../../api/metrics'
import * as XLSX from 'xlsx'
import { Download, Calendar, FileText, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import KPICard from '../../components/dashboard/KPICard'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const DATE_RANGES = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mes' },
  { value: 'all', label: 'Todo' },
]


export default function Reports() {
  const [metrics, setMetrics] = useState(null)
  const [slaBreached, setSlaBreached] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('all')
  const [openDateFilter, setOpenDateFilter] = useState(null)
  const [activeTab, setActiveTab] = useState('resumen_general')

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Reportes</h2>
          <p className="text-sm text-slate-500 mt-1 mb-5">Analíticas del centro comercial</p>
          
          {/* Pestañas compactas */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg w-max">
            <button
              onClick={() => setActiveTab('resumen_general')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activeTab === 'resumen_general'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Resumen General
            </button>
            <button
              onClick={() => setActiveTab('analisis_detallado')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                activeTab === 'analisis_detallado'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              Análisis Detallado
            </button>
          </div>
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

      {/* Contenido: Resumen General */}
      {activeTab === 'resumen_general' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPIs estilo minimalista */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard title="Total Tickets" value={s.totalTickets || 0} subtitle={`${s.ticketsThisMonth || 0} este mes`} icon={FileText} />
            <KPICard title="Abiertos" value={s.openTickets || 0} icon={Clock} />
            <KPICard title="SLA Vencidos" value={s.slaBreached || 0} subtitle={`${s.slaAtRisk || 0} por vencer`} icon={AlertTriangle} />
            <KPICard title="Tiempo Promedio" value={`${s.avgResolutionHours || 0}h`} icon={CheckCircle} />
          </div>

          {/* Tickets por Estado - BarChart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Tickets por Estado</h3>
              <p className="text-xs text-slate-400 mt-1">Volumen actual según fase de atención</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={(metrics?.ticketsByStatus || []).map(i => {
                  const statusLabels = { OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'Proceso', ON_HOLD: 'Espera', RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Confirmar', CLOSED: 'Cerrado' }
                  return { name: statusLabels[i.status] || i.status, total: i.count, status: i.status }
                })}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px', fontWeight: 'bold' }} 
                />
                <Bar dataKey="total" fill="#0f172a" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tendencia por Prioridad - AreaChart (full width) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Tendencia por Prioridad</h3>
                <p className="text-xs text-slate-400 mt-1">Distribución semanal simulada</p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" />Baja</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Media</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" />Alta</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" />Crítica</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(() => {
                const pMap = {}; (metrics?.ticketsByPriority || []).forEach(i => { pMap[i.priority] = i.count })
                const base = { LOW: pMap.LOW || 0, MEDIUM: pMap.MEDIUM || 0, HIGH: pMap.HIGH || 0, CRITICAL: pMap.CRITICAL || 0 }
                return ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d) => ({
                  day: d,
                  Baja: Math.max(0, base.LOW + Math.round((Math.random() - 0.5) * 3)),
                  Media: Math.max(0, base.MEDIUM + Math.round((Math.random() - 0.5) * 3)),
                  Alta: Math.max(0, base.HIGH + Math.round((Math.random() - 0.5) * 2)),
                  Crítica: Math.max(0, base.CRITICAL + Math.round((Math.random() - 0.5) * 1)),
                }))
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Baja" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Media" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Alta" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="Crítica" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Contenido: Análisis Detallado */}
      {activeTab === 'analisis_detallado' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Componentes apilados verticalmente */}
          <div className="grid grid-cols-1 gap-6">
            {/* Tickets por Categoría */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Tickets por Categoría</h3>
                <p className="text-xs text-slate-400 mt-1">Volumen de incidencias por área</p>
              </div>
              <div className="w-full">
                <ResponsiveContainer width="100%" height={Math.max(300, (metrics?.ticketsByCategory || []).length * 48)}>
                  <BarChart
                    layout="vertical"
                    data={(metrics?.ticketsByCategory || []).map(i => ({ name: i.category, total: i.count }))}
                    margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tick={{ fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={150} tick={{ fill: '#475569' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                    <Bar dataKey="total" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SLA Vencidos */}
            {slaBreached.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Tickets con SLA Vencido</h3>
                  <p className="text-xs text-slate-400 mt-1">Requiere atención inmediata</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {slaBreached.slice(0, 8).map((t) => (
                    <div key={t.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">{t.ticketCode}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{t.title || t.category?.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.category?.name || '—'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-3">{new Date(t.dueDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  ))}
                </div>
                {slaBreached.length > 8 && (
                  <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 text-center shrink-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+{slaBreached.length - 8} más</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={24} className="text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-700">Sin SLA vencidos</p>
                <p className="text-xs text-slate-400 mt-1">Todos los tickets están dentro de plazo</p>
              </div>
            )}
          </div>
          
          {/* <div className="grid grid-cols-1 gap-6"> */}
            {/* Espacio reservado para inyectar nuevas tarjetas/tablas de análisis detallado en el futuro */}
          {/* </div> */}
        </div>
      )}
    </div>
  )
}