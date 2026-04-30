const STATUS_LABELS = {
  OPEN: 'Reportado',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  AWAITING_CONFIRMATION: 'Confirmacion',
  CLOSED: 'Cerrado',
}

const STEPS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'CLOSED']


export default function LiveTracker({ ticketCode, title, currentStatus, technicianName, eta, priority }) {
  const currentIndex = STEPS.indexOf(currentStatus)

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
      {/* Header del ticket */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 bg-blue-950 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Ticket Activo
            </span>
            <h3 className="text-xl font-bold text-slate-900 font-display">
              {title || 'Incidencia en curso'}
            </h3>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="font-mono font-bold text-slate-600">#{ticketCode}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-slate-600 font-bold uppercase text-[9px]">Prioridad {priority}</span>
            {eta && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-slate-600 font-semibold">ETA: {eta}</span>
              </>
            )}
          </div>
        </div>

        {technicianName && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Técnico Asignado</p>
              <p className="text-sm font-bold text-blue-950">{technicianName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between relative mt-4">
        <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 rounded-full" />
        <div
          className="absolute top-4 left-8 h-1 bg-blue-950 rounded-full transition-all duration-700 ease-in-out"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * (100 - 16)}%` }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isPending = i > currentIndex

          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  isCompleted
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : isCurrent
                      ? 'bg-white border-4 border-blue-600 text-blue-600 scale-110 shadow-xl shadow-blue-100'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : isCurrent ? (
                   <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
              <span
                className={`mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                  isPending ? 'text-slate-300' : isCurrent ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Info adicional sin emojis */}
      {technicianName && !ticketCode && (
        <div className="mt-6 flex items-center gap-6 text-xs text-text-secondary">
          <span>Tecnico: <strong className="text-text-primary">{technicianName}</strong></span>
          {eta && (
            <span>ETA: <strong className="text-text-primary">{eta}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}
