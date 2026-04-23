const STATUS_LABELS = {
  OPEN: 'Reportado',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En Proceso',
  RESOLVED: 'Completado',
  CLOSED: 'Cerrado',
}

const STEPS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']

/**
 * Stepper horizontal de progreso del ticket.
 * @param {Object} props
 * @param {string} props.currentStatus — Estado actual del ticket
 * @param {string} [props.technicianName] — Nombre del técnico asignado
 * @param {string} [props.eta] — Tiempo estimado de resolución
 */
export default function LiveTracker({ currentStatus, technicianName, eta }) {
  const currentIndex = STEPS.indexOf(currentStatus)

  return (
    <div className="bg-surface rounded-xl p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-text-primary mb-6 font-display">
        Estado del Ticket
      </h3>

      {/* Stepper */}
      <div className="flex items-center justify-between relative">
        {/* Línea de fondo */}
        <div className="absolute top-4 left-8 right-8 h-0.5 bg-border" />
        {/* Línea de progreso */}
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
                {isCompleted ? '✓' : i + 1}
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

      {/* Info adicional */}
      {(technicianName || eta) && (
        <div className="mt-6 flex items-center gap-6 text-xs text-text-secondary">
          {technicianName && (
            <span>👷 Técnico: <strong className="text-text-primary">{technicianName}</strong></span>
          )}
          {eta && (
            <span>⏱️ ETA: <strong className="text-text-primary">{eta}</strong></span>
          )}
        </div>
      )}
    </div>
  )
}
