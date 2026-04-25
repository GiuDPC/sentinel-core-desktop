const STATUS_LABELS = {
  OPEN: 'Reportado',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  AWAITING_CONFIRMATION: 'Confirmacion',
  CLOSED: 'Cerrado',
}

const STEPS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'CLOSED']

/**
 * Stepper horizontal de progreso del ticket — profesional, sin emojis.
 */
export default function LiveTracker({ ticketCode, title, currentStatus, technicianName, eta, priority }) {
  const currentIndex = STEPS.indexOf(currentStatus)

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm">
      {/* Header del ticket */}
      {ticketCode && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-md font-mono">
              TICKET {ticketCode}
            </span>
            <span className="text-sm text-text-primary font-medium">
              {title || 'Ticket en Proceso'}
            </span>
          </div>
          {technicianName && (
            <div className="text-right">
              <p className="text-xs text-text-secondary">Tecnico Asignado</p>
              <p className="text-sm font-semibold text-text-primary">{technicianName}</p>
              {eta && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs font-bold rounded">
                  ETA {eta}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!ticketCode && (
        <h3 className="text-sm font-semibold text-text-primary mb-6 font-display">
          Estado del Ticket
        </h3>
      )}

      {priority && (
        <p className="text-xs text-text-secondary mb-4">
          Reportado hace poco - Prioridad {priority}
        </p>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-border" />
        <div
          className="absolute top-4 left-8 h-0.5 bg-accent transition-all duration-500"
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * (100 - 16)}%` }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isPending = i > currentIndex

          return (
            <div key={step} className="relative flex flex-col items-center z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isCompleted
                    ? 'bg-success text-white'
                    : isCurrent
                      ? 'bg-accent text-white ring-4 ring-accent/20'
                      : 'bg-border text-text-secondary'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : i + 1}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isPending ? 'text-text-secondary/50' : 'text-text-primary'
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
