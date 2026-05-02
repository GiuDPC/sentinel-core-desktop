/**
 * Constantes compartidas para el frontend de Sentinel Core.
 * Centraliza labels, colores y opciones de tickets para evitar duplicación.
 */

export const TICKET_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  ON_HOLD: 'ON_HOLD',
  AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
}

export const STATUS_LABELS = {
  OPEN: 'Abierto',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En Proceso',
  ON_HOLD: 'En Espera',
  AWAITING_CONFIRMATION: 'Esperando Confirmacion',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'Abierto' },
  { value: 'ASSIGNED', label: 'Asignado' },
  { value: 'IN_PROGRESS', label: 'En Proceso' },
  { value: 'ON_HOLD', label: 'En Espera' },
  { value: 'AWAITING_CONFIRMATION', label: 'Esperando Confirmacion' },
  { value: 'RESOLVED', label: 'Resuelto' },
  { value: 'CLOSED', label: 'Cerrado' },
]

export const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
}

export const PRIORITY_COLORS = {
  LOW: 'text-text-secondary',
  MEDIUM: 'text-warning',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-danger',
}

export const STATUS_COLORS = {
  OPEN: 'bg-accent',
  ASSIGNED: 'bg-warning',
  IN_PROGRESS: 'bg-orange-400',
  ON_HOLD: 'bg-gray-400',
  AWAITING_CONFIRMATION: 'bg-blue-400',
  RESOLVED: 'bg-success',
  CLOSED: 'bg-gray-300',
}

export const AUDIT_ACTION_LABELS = {
  TICKET_CREATED: 'Ticket creado',
  STATUS_CHANGE: 'Cambio de estado',
  PRIORITY_CHANGE: 'Cambio de prioridad',
  ASSIGNMENT: 'Asignación',
  REASSIGNMENT: 'Reasignación',
  RESOLUTION_NOTE: 'Nota de resolución',
  TICKET_CONFIRMED: 'Ticket confirmado',
  TICKET_REOPENED: 'Ticket reabierto',
}
