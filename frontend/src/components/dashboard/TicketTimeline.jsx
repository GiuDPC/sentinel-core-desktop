import { motion as Motion } from 'framer-motion'
import { Clock, UserPlus, Play, Pause, CheckCircle, RefreshCcw, MessageSquare, FileCheck, ArrowRightLeft, AlertCircle, CircleDot } from 'lucide-react'

const ACTION_CONFIG = {
  TICKET_CREATED: { label: 'Ticket Creado', icon: CircleDot, color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  STATUS_CHANGE: { label: 'Cambio de Estado', icon: ArrowRightLeft, color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  ASSIGNMENT: { label: 'Asignación Técnica', icon: UserPlus, color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
  REASSIGNMENT: { label: 'Reasignación', icon: ArrowRightLeft, color: 'bg-indigo-500', textColor: 'text-indigo-700', bgColor: 'bg-indigo-50' },
  RESOLUTION_NOTE: { label: 'Resolución Técnica', icon: FileCheck, color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  TICKET_REOPENED: { label: 'Ticket Reabierto', icon: RefreshCcw, color: 'bg-rose-500', textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
  TICKET_CONFIRMED: { label: 'Confirmado por Solicitante', icon: CheckCircle, color: 'bg-emerald-600', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  COMMENT: { label: 'Comentario', icon: MessageSquare, color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50' },
}

const STATUS_LABELS = {
  OPEN: 'Abierto', ASSIGNED: 'Asignado', IN_PROGRESS: 'En Proceso', ON_HOLD: 'En Espera',
  RESOLVED: 'Resuelto', AWAITING_CONFIRMATION: 'Por Confirmar', CLOSED: 'Cerrado',
}

function formatValue(value) {
  if (!value) return null
  const labels = {
    ...STATUS_LABELS, 'LOW': 'Baja', 'MEDIUM': 'Media', 'HIGH': 'Alta', 'CRITICAL': 'Crítica',
    'ADMIN': 'Administrador', 'TECHNICIAN': 'Técnico', 'REQUESTER': 'Solicitante'
  }
  return labels[value] || value
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return 'Hace un momento'
  if (diffMin < 60) return `Hace ${diffMin}m`
  if (diffHrs < 24) return `Hace ${diffHrs}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

export default function TicketTimeline({ auditLogs = [] }) {
  if (auditLogs.length === 0) {
    return (
      <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 text-slate-200 mx-auto mb-3" />
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin actividad registrada</p>
      </div>
    )
  }

  return (
    <div className="relative isolate px-1">
      <Motion.div 
        initial={{ height: 0 }}
        animate={{ height: '100%' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute left-[19px] top-10 w-px bg-gradient-to-b from-slate-200 via-slate-100 to-transparent z-0 origin-top" 
      />

      <Motion.div 
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="space-y-1"
      >
        {auditLogs.map((log) => {
          const config = ACTION_CONFIG[log.action] || {
            label: log.action, icon: Clock, color: 'bg-slate-300', textColor: 'text-slate-500', bgColor: 'bg-slate-50'
          }
          const Icon = config.icon
          const oldVal = formatValue(log.oldValue)
          const newVal = formatValue(log.newValue)

          return (
            <Motion.div
              key={log.id}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
              }}
              className="relative flex items-start gap-4 py-3 px-2 rounded-xl transition-colors hover:bg-slate-50/80 group"
            >
              <Motion.div 
                whileHover={{ scale: 1.15, rotate: 5 }}
                className={`relative z-10 w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shadow-sm shrink-0`}
              >
                <Icon size={16} className="text-white" strokeWidth={2.5} />
              </Motion.div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${config.bgColor} ${config.textColor}`}>
                      {config.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0" title={new Date(log.createdAt).toLocaleString('es-VE')}>
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 mt-1.5 font-medium">
                  <span className="font-bold text-slate-900">{log.user?.firstName} {log.user?.lastName}</span>
                  {log.action === 'STATUS_CHANGE' && oldVal && newVal && (
                    <span className="text-slate-500"> cambió estado de <span className="font-semibold text-slate-600">{oldVal}</span> a <span className="font-semibold text-slate-900">{newVal}</span></span>
                  )}
                  {log.action === 'ASSIGNMENT' && newVal && (
                    <span className="text-slate-500"> asignó a <span className="font-semibold text-slate-900">{newVal}</span></span>
                  )}
                  {log.action === 'RESOLUTION_NOTE' && <span className="text-slate-500"> envió nota de resolución</span>}
                  {log.action === 'TICKET_CREATED' && <span className="text-slate-500"> creó el ticket</span>}
                  {log.action === 'TICKET_REOPENED' && <span className="text-slate-500"> reabrió el ticket</span>}
                  {log.action === 'TICKET_CONFIRMED' && <span className="text-slate-500"> confirmó la resolución</span>}
                </p>

                {(log.action === 'RESOLUTION_NOTE' || log.action === 'TICKET_REOPENED') && log.newValue && (
                  <div className={`mt-2 px-3 py-2 rounded-lg text-[11px] leading-relaxed border ${
                    log.action === 'TICKET_REOPENED' ? 'bg-rose-50/50 border-rose-100 text-rose-700' : 'bg-emerald-50/50 border-emerald-100 text-emerald-700'
                  }`}>
                    "{log.newValue}"
                  </div>
                )}
              </div>
            </Motion.div>
          )
        })}
      </Motion.div>
    </div>
  )
}