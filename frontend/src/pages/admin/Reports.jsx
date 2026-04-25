import { useState, useEffect } from 'react'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'
import * as XLSX from 'xlsx'

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

  useEffect(() => { loadReports() }, [dateRange])

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

  function exportToExcel() {
    const summary = metrics?.summary || {}

    // Hoja 1: Resumen General
    const resumenData = [
      ['Metrica', 'Valor'],
      ['Total Tickets', summary.totalTickets || 0],
      ['Tickets Abiertos', summary.openTickets || 0],
      ['Tickets En Proceso', summary.inProgressTickets || 0],
      ['Tickets Resueltos', summary.resolvedTickets || 0],
      ['Tickets Cerrados', summary.closedTickets || 0],
      ['SLA Vencidos', summary.slaBreached || 0],
      ['SLA En Riesgo', summary.slaAtRisk || 0],
      ['Tiempo Promedio Resolucion (h)', summary.avgResolutionHours || 0],
      ['Tickets Este Mes', summary.ticketsThisMonth || 0],
    ]

    // Hoja 2: Por Categoría
    const categoriaData = [
      ['Categoria', 'Cantidad'],
      ...(metrics?.ticketsByCategory || []).map(i => [i.category, i.count]),
    ]

    // Hoja 3: Por Prioridad
    const prioridadData = [
      ['Prioridad', 'Cantidad'],
      ...(metrics?.ticketsByPriority || []).map(i => [i.priority, i.count]),
    ]

    // Hoja 4: Por Estado
    const estadoLabels = {
      OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Proceso',
      ON_HOLD: 'En Espera', RESOLVED: 'Resuelto',
      AWAITING_CONFIRMATION: 'Esperando Confirmacion', CLOSED: 'Cerrado',
    }
    const estadoData = [
      ['Estado', 'Cantidad'],
      ...(metrics?.ticketsByStatus || []).map(i => [estadoLabels[i.status] || i.status, i.count]),
    ]

    // Hoja 5: SLA Vencidos
    const slaData = [
      ['Codigo', 'Titulo', 'Categoria', 'Fecha Vencimiento'],
      ...slaBreached.map(t => [
        t.ticketCode,
        t.title || t.category?.name,
        t.category?.name,
        new Date(t.dueDate).toLocaleDateString('es-VE'),
      ]),
    ]

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet(resumenData)
    const ws2 = XLSX.utils.aoa_to_sheet(categoriaData)
    const ws3 = XLSX.utils.aoa_to_sheet(prioridadData)
    const ws4 = XLSX.utils.aoa_to_sheet(estadoData)
    const ws5 = XLSX.utils.aoa_to_sheet(slaData)

    // Ancho de columnas profesional
    const colWidths = [{ wch: 35 }, { wch: 20 }]
    ws1['!cols'] = colWidths
    ws2['!cols'] = colWidths
    ws3['!cols'] = colWidths
    ws4['!cols'] = colWidths
    ws5['!cols'] = [{ wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 18 }]

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen General')
    XLSX.utils.book_append_sheet(wb, ws2, 'Por Categoria')
    XLSX.utils.book_append_sheet(wb, ws3, 'Por Prioridad')
    XLSX.utils.book_append_sheet(wb, ws4, 'Por Estado')
    XLSX.utils.book_append_sheet(wb, ws5, 'SLA Vencidos')

    const fecha = new Date().toLocaleDateString('es-VE').replace(/\//g, '-')
    XLSX.writeFile(wb, `SentinelCore_Reporte_${fecha}.xlsx`)
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary font-display">Reportes</h2>
          <p className="text-sm text-text-secondary mt-1">Analiticas del centro comercial</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {DATE_RANGES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors cursor-pointer flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-accent font-display">{s.totalTickets || 0}</p>
          <p className="text-sm text-text-secondary mt-1">Tickets Totales</p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-warning font-display">{s.openTickets || 0}</p>
          <p className="text-sm text-text-secondary mt-1">Abiertos</p>
        </div>
        <div className="bg-surface rounded-xl p-6 shadow-sm text-center">
          <p className="text-3xl font-bold text-success font-display">{s.avgResolutionHours || 0}h</p>
          <p className="text-sm text-text-secondary mt-1">Resolucion Promedio</p>
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
            const labels = { LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Critica' }
            return (
              <div key={item.priority} className="flex items-center justify-between">
                <span className="text-sm text-text-primary w-20">{labels[item.priority] || item.priority}</span>
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
          <h3 className="text-sm font-semibold text-danger mb-4 font-display">Tickets con SLA Vencido</h3>
          <div className="space-y-3">
            {slaBreached.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-danger/5 rounded-lg">
                <div>
                  <span className="font-mono text-xs text-danger">{t.ticketCode}</span>
                  <p className="text-sm text-text-primary">{t.title || t.category?.name}</p>
                </div>
                <span className="text-xs text-danger font-medium">
                  Vencio: {new Date(t.dueDate).toLocaleDateString('es-VE')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
