const STATUS_CONFIG = {
  OPEN: { label: 'Abierto', color: 'bg-accent/10 text-accent' },
  ASSIGNED: { label: 'Asignado', color: 'bg-warning/10 text-warning' },
  IN_PROGRESS: { label: 'En Proceso', color: 'bg-orange-100 text-orange-600' },
  ON_HOLD: { label: 'En Espera', color: 'bg-gray-100 text-gray-600' },
  RESOLVED: { label: 'Resuelto', color: 'bg-success/10 text-success' },
  AWAITING_CONFIRMATION: { label: 'Esperando Confirmacion', color: 'bg-purple-100 text-purple-600' },
  CLOSED: { label: 'Cerrado', color: 'bg-gray-200 text-gray-500' },
}

/**
 * Badge de estado de ticket con color semántico.
 * @param {Object} props
 * @param {string} props.status — Estado del ticket
 */
export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}
