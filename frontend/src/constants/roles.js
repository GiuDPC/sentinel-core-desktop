/**
 * Mapeo de roles para visualización en el frontend.
 * Centraliza las etiquetas en español y sus estilos asociados.
 */

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico Especialista',
  REQUESTER: 'Locatario / Encargado',
};

export const ROLE_COLORS = {
  ADMIN: 'bg-blue-50 text-blue-700',
  TECHNICIAN: 'bg-amber-50 text-amber-700',
  REQUESTER: 'bg-emerald-50 text-emerald-700',
};

export const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'REQUESTER', label: 'Locatario' },
];
